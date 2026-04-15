import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsIn, IsOptional } from 'class-validator';
import { ExcuseType } from '../../../user-meetings/user-meeting.entity';

export class UpdateAttendanceDto {
  @ApiPropertyOptional({ type: 'string', format: 'date-time', nullable: true, example: '2026-04-10T18:10:00Z' })
  @IsDateString()
  @IsOptional()
  liveCheckedInAt?: string | null;

  @ApiPropertyOptional({ type: 'string', format: 'date-time', nullable: true, example: '2026-04-10T19:05:00Z' })
  @IsDateString()
  @IsOptional()
  postCheckedInAt?: string | null;

  @ApiPropertyOptional({ type: 'boolean', nullable: true, example: true })
  @IsBoolean()
  @IsOptional()
  isLate?: boolean | null;

  @ApiPropertyOptional({ type: 'string', enum: ['in_person', 'remote'], nullable: true, example: 'in_person' })
  @IsIn(['in_person', 'remote'])
  @IsOptional()
  attendanceType?: 'in_person' | 'remote' | null;

  @ApiPropertyOptional({ type: 'boolean', nullable: true, example: true })
  @IsBoolean()
  @IsOptional()
  answerCorrect?: boolean | null;

  @ApiPropertyOptional({ type: 'string', format: 'date-time', nullable: true, example: null })
  @IsDateString()
  @IsOptional()
  excusedAt?: string | null;

  @ApiPropertyOptional({ enum: ExcuseType, nullable: true, example: null })
  @IsEnum(ExcuseType)
  @IsOptional()
  excuseType?: ExcuseType | null;
}
