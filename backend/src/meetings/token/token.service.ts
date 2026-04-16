import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeetingsService } from '../meetings.service';
import { Meeting } from '../meeting.entity';
import { UserMeeting } from '../../user-meetings/user-meeting.entity';
import { computeInfractions } from '../../user-meetings/compute-infractions';
import { UsersService } from '../../users/users.service';
import { LiveCheckinDto } from './dto/live-checkin.dto';
import { PostCheckinDto } from './dto/post-checkin.dto';
import { ExcuseDto } from './dto/excuse.dto';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(UserMeeting)
    private readonly userMeetings: Repository<UserMeeting>,
    private readonly meetingsService: MeetingsService,
    private readonly usersService: UsersService,
  ) {}

  getMeetingByToken(token: string): Promise<Meeting> {
    return this.meetingsService.findByToken(token);
  }

  private isLiveWindowOpen(meeting: Meeting): boolean {
    // Admin can force-close the window early
    if (!meeting.liveCheckinOpen) return false;
    const now = new Date();
    const windowStart = new Date(meeting.date);
    const windowEnd = new Date(meeting.date.getTime() + meeting.checkinWindowMinutes * 60_000);
    // Window auto-opens at meeting start and closes after checkinWindowMinutes
    return now >= windowStart && now < windowEnd;
  }

  async liveCheckIn(token: string, dto: LiveCheckinDto): Promise<{ message: string }> {
    const meeting = await this.meetingsService.findByToken(token);
    const user = await this.usersService.findByRzId(dto.rzId).catch(() => {
      throw new NotFoundException('user not found');
    });

    if (!this.isLiveWindowOpen(meeting)) throw new ForbiddenException('live check-in is not open');

    let record = await this.userMeetings.findOneBy({ meetingId: meeting.id, userId: user.id });
    if (record?.liveCheckedInAt) throw new ConflictException('already checked in');

    if (!record) record = this.userMeetings.create({ meetingId: meeting.id, userId: user.id });
    record.liveCheckedInAt = new Date();
    record.attendanceType = dto.attendanceType;
    record.infractions = computeInfractions({ ...record, liveCheckinDeadline: new Date(new Date(meeting.date).getTime() + meeting.checkinWindowMinutes * 60_000), checkinDeadline: new Date(meeting.checkinDeadline) }, meeting.capInfractions);
    await this.userMeetings.save(record);

    return { message: 'checked in' };
  }

  async postCheckIn(
    token: string,
    dto: PostCheckinDto,
  ): Promise<{ message: string; answerCorrect?: boolean; attemptsRemaining?: number }> {
    const meeting = await this.meetingsService.findByToken(token);
    const user = await this.usersService.findByRzId(dto.rzId).catch(() => {
      throw new NotFoundException('user not found');
    });

    if (new Date() >= new Date(meeting.checkinDeadline)) {
      throw new ForbiddenException('check-in deadline passed');
    }

    let record = await this.userMeetings.findOneBy({ meetingId: meeting.id, userId: user.id });

    if (record?.liveCheckedInAt) throw new ConflictException('already checked in live');
    if (record?.postCheckedInAt) throw new ConflictException('already checked in');

    // No question or answer not checked — accept unconditionally
    if (!meeting.question || !meeting.checkAnswer) {
      if (!record) record = this.userMeetings.create({ meetingId: meeting.id, userId: user.id });
      record.postCheckedInAt = new Date();
      record.answerCorrect = meeting.question ? true : null;
      record.infractions = computeInfractions({ ...record, liveCheckinDeadline: new Date(new Date(meeting.date).getTime() + meeting.checkinWindowMinutes * 60_000), checkinDeadline: new Date(meeting.checkinDeadline) }, meeting.capInfractions);
      await this.userMeetings.save(record);
      return { message: 'checked in', answerCorrect: meeting.question ? true : undefined };
    }

    // Answer must be checked
    if (!dto.answer?.trim()) throw new BadRequestException('answer is required');

    if (!record) {
      record = this.userMeetings.create({ meetingId: meeting.id, userId: user.id, answerAttempts: 0 });
    }

    const correct = dto.answer.trim().toLowerCase() === meeting.answer!.trim().toLowerCase();

    if (correct) {
      record.postCheckedInAt = new Date();
      record.answerCorrect = true;
      record.infractions = computeInfractions({ ...record, liveCheckinDeadline: new Date(new Date(meeting.date).getTime() + meeting.checkinWindowMinutes * 60_000), checkinDeadline: new Date(meeting.checkinDeadline) }, meeting.capInfractions);
      await this.userMeetings.save(record);
      return { message: 'checked in', answerCorrect: true };
    }

    record.answerAttempts += 1;
    await this.userMeetings.save(record);

    const attemptsRemaining = meeting.maxRetries - record.answerAttempts;
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
    if (existing?.excusedAt || existing?.liveCheckedInAt) throw new ConflictException('already submitted');

    const record = existing ?? this.userMeetings.create({ meetingId: meeting.id, userId: user.id });
    record.excusedAt = new Date();
    record.excuseType = dto.excuseType;
    record.infractions = computeInfractions({ ...record, liveCheckinDeadline: new Date(new Date(meeting.date).getTime() + meeting.checkinWindowMinutes * 60_000), checkinDeadline: new Date(meeting.checkinDeadline) }, meeting.capInfractions);
    await this.userMeetings.save(record);

    return { message: 'excuse submitted' };
  }
}
