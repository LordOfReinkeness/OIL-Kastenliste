import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Meeting } from '../meeting.entity';
import { MeetingsService } from '../meetings.service';
import { UsersService } from '../../users/users.service';
import { ExcuseType, UserMeeting } from '../../user-meetings/user-meeting.entity';
import { computeInfractions } from '../../user-meetings/compute-infractions';
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
}

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(UserMeeting)
    private readonly userMeetings: Repository<UserMeeting>,
    private readonly meetingsService: MeetingsService,
    private readonly usersService: UsersService,
  ) {}

  computeInfractions(record: UserMeeting, capInfractions: boolean): number {
    return computeInfractions(record, capInfractions);
  }

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
    };
  }

  async getAttendance(
    meetingId: string,
  ): Promise<Meeting & { attendance: AttendanceRecord[] }> {
    const meeting = await this.meetingsService.findOne(meetingId);
    const [users, records] = await Promise.all([
      this.usersService.findAll(),
      this.userMeetings.findBy({ meetingId }),
    ]);

    const recordMap = new Map(records.map((r) => [r.userId, r]));
    const now = new Date();
    const isPastDeadline = now >= new Date(meeting.checkinDeadline);
    const toCreate: UserMeeting[] = [];

    const attendance = users.map((user) => {
      const existing = recordMap.get(user.id);
      if (existing) return this.toRecord(user, existing, existing.infractions);

      if (!isPastDeadline) return this.pendingRecord(user);

      const absent = this.userMeetings.create({
        userId: user.id,
        meetingId,
        excusedAt: null,
        excuseType: null,
        liveCheckedInAt: null,
        postCheckedInAt: null,
        isLate: null,
        attendanceType: null,
        answerCorrect: null,
        infractions: computeInfractions(
          { isLate: null, liveCheckedInAt: null, postCheckedInAt: null, excuseType: null },
          meeting.capInfractions,
        ),
      });
      toCreate.push(absent);
      return this.toRecord(user, absent, absent.infractions);
    });

    if (toCreate.length) await this.userMeetings.save(toCreate);

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

    let record = await this.userMeetings.findOneBy({ meetingId, userId });
    if (!record) {
      record = this.userMeetings.create({
        meetingId,
        userId,
        excusedAt: null,
        excuseType: null,
        liveCheckedInAt: null,
        postCheckedInAt: null,
        isLate: null,
        attendanceType: null,
        answerCorrect: null,
      });
    }

    Object.assign(record, dto);
    record.infractions = computeInfractions(record, meeting.capInfractions);
    await this.userMeetings.save(record);

    return this.toRecord(user, record, record.infractions);
  }
}
