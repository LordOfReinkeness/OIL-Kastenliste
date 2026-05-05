import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Meeting } from '../meetings/meeting.entity';
import { UserMeetingsModule } from '../user-meetings/user-meetings.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Meeting]), UserMeetingsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
