import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserMeeting } from './user-meeting.entity';
import { UserMeetingsService } from './user-meetings.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserMeeting])],
  providers: [UserMeetingsService],
  exports: [UserMeetingsService],
})
export class UserMeetingsModule {}
