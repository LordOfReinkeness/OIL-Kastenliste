import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateMeetingDto {
  @ApiProperty({ example: '2026-04-10T18:00:00Z' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 60 })
  @IsInt()
  @Min(0)
  excuseDeadlineMinutes: number;

  @ApiProperty({ example: '2026-04-10T20:00:00Z' })
  @IsDateString()
  checkinDeadline: string;

  @ApiPropertyOptional({ example: 60 })
  @IsInt()
  @Min(1)
  @IsOptional()
  checkinWindowMinutes?: number;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  capInfractions?: boolean;

  @ApiPropertyOptional({ example: 'What was the main topic?' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  question?: string;

  @ApiPropertyOptional({ example: 'deployment pipeline' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  answer?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  checkAnswer?: boolean;

  @ApiPropertyOptional({ example: 3 })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxRetries?: number;
}
