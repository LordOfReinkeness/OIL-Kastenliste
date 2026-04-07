import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingsModule } from '../meetings/meetings.module';
import { UsersModule } from '../users/users.module';
import { UserMeeting } from '../user-meetings/user-meeting.entity';
import { AdminStatsController } from './stats/admin-stats.controller';
import { AdminStatsService } from './stats/admin-stats.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserMeeting]), MeetingsModule, UsersModule],
  controllers: [AdminStatsController],
  providers: [AdminStatsService],
})
export class AdminModule {}
