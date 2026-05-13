import { Injectable, NotFoundException } from '@nestjs/common';
import { Meeting } from '../meeting.entity';
import { MeetingsService } from '../meetings.service';
import { UsersService } from '../../users/users.service';
import { ExcuseType, UserMeeting } from '../../user-meetings/user-meeting.entity';
import { UserMeetingsService } from '../../user-meetings/user-meetings.service';
import { User } from '../../users/user.entity';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

export interface AttendanceRecord {
  userId: string;
  rzId: string;
  firstName: string;
  lastName: string;
  excusedAt: Date | null;
  excuseType: ExcuseType | null;
  liveCheckedInAt: Date | null;
  postCheckedInAt: Date | null;
  isLate: boolean | null;
  attendanceType: 'in_person' | 'remote' | null;
  answerCorrect: boolean | null;
  infractions: number | null; // null = pending
  statusLastWeek: string | null;
  statusNextWeek: string | null;
  statusProblems: string | null;
}

@Injectable()
export class AttendanceService {
  constructor(
    private readonly meetingsService: MeetingsService,
    private readonly usersService: UsersService,
    private readonly userMeetingsService: UserMeetingsService,
  ) {}

  private toRecord(user: User, um: UserMeeting, infractions: number | null): AttendanceRecord {
    return {
      userId: user.id,
      rzId: user.rzId,
      firstName: user.firstName,
      lastName: user.lastName,
      excusedAt: um.excusedAt,
      excuseType: um.excuseType,
      liveCheckedInAt: um.liveCheckedInAt,
      postCheckedInAt: um.postCheckedInAt,
      isLate: um.isLate,
      attendanceType: um.attendanceType,
      answerCorrect: um.answerCorrect,
      infractions,
      statusLastWeek: um.statusLastWeek,
      statusNextWeek: um.statusNextWeek,
      statusProblems: um.statusProblems,
    };
  }

  private pendingRecord(user: User): AttendanceRecord {
    return {
      userId: user.id,
      rzId: user.rzId,
      firstName: user.firstName,
      lastName: user.lastName,
      excusedAt: null,
      excuseType: null,
      liveCheckedInAt: null,
      postCheckedInAt: null,
      isLate: null,
      attendanceType: null,
      answerCorrect: null,
      infractions: null,
      statusLastWeek: null,
      statusNextWeek: null,
      statusProblems: null,
    };
  }

  async getAttendance(
    meetingId: string,
  ): Promise<Meeting & { attendance: AttendanceRecord[] }> {
    const meeting = await this.meetingsService.findOne(meetingId);
    const [users, records] = await Promise.all([
      this.usersService.findAll(),
      this.userMeetingsService.findByMeeting(meetingId),
    ]);

    const recordMap = new Map(records.map((r) => [r.user.id, r]));

    const attendance = await Promise.all(
      users.map(async (user) => {
        const existing = recordMap.get(user.id) ?? null;
        const { infractions, record } = await this.userMeetingsService.syncInfractions(
          existing,
          meeting,
          user.id,
        );

        if (infractions === null) return this.pendingRecord(user);
        return this.toRecord(user, record!, infractions);
      }),
    );

    return { ...meeting, attendance };
  }

  async patchAttendance(
    meetingId: string,
    userId: string,
    dto: UpdateAttendanceDto,
  ): Promise<AttendanceRecord> {
    const [meeting, user] = await Promise.all([
      this.meetingsService.findOne(meetingId).catch(() => null),
      this.usersService.findOne(userId).catch(() => null),
    ]);
    if (!meeting || !user) throw new NotFoundException('meeting or user not found');

    let record = await this.userMeetingsService.findOne(userId, meetingId);
    if (!record) {
      record = this.userMeetingsService.init(userId, meetingId);
    }

    Object.assign(record, dto);
    const { infractions, record: saved } = await this.userMeetingsService.syncInfractions(
      record,
      meeting,
      userId,
    );

    return this.toRecord(user, saved!, infractions);
  }
}
