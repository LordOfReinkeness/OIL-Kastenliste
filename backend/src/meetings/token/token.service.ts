import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceService } from '../attendance/attendance.service';
import { MeetingsService } from '../meetings.service';
import { Meeting } from '../meeting.entity';
import { InfractionType, UserMeeting } from '../../user-meetings/user-meeting.entity';
import { UsersService } from '../../users/users.service';
import { CheckinDto } from './dto/checkin.dto';
import { ExcuseDto } from './dto/excuse.dto';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(UserMeeting)
    private readonly userMeetings: Repository<UserMeeting>,
    private readonly meetingsService: MeetingsService,
    private readonly usersService: UsersService,
    private readonly attendanceService: AttendanceService,
  ) {}

  getMeetingByToken(token: string): Promise<Meeting> {
    // TODO: strip answer for non-admin once auth is implemented
    return this.meetingsService.findByToken(token);
  }

  async checkIn(
    token: string,
    dto: CheckinDto,
  ): Promise<{ message: string; answerCorrect: boolean; attemptsRemaining?: number }> {
    const meeting = await this.meetingsService.findByToken(token);
    const user = await this.usersService.findByRzId(dto.rzId).catch(() => {
      throw new NotFoundException('user not found');
    });

    let record = await this.userMeetings.findOneBy({ meetingId: meeting.id, userId: user.id });

    if (record?.checkedInAt) throw new ConflictException('already checked in');

    // No question or answer not checked — accept unconditionally
    if (!meeting.question || !meeting.checkAnswer) {
      if (!record) {
        record = this.userMeetings.create({ meetingId: meeting.id, userId: user.id });
      }
      record.checkedInAt = new Date();
      record.attendanceType = dto.attendanceType;
      record.answerCorrect = meeting.question ? true : null;
      record.infraction = this.attendanceService.computeInfraction(record);
      await this.userMeetings.save(record);
      return { message: 'checked in', answerCorrect: true };
    }

    // Answer must be checked
    if (!record) {
      record = this.userMeetings.create({
        meetingId: meeting.id,
        userId: user.id,
        answerAttempts: 0,
      });
    }

    const correct = dto.answer?.trim().toLowerCase() === meeting.answer!.trim().toLowerCase();

    if (correct) {
      record.checkedInAt = new Date();
      record.attendanceType = dto.attendanceType;
      record.answerCorrect = true;
      record.infraction = this.attendanceService.computeInfraction(record);
      await this.userMeetings.save(record);
      return { message: 'checked in', answerCorrect: true };
    }

    record.answerAttempts += 1;
    await this.userMeetings.save(record);

    const attemptsRemaining = (meeting.maxRetries ?? 0) - record.answerAttempts;

    if (attemptsRemaining <= 0) {
      throw new ForbiddenException({ message: 'max retries reached', answerCorrect: false, attemptsRemaining: 0 });
    }

    return { message: 'wrong answer', answerCorrect: false, attemptsRemaining };
  }

  async submitExcuse(token: string, dto: ExcuseDto): Promise<{ message: string }> {
    const meeting = await this.meetingsService.findByToken(token);
    const user = await this.usersService.findByRzId(dto.rzId).catch(() => {
      throw new NotFoundException('user not found');
    });

    const excuseDeadline = new Date(
      new Date(meeting.date).getTime() - meeting.excuseDeadlineMinutes * 60_000,
    );
    if (new Date() >= excuseDeadline) throw new ForbiddenException('excuse deadline passed');

    const existing = await this.userMeetings.findOneBy({ meetingId: meeting.id, userId: user.id });
    if (existing?.excusedAt || existing?.checkedInAt) throw new ConflictException('already submitted');

    const record = existing ?? this.userMeetings.create({ meetingId: meeting.id, userId: user.id });
    record.excusedAt = new Date();
    record.excuseType = dto.excuseType;
    record.infraction = this.attendanceService.computeInfraction(record);
    await this.userMeetings.save(record);

    return { message: 'excuse submitted' };
  }
}
