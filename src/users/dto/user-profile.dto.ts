import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Joãozinho Ciclano' })
  name: string;

  @ApiProperty({ example: '131.147.860-49' })
  cpf: string;

  @ApiProperty({ example: '2000-03-03T00:00:00.000Z' })
  birth: Date;

  @ApiProperty({ example: 'joaozinho@email.com' })
  email: string;

  @ApiProperty({ example: '01001-000' })
  cep: string;

  @ApiProperty({ example: 'Main Street', nullable: true })
  street: string | null;

  @ApiProperty({ example: 'Downtown', nullable: true })
  neighborhood: string | null;

  @ApiProperty({ example: 'New York', nullable: true })
  city: string | null;

  @ApiProperty({ example: 'NY', nullable: true })
  state: string | null;

  @ApiProperty({ example: 'yes', enum: ['yes', 'no'] })
  qualified: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
