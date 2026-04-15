import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsRzId } from '../../../users/rz-id';

export class PostCheckinDto {
  @ApiProperty({ example: 'lu451rei' })
  @IsString()
  @IsNotEmpty()
  @IsRzId()
  @Transform(({ value }: { value: string }) => value.trim().toLowerCase())
  rzId: string;

  @ApiPropertyOptional({ example: 'deployment pipeline' })
  @IsString()
  @IsOptional()
  answer?: string;
}
