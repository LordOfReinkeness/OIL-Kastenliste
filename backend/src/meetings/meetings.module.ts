import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Meeting } from './meeting.entity';
import MeetingsController from './meetings.controller';
import { MeetingsService } from './meetings.service';
import { AttendanceController } from './attendance/attendance.controller';
import { AttendanceService } from './attendance/attendance.service';
import { TokenController } from './token/token.controller';
import { TokenService } from './token/token.service';
import { UserMeeting } from '../user-meetings/user-meeting.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Meeting, UserMeeting]), UsersModule],
  // TokenController must be before MeetingsController to avoid meetings/:id matching meetings/t
  controllers: [TokenController, AttendanceController, MeetingsController],
  providers: [MeetingsService, AttendanceService, TokenService],
  exports: [MeetingsService, AttendanceService],
})
export class MeetingsModule {}
