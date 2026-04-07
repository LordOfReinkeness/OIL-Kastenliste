import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CheckinDto {
  @ApiProperty({ example: 'lu451rei' })
  @IsString()
  @IsNotEmpty()
  rzId: string;

  @ApiProperty({ example: 'in_person', enum: ['in_person', 'remote'] })
  @IsIn(['in_person', 'remote'])
  attendanceType: 'in_person' | 'remote';

  @ApiPropertyOptional({ example: 'deployment pipeline' })
  @IsString()
  @IsOptional()
  answer?: string;
}
