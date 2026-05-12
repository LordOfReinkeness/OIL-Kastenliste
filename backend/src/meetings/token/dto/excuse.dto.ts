import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';
import { ExcuseType } from '../../../user-meetings/user-meeting.entity';
import { IsRzId } from '../../../users/rz-id';

export class ExcuseDto {
  @ApiProperty({ example: 'lu451rei' })
  @IsString()
  @IsNotEmpty()
  @IsRzId()
  @Transform(({ value }: { value: string }) => value.trim().toLowerCase())
  rzId: string;

  @ApiProperty({ enum: ExcuseType, example: ExcuseType.ABSENT })
  @IsEnum(ExcuseType)
  excuseType: ExcuseType;

  @ApiPropertyOptional({ description: 'Required when excuseType is absent' })
  @ValidateIf(o => o.excuseType === ExcuseType.ABSENT)
  @IsString()
  @IsNotEmpty()
  statusLastWeek?: string;

  @ApiPropertyOptional({ description: 'Required when excuseType is absent' })
  @ValidateIf(o => o.excuseType === ExcuseType.ABSENT)
  @IsString()
  @IsNotEmpty()
  statusNextWeek?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  statusProblems?: string;
}
