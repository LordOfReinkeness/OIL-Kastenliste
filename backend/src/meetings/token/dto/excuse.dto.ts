import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
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
}
