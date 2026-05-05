import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Meeting } from './meeting.entity';
import MeetingsController from './meetings.controller';
import { MeetingsService } from './meetings.service';
import { AttendanceController } from './attendance/attendance.controller';
import { AttendanceService } from './attendance/attendance.service';
import { TokenController } from './token/token.controller';
import { TokenService } from './token/token.service';
import { UsersModule } from '../users/users.module';
import { UserMeetingsModule } from '../user-meetings/user-meetings.module';

@Module({
  imports: [TypeOrmModule.forFeature([Meeting]), UsersModule, UserMeetingsModule],
  // TokenController must be before MeetingsController to avoid meetings/:id matching meetings/t
  controllers: [TokenController, AttendanceController, MeetingsController],
  providers: [MeetingsService, AttendanceService, TokenService],
  exports: [MeetingsService, AttendanceService],
})
export class MeetingsModule {}
