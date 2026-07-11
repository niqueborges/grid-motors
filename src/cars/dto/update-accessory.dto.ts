import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateAccessoryDto {
  @ApiProperty({ example: 'Air Conditioner', description: 'Description of the accessory to add or remove' })
  @IsString()
  @IsNotEmpty()
  description: string;
}
