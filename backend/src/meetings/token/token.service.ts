import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MeetingsService } from '../meetings.service';
import { Meeting } from '../meeting.entity';
import { UserMeetingsService } from '../../user-meetings/user-meetings.service';
import { UsersService } from '../../users/users.service';
import { LiveCheckinDto } from './dto/live-checkin.dto';
import { PostCheckinDto } from './dto/post-checkin.dto';
import { ExcuseDto } from './dto/excuse.dto';

@Injectable()
export class TokenService {
  constructor(
    private readonly meetingsService: MeetingsService,
    private readonly usersService: UsersService,
    private readonly userMeetingsService: UserMeetingsService,
  ) {}

  getMeetingByToken(token: string): Promise<Meeting> {
    return this.meetingsService.findByToken(token);
  }

  private isLiveWindowOpen(meeting: Meeting): boolean {
    return meeting.liveCheckinOpen;
  }

  async liveCheckIn(
    token: string,
    dto: LiveCheckinDto,
  ): Promise<{ message: string }> {
    const meeting = await this.meetingsService.findByToken(token);
    const user = await this.usersService.findByRzId(dto.rzId).catch(() => {
      throw new NotFoundException('user not found');
    });

    if (!this.isLiveWindowOpen(meeting))
      throw new ForbiddenException('live check-in is not open');

    let record = await this.userMeetingsService.findOne(user.id, meeting.id);
    if (record?.liveCheckedInAt)
      throw new ConflictException('already checked in');

    if (!record) record = this.userMeetingsService.init(user.id, meeting.id);
    record.liveCheckedInAt = new Date();
    record.attendanceType = dto.attendanceType;
    await this.userMeetingsService.syncInfractions(record, meeting, user.id);

    return { message: 'checked in' };
  }

  async postCheckIn(
    token: string,
    dto: PostCheckinDto,
  ): Promise<{
    message: string;
    answerCorrect?: boolean;
    attemptsRemaining?: number;
  }> {
    const meeting = await this.meetingsService.findByToken(token);
    const user = await this.usersService.findByRzId(dto.rzId).catch(() => {
      throw new NotFoundException('user not found');
    });

    if (new Date() >= new Date(meeting.checkinDeadline)) {
      throw new ForbiddenException('check-in deadline passed');
    }

    let record = await this.userMeetingsService.findOne(user.id, meeting.id);

    if (record?.liveCheckedInAt)
      throw new ConflictException('already checked in live');
    if (record?.postCheckedInAt)
      throw new ConflictException('already checked in');

    // No question or answer not checked — accept unconditionally
    if (!meeting.question || !meeting.checkAnswer) {
      if (!record) record = this.userMeetingsService.init(user.id, meeting.id);
      record.postCheckedInAt = new Date();
      record.answerCorrect = meeting.question ? true : null;
      await this.userMeetingsService.syncInfractions(record, meeting, user.id);
      return {
        message: 'checked in',
        answerCorrect: meeting.question ? true : undefined,
      };
    }

    // Answer must be checked
    if (!dto.answer?.trim())
      throw new BadRequestException('answer is required');

    if (!record) {
      record = this.userMeetingsService.init(user.id, meeting.id, { answerAttempts: 0 });
    }

    const correct =
      dto.answer.trim().toLowerCase() === meeting.answer!.trim().toLowerCase();

    if (correct) {
      record.postCheckedInAt = new Date();
      record.answerCorrect = true;
      await this.userMeetingsService.syncInfractions(record, meeting, user.id);
      return { message: 'checked in', answerCorrect: true };
    }

    record.answerAttempts += 1;
    await this.userMeetingsService.save(record);

    const attemptsRemaining = meeting.maxRetries - record.answerAttempts;
    if (attemptsRemaining <= 0) {
      throw new ForbiddenException({
        message: 'max retries reached',
        answerCorrect: false,
        attemptsRemaining: 0,
      });
    }

    return { message: 'wrong answer', answerCorrect: false, attemptsRemaining };
  }

  async submitExcuseForMeeting(
    meeting: Meeting,
    dto: ExcuseDto,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findByRzId(dto.rzId).catch(() => {
      throw new NotFoundException('user not found');
    });

    const excuseDeadline = new Date(
      new Date(meeting.date).getTime() - meeting.excuseDeadlineMinutes * 60_000,
    );

    if (new Date() >= excuseDeadline)
      throw new ForbiddenException('excuse deadline passed');

    const existing = await this.userMeetingsService.findOne(user.id, meeting.id);

    if (existing?.excusedAt || existing?.liveCheckedInAt)
      throw new ConflictException('already submitted');

    const record = existing ?? this.userMeetingsService.init(user.id, meeting.id);
    record.excusedAt = new Date();
    record.excuseType = dto.excuseType;
    await this.userMeetingsService.syncInfractions(record, meeting, user.id);

    return { message: 'excuse submitted' };
  }

  async submitExcuse(
    token: string,
    dto: ExcuseDto,
  ): Promise<{ message: string }> {
    const meeting = await this.meetingsService.findByToken(token);
    return this.submitExcuseForMeeting(meeting, dto);
  }
}
