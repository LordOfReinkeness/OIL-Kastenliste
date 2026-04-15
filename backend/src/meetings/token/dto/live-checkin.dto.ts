import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsRzId } from '../../../users/rz-id';

export class LiveCheckinDto {
  @ApiProperty({ example: 'lu451rei' })
  @IsString()
  @IsNotEmpty()
  @IsRzId()
  @Transform(({ value }: { value: string }) => value.trim().toLowerCase())
  rzId: string;

  @ApiProperty({ example: 'in_person', enum: ['in_person', 'remote'] })
  @IsIn(['in_person', 'remote'])
  attendanceType: 'in_person' | 'remote';
}
