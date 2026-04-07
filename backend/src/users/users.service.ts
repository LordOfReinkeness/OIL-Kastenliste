import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import CreateUserDto from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

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
}
