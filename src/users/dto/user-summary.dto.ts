import { ApiProperty } from '@nestjs/swagger';

export class UserSummaryDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Joãozinho Ciclano' })
  name: string;

  @ApiProperty({ example: 'yes', enum: ['yes', 'no'] })
  qualified: string;
}
