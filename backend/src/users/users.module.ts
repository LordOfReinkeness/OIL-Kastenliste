import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserMeeting } from '../user-meetings/user-meeting.entity';
import { Meeting } from '../meetings/meeting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserMeeting, Meeting])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
