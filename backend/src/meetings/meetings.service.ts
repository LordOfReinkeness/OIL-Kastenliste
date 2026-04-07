import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { Meeting } from './meeting.entity';
import { randomBytes } from 'crypto';

@Injectable()
export class MeetingsService {
  constructor(
    @InjectRepository(Meeting)
    private readonly meetings: Repository<Meeting>,
  ) {}

  async create(dto: CreateMeetingDto): Promise<Meeting> {
    const meeting = this.meetings.create({
      ...dto,
      linkToken: randomBytes(6).toString('hex'),
    });
    return this.meetings.save(meeting);
  }

  findAll(): Promise<Meeting[]> {
    return this.meetings.find({ order: { date: 'ASC' } });
  }

  async findNext(): Promise<Meeting> {
    const meeting = await this.meetings.findOne({
      where: { date: MoreThanOrEqual(new Date()) },
      order: { date: 'ASC' },
    });
    if (!meeting) throw new NotFoundException('no upcoming meeting');
    // TODO: strip answer for non-admin routes once auth is implemented
    return meeting;
  }

  async findOne(id: string): Promise<Meeting> {
    const meeting = await this.meetings.findOneBy({ id });
    if (!meeting) throw new NotFoundException('meeting not found');
    return meeting;
  }

  async update(id: string, dto: UpdateMeetingDto): Promise<Meeting> {
    const meeting = await this.findOne(id);
    Object.assign(meeting, dto);
    return this.meetings.save(meeting);
  }

  async findByToken(token: string): Promise<Meeting> {
    const meeting = await this.meetings.findOneBy({ linkToken: token });
    if (!meeting) throw new NotFoundException('meeting not found');
    return meeting;
  }

  async remove(id: string): Promise<void> {
    const meeting = await this.findOne(id);
    await this.meetings.remove(meeting);
  }
}
