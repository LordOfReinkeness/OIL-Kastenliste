import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import CreateUserDto from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';
import { UserMeeting } from '../user-meetings/user-meeting.entity';
import { Meeting } from '../meetings/meeting.entity';
import { computeInfractions } from '../user-meetings/compute-infractions';
import { RZ_ID_REGEX, RZ_ID_EXCEPTIONS } from './rz-id';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(UserMeeting)
    private readonly userMeetings: Repository<UserMeeting>,
    @InjectRepository(Meeting)
    private readonly meetings: Repository<Meeting>,
  ) {}

  validateRzId(rzId: string): { valid: boolean } {
    return { valid: RZ_ID_REGEX.test(rzId) || RZ_ID_EXCEPTIONS.includes(rzId) };
  }

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.users.findOneBy({ rzId: dto.rzId });
    if (existing) throw new ConflictException('user already exists');

    const user = this.users.create(dto);
    return this.users.save(user);
  }

  findAll(): Promise<User[]> {
    return this.users.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.users.findOneBy({ id });
    if (!user) throw new NotFoundException('user not found');
    return user;
  }

  async findByRzId(rzId: string): Promise<Pick<User, 'id' | 'rzId'>> {
    const user = await this.users.findOneBy({ rzId });
    if (!user) throw new NotFoundException('user not found');
    return { id: user.id, rzId: user.rzId };
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, dto);
    return this.users.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.users.remove(user);
  }

  async getUserStats(id: string) {
    const user = await this.findOne(id);
    const [allMeetings, records] = await Promise.all([
      this.meetings.find({ order: { date: 'ASC' } }),
      this.userMeetings.findBy({ userId: id }),
    ]);

    const recordMap = new Map(records.map((r) => [r.meetingId, r]));
    const now = new Date();
    let totalInfractions = 0;

    const meetingEntries = allMeetings.map((meeting) => {
      const r = recordMap.get(meeting.id);
      const isPastDeadline = now >= new Date(meeting.checkinDeadline);

      if (r) {
        totalInfractions += r.infractions;
        return {
          id: meeting.id,
          date: meeting.date,
          excuseType: r.excuseType,
          liveCheckedIn: !!r.liveCheckedInAt,
          postCheckedIn: !!r.postCheckedInAt,
          isLate: r.isLate,
          answerCorrect: r.answerCorrect,
          infractions: r.infractions,
        };
      }

      if (!isPastDeadline) {
        return {
          id: meeting.id,
          date: meeting.date,
          excuseType: null,
          liveCheckedIn: false,
          postCheckedIn: false,
          isLate: null,
          answerCorrect: null,
          infractions: null,
        };
      }

      const resolved = computeInfractions(
        { isLate: null, liveCheckedInAt: null, postCheckedInAt: null, excuseType: null },
        meeting.capInfractions,
      );
      totalInfractions += resolved;
      return {
        id: meeting.id,
        date: meeting.date,
        excuseType: null,
        liveCheckedIn: false,
        postCheckedIn: false,
        isLate: null,
        answerCorrect: null,
        infractions: resolved,
      };
    });

    return {
      id: user.id,
      rzId: user.rzId,
      firstName: user.firstName,
      lastName: user.lastName,
      totalInfractions,
      meetings: meetingEntries,
    };
  }
}
