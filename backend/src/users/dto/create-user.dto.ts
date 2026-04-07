import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

class CreateUserDto {
  @ApiProperty({ example: 'lu451rei' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value.trim())
  rzId: string;

  @ApiProperty({ example: 'Lukas' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value.trim())
  firstName: string;

  @ApiProperty({ example: 'Reinke' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value.trim())
  lastName: string;
}

export default CreateUserDto
