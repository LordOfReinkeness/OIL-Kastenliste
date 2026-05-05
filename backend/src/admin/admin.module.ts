import { Module } from '@nestjs/common';
import { MeetingsModule } from '../meetings/meetings.module';
import { UsersModule } from '../users/users.module';
import { UserMeetingsModule } from '../user-meetings/user-meetings.module';
import { AdminStatsController } from './stats/admin-stats.controller';
import { AdminStatsService } from './stats/admin-stats.service';

@Module({
  imports: [UserMeetingsModule, MeetingsModule, UsersModule],
  controllers: [AdminStatsController],
  providers: [AdminStatsService],
})
export class AdminModule {}
