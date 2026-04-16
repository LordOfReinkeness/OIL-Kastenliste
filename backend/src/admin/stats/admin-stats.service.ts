import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { MeetingsService } from '../../meetings/meetings.service';
import { UsersService } from '../../users/users.service';
import { ExcuseType, UserMeeting } from '../../user-meetings/user-meeting.entity';
import { computeInfractions } from '../../user-meetings/compute-infractions';
import { Meeting } from '../../meetings/meeting.entity';

@Injectable()
export class AdminStatsService {
  constructor(
    @InjectRepository(UserMeeting)
    private readonly userMeetings: Repository<UserMeeting>,
    private readonly meetingsService: MeetingsService,
    private readonly usersService: UsersService,
  ) {}

  async getStats() {
    const [users, meetings, records] = await Promise.all([
      this.usersService.findAll(),
      this.meetingsService.findAll(),
      this.userMeetings.find(),
    ]);

    const recordMap = new Map<string, Map<string, UserMeeting>>();
    for (const r of records) {
      if (!recordMap.has(r.userId)) recordMap.set(r.userId, new Map());
      recordMap.get(r.userId)!.set(r.meetingId, r);
    }

    const now = new Date();
    const toCreate: UserMeeting[] = [];

    const result = users.map((user) => {
      const userRecords = recordMap.get(user.id) ?? new Map<string, UserMeeting>();
      let absent = 0;
      let late = 0;
      let pending = 0;
      let totalCheckins = 0;
      let totalInfractions = 0;

      const meetingEntries = meetings.map((meeting) => {
        const existing = userRecords.get(meeting.id);
        if (existing) {
          if (existing.isLate && existing.excuseType !== ExcuseType.LATE) late++;
          if (!existing.liveCheckedInAt && existing.excuseType !== ExcuseType.ABSENT) absent++;
          if (existing.liveCheckedInAt) totalCheckins++;
          totalInfractions += existing.infractions;
          return {
            id: meeting.id,
            date: meeting.date,
            liveCheckedIn: existing.liveCheckedInAt !== null,
            postCheckedIn: existing.postCheckedInAt !== null,
            isLate: existing.isLate,
            excuseType: existing.excuseType,
            infractions: existing.infractions,
          };
        }

        const isPastDeadline = now >= new Date(meeting.checkinDeadline);
        if (isPastDeadline) {
          const infractions = computeInfractions(
            { isLate: null, liveCheckedInAt: null, postCheckedInAt: null, excuseType: null, liveCheckinDeadline: new Date(new Date(meeting.date).getTime() + meeting.checkinWindowMinutes * 60_000), checkinDeadline: new Date(meeting.checkinDeadline) },
            meeting.capInfractions,
          );
          toCreate.push(
            this.userMeetings.create({
              userId: user.id,
              meetingId: meeting.id,
              excusedAt: null,
              excuseType: null,
              liveCheckedInAt: null,
              postCheckedInAt: null,
              isLate: null,
              attendanceType: null,
              answerCorrect: null,
              infractions,
            }),
          );
          absent++;
          totalInfractions += infractions;
          return {
            id: meeting.id,
            date: meeting.date,
            liveCheckedIn: false,
            postCheckedIn: false,
            isLate: null,
            excuseType: null,
            infractions,
          };
        }

        pending++;
        return {
          id: meeting.id,
          date: meeting.date,
          liveCheckedIn: null,
          postCheckedIn: null,
          isLate: null,
          excuseType: null,
          infractions: null,
        };
      });

      return {
        id: user.id,
        rzId: user.rzId,
        firstName: user.firstName,
        lastName: user.lastName,
        stats: {
          totalMeetings: meetings.length,
          totalCheckins,
          pending,
          absent,
          late,
          infractions: totalInfractions,
        },
        meetings: meetingEntries,
      };
    });

    if (toCreate.length) await this.userMeetings.save(toCreate);

    return result;
  }

  async getCsv(): Promise<string> {
    const [stats, meetings, records] = await Promise.all([
      this.getStats(),
      this.meetingsService.findAll(),
      this.userMeetings.find(),
    ]);

    const recordMap = new Map<string, Map<string, UserMeeting>>();
    for (const r of records) {
      if (!recordMap.has(r.userId)) recordMap.set(r.userId, new Map());
      recordMap.get(r.userId)!.set(r.meetingId, r);
    }

    const meetingDates = meetings.map((m) => this.formatDate(m));
    const header = ['rzId', 'firstName', 'lastName', ...meetingDates, 'total_checkins', 'pending', 'late', 'excused_absent', 'infractions'].join(',');

    const rows = stats.map((user) => {
      const userRecords = recordMap.get(user.id) ?? new Map<string, UserMeeting>();
      let excusedAbsent = 0;

      const meetingCols = meetings.map((meeting) => {
        const r = userRecords.get(meeting.id);
        if (r?.excusedAt && r.excuseType === ExcuseType.ABSENT) excusedAbsent++;
        return r?.infractions ?? 'pending';
      });

      return [
        user.rzId,
        user.firstName,
        user.lastName,
        ...meetingCols,
        user.stats.totalCheckins,
        user.stats.pending,
        user.stats.late,
        excusedAbsent,
        user.stats.infractions,
      ].join(',');
    });

    return [header, ...rows].join('\n');
  }

  async getXlsx(criticalMissing?: number): Promise<ExcelJS.Buffer> {
    const [stats, meetings, records] = await Promise.all([
      this.getStats(),
      this.meetingsService.findAll(),
      this.userMeetings.find(),
    ]);

    const recordMap = new Map<string, Map<string, UserMeeting>>();
    for (const r of records) {
      if (!recordMap.has(r.userId)) recordMap.set(r.userId, new Map());
      recordMap.get(r.userId)!.set(r.meetingId, r);
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Attendance');

    const meetingDateCols = meetings.map((m) => ({
      header: this.formatDate(m),
      key: m.id,
      width: 12,
    }));

    sheet.columns = [
      { header: 'rzId',           key: 'rzId',          width: 12 },
      { header: 'firstName',      key: 'firstName',     width: 14 },
      { header: 'lastName',       key: 'lastName',      width: 14 },
      ...meetingDateCols,
      { header: 'total_checkins', key: 'totalCheckins', width: 14 },
      { header: 'pending',        key: 'pending',       width: 10 },
      { header: 'late',           key: 'late',          width: 8  },
      { header: 'excused_absent', key: 'excusedAbsent', width: 14 },
      { header: 'infractions',    key: 'infractions',   width: 12 },
    ];

    sheet.getRow(1).font = { bold: true };

    for (const user of stats) {
      const userRecords = recordMap.get(user.id) ?? new Map<string, UserMeeting>();
      let excusedAbsent = 0;

      const meetingCols: Record<string, string | number> = {};
      for (const meeting of meetings) {
        const r = userRecords.get(meeting.id);
        if (r?.excusedAt && r.excuseType === ExcuseType.ABSENT) excusedAbsent++;
        meetingCols[meeting.id] = r?.infractions ?? 'pending';
      }

      const row = sheet.addRow({
        rzId: user.rzId,
        firstName: user.firstName,
        lastName: user.lastName,
        ...meetingCols,
        totalCheckins: user.stats.totalCheckins,
        pending: user.stats.pending,
        late: user.stats.late,
        excusedAbsent,
        infractions: user.stats.infractions,
      });

      // Color meeting infraction cells
      for (const meeting of meetings) {
        const val = meetingCols[meeting.id];
        const col = sheet.getColumn(meeting.id);
        const cell = row.getCell(col.number);
        if (typeof val === 'number' && val > 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
        } else if (val === 'pending') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
        }
      }

      // Color infractions total cell based on critical_missing threshold
      if (criticalMissing !== undefined) {
        const infractionsCell = row.getCell('infractions');
        if (user.stats.infractions >= criticalMissing) {
          infractionsCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
        } else if (user.stats.infractions === criticalMissing - 1) {
          infractionsCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFCC' } };
        }
      }
    }

    return workbook.xlsx.writeBuffer();
  }

  private formatDate(meeting: Meeting): string {
    return new Date(meeting.date).toISOString().slice(0, 10);
  }
}
