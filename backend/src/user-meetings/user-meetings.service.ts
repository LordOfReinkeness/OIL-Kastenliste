import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExcuseType, UserMeeting } from './user-meeting.entity';
import { Meeting } from '../meetings/meeting.entity';
import { User } from '../users/user.entity';
import { computeInfractions, InfractionInput } from './compute-infractions';

export interface UserMeetingEntry {
  meetingId: string;
  date: Date;
  liveCheckedIn: boolean | null;
  postCheckedIn: boolean | null;
  isLate: boolean | null;
  excuseType: ExcuseType | null;
  answerCorrect: boolean | null;
  infractions: number | null;
}

export interface UserStatsResult {
  stats: {
    totalCheckins: number;
    pending: number;
    absent: number;
    late: number;
    totalInfractions: number;
  };
  meetings: UserMeetingEntry[];
  toSave: UserMeeting[];
}

export interface SyncResult {
  infractions: number | null;
  record: UserMeeting | null;
}

@Injectable()
export class UserMeetingsService {
  constructor(
    @InjectRepository(UserMeeting)
    private readonly repo: Repository<UserMeeting>,
  ) {}

  findAll(): Promise<UserMeeting[]> {
    return this.repo.find({ relations: ['user', 'meeting'] });
  }

  findByUser(userId: string): Promise<UserMeeting[]> {
    return this.repo.find({ where: { user: { id: userId } }, relations: ['user', 'meeting'] });
  }

  findByMeeting(meetingId: string): Promise<UserMeeting[]> {
    return this.repo.find({ where: { meeting: { id: meetingId } }, relations: ['user', 'meeting'] });
  }

  findOne(userId: string, meetingId: string): Promise<UserMeeting | null> {
    return this.repo.findOne({ where: { user: { id: userId }, meeting: { id: meetingId } }, relations: ['user', 'meeting'] });
  }

  init(userId: string, meetingId: string, defaults: Partial<UserMeeting> = {}): UserMeeting {
    return this.repo.create({ user: { id: userId } as User, meeting: { id: meetingId } as Meeting, ...defaults });
  }

  save(record: UserMeeting): Promise<UserMeeting> {
    return this.repo.save(record);
  }

  saveAll(records: UserMeeting[]): Promise<UserMeeting[]> {
    return this.repo.save(records);
  }

  private liveDeadline(meeting: Meeting): Date {
    return new Date(
      new Date(meeting.date).getTime() + meeting.checkinWindowMinutes * 60_000,
    );
  }

  private buildInput(record: UserMeeting | null, meeting: Meeting): InfractionInput {
    return {
      isLate: record?.isLate ?? null,
      liveCheckedInAt: record?.liveCheckedInAt ?? null,
      postCheckedInAt: record?.postCheckedInAt ?? null,
      excuseType: record?.excuseType ?? null,
      liveCheckinDeadline: this.liveDeadline(meeting),
      checkinDeadline: new Date(meeting.checkinDeadline),
    };
  }

  private makeAbsent(userId: string, meetingId: string, infractions: number): UserMeeting {
    return this.repo.create({
      user: { id: userId } as User,
      meeting: { id: meetingId } as Meeting,
      excusedAt: null,
      excuseType: null,
      liveCheckedInAt: null,
      postCheckedInAt: null,
      isLate: null,
      attendanceType: null,
      answerCorrect: null,
      infractions,
    });
  }

  /**
   * Recomputes and persists infractions for a single user-meeting pair.
   * Returns null if deadline hasn't passed and there's no record yet (still pending).
   * Otherwise creates an absent record or updates the existing one and saves it.
   */
  async syncInfractions(
    record: UserMeeting | null,
    meeting: Meeting,
    userId: string,
  ): Promise<SyncResult> {
    const postWindowClosed = new Date() >= new Date(meeting.checkinDeadline);
    if (!record && !postWindowClosed) return { infractions: null, record: null };

    const infractions = computeInfractions(this.buildInput(record, meeting), meeting.capInfractions);

    if (!record) {
      const absent = this.makeAbsent(userId, meeting.id, infractions);
      await this.repo.save(absent);
      return { infractions, record: absent };
    }

    record.infractions = infractions;
    await this.repo.save(record);
    return { infractions, record };
  }

  /**
   * Computes per-user stats using pre-fetched data — no DB calls.
   * Returns the shaped result and records that need saving; caller does the batch save.
   */
  computeUserStats(
    user: User,
    meetings: Meeting[],
    recordMap: Map<string, UserMeeting>,
    now: Date,
  ): UserStatsResult {
    const toSave: UserMeeting[] = [];
    let totalCheckins = 0;
    let pending = 0;
    let absent = 0;
    let late = 0;
    let totalInfractions = 0;

    const meetingEntries = meetings.map((meeting): UserMeetingEntry => {
      const record = recordMap.get(meeting.id) ?? null;
      const postWindowClosed = now >= new Date(meeting.checkinDeadline);

      if (!record && !postWindowClosed) {
        pending++;
        return {
          meetingId: meeting.id,
          date: meeting.date,
          liveCheckedIn: null,
          postCheckedIn: null,
          isLate: null,
          excuseType: null,
          answerCorrect: null,
          infractions: null,
        };
      }

      const infractions = computeInfractions(
        this.buildInput(record, meeting),
        meeting.capInfractions,
      );

      if (record) {
        if (record.liveCheckedInAt) totalCheckins++;
        if (record.isLate && record.excuseType !== ExcuseType.LATE) late++;
        if (!record.liveCheckedInAt && record.excuseType !== ExcuseType.ABSENT) absent++;
        if (infractions !== record.infractions) {
          record.infractions = infractions;
          toSave.push(record);
        }
      } else {
        absent++;
        toSave.push(this.makeAbsent(user.id, meeting.id, infractions));
      }

      totalInfractions += infractions;

      return {
        meetingId: meeting.id,
        date: meeting.date,
        liveCheckedIn: record?.liveCheckedInAt != null,
        postCheckedIn: record?.postCheckedInAt != null,
        isLate: record?.isLate ?? null,
        excuseType: record?.excuseType ?? null,
        answerCorrect: record?.answerCorrect ?? null,
        infractions,
      };
    });

    return {
      stats: { totalCheckins, pending, absent, late, totalInfractions },
      meetings: meetingEntries,
      toSave,
    };
  }
}
