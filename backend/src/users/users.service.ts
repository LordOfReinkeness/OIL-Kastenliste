import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import CreateUserDto from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';
import { Meeting } from '../meetings/meeting.entity';
import { UserMeetingsService } from '../user-meetings/user-meetings.service';
import { RZ_ID_REGEX, RZ_ID_EXCEPTIONS } from './rz-id';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Meeting)
    private readonly meetings: Repository<Meeting>,
    private readonly userMeetingsService: UserMeetingsService,
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
      this.userMeetingsService.findByUser(id),
    ]);

    const recordMap = new Map(records.map((r) => [r.meeting.id, r]));
    const { stats, meetings: entries, toSave } = this.userMeetingsService.computeUserStats(
      user,
      allMeetings,
      recordMap,
      new Date(),
    );

    if (toSave.length) await this.userMeetingsService.saveAll(toSave);

    return {
      id: user.id,
      rzId: user.rzId,
      firstName: user.firstName,
      lastName: user.lastName,
      totalInfractions: stats.totalInfractions,
      meetings: entries.map((m) => ({
        date: m.date,
        excuseType: m.excuseType,
        liveCheckedIn: m.liveCheckedIn ?? false,
        postCheckedIn: m.postCheckedIn ?? false,
        isLate: m.isLate,
        answerCorrect: m.answerCorrect,
        infractions: m.infractions,
      })),
    };
  }
}
