import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsIn, IsOptional } from 'class-validator';
import { ExcuseType } from '../../../user-meetings/user-meeting.entity';

export class UpdateAttendanceDto {
  @ApiPropertyOptional({ example: '2026-04-10T19:05:00Z' })
  @IsDateString()
  @IsOptional()
  checkedInAt?: Date | null;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isLate?: boolean | null;

  @ApiPropertyOptional({ example: 'in_person', enum: ['in_person', 'remote'] })
  @IsIn(['in_person', 'remote'])
  @IsOptional()
  attendanceType?: 'in_person' | 'remote' | null;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  answerCorrect?: boolean | null;

  @ApiPropertyOptional({ example: null })
  @IsDateString()
  @IsOptional()
  excusedAt?: Date | null;

  @ApiPropertyOptional({ enum: ExcuseType, example: null })
  @IsEnum(ExcuseType)
  @IsOptional()
  excuseType?: ExcuseType | null;
}
