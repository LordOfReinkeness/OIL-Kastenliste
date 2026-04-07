import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class UpdateMeetingDto {
  @ApiPropertyOptional({ example: '2026-04-10T18:00:00Z' })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ example: 60 })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  excuseDeadlineMinutes?: number;

  @ApiPropertyOptional({ example: '2026-04-10T20:00:00Z' })
  @IsDateString()
  @IsOptional()
  checkinDeadline?: string;

  @ApiPropertyOptional({ example: 'What was the main topic?' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.trim())
  question?: string;

  @ApiPropertyOptional({ example: 'deployment pipeline' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.trim())
  answer?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  checkAnswer?: boolean;

  @ApiPropertyOptional({ example: 3 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Transform(({ value }) => value !== undefined ? Number(value) : undefined)
  maxRetries?: number;
}
