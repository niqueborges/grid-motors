import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsNumber,
  IsNotEmpty,
  Min,
  Max,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsUniqueArray } from '../../common/validators/is-unique-array.validator';

export class CreateAccessoryDto {
  @ApiProperty({ example: 'Air Conditioner' })
  @IsString()
  @IsNotEmpty()
  description: string;
}

export class CreateCarDto {
  @ApiProperty({ example: 'GM S10 2.8' })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty({ example: 'White' })
  @IsString()
  @IsNotEmpty()
  color: string;

  @ApiProperty({ example: 2021, minimum: 1950, maximum: 2023 })
  @IsInt()
  @Min(1950)
  @Max(2023)
  year: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0)
  value_per_day: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  number_of_passengers: number;

  @ApiProperty({ type: [CreateAccessoryDto] })
  @ValidateNested({ each: true })
  @Type(() => CreateAccessoryDto)
  @ArrayMinSize(1)
  @IsUniqueArray('description', { message: 'accessories must be unique' })
  accessories: CreateAccessoryDto[];
}
