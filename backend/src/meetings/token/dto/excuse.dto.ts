import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ExcuseType } from '../../../user-meetings/user-meeting.entity';

export class ExcuseDto {
  @ApiProperty({ example: 'lu451rei' })
  @IsString()
  @IsNotEmpty()
  rzId: string;

  @ApiProperty({ enum: ExcuseType, example: ExcuseType.ABSENT })
  @IsEnum(ExcuseType)
  excuseType: ExcuseType;
}
