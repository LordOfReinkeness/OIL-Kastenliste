import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'lu451rei' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.trim())
  rzId?: string;

  @ApiPropertyOptional({ example: 'Lukas' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.trim())
  firstName?: string;

  @ApiPropertyOptional({ example: 'Reinke' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.trim())
  lastName?: string;
}
