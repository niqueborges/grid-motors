import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export class UserEntity {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'joaozinho' })
  name: string;

  @ApiProperty({ example: '131.147.860-49' })
  cpf: string;

  @ApiProperty({ example: '2000-03-03T00:00:00.000Z' })
  birth: Date;

  @ApiProperty({ example: 'joaozinho@email.com' })
  email: string;

  @Exclude()
  password: string;

  @ApiProperty({ example: '01001-000' })
  cep: string;

  @ApiProperty({ example: 'Main Street', required: false, nullable: true })
  street: string | null;

  @ApiProperty({ example: 'Downtown', required: false, nullable: true })
  neighborhood: string | null;

  @ApiProperty({ example: 'New York', required: false, nullable: true })
  city: string | null;

  @ApiProperty({ example: 'NY', required: false, nullable: true })
  state: string | null;

  @ApiProperty({ example: 'yes' })
  qualified: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
