import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { IsCpf } from '../../common/validators/is-cpf.validator';
import { IsOver18 } from '../../common/validators/is-over-18.validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Joãozinho Ciclano' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '131.147.860-49' })
  @IsNotEmpty()
  @IsString()
  @IsCpf()
  cpf: string;

  @ApiProperty({
    example: '03/03/2000',
    description: 'User must be at least 18 years old.',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/, {
    message: 'birth must be in DD/MM/YYYY format',
  })
  @IsOver18()
  birth: string;

  @ApiProperty({ example: 'joaozinho@email.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', description: 'Minimum 6 characters' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: '01001000',
    description: 'Valid brazilian zip code format XXXXXXXX or XXXXX-XXX',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{5}-?\d{3}$/, {
    message: 'cep must match the format XXXXXXXX or XXXXX-XXX',
  })
  cep: string;

  @ApiProperty({ example: 'yes', description: 'Accepts only yes or no' })
  @IsNotEmpty()
  @IsString()
  @IsIn(['yes', 'no'], { message: 'qualified must be either yes or no' })
  qualified: string;
}
