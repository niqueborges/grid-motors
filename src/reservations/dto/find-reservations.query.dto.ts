import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { TransformDateDDMMYYYY } from '../../common/transforms/date.transform';

export class FindReservationsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by exact car ID' })
  @IsOptional()
  @IsString()
  id_car?: string;

  @ApiPropertyOptional({ description: 'Filter by exact user ID' })
  @IsOptional()
  @IsString()
  id_user?: string;

  @ApiPropertyOptional({ description: 'Filter by start date (DD/MM/YYYY)' })
  @IsOptional()
  @TransformDateDDMMYYYY()
  @IsDate()
  start_date?: Date;

  @ApiPropertyOptional({ description: 'Filter by end date (DD/MM/YYYY)' })
  @IsOptional()
  @TransformDateDDMMYYYY()
  @IsDate()
  end_date?: Date;

  @ApiPropertyOptional({ description: 'Filter by final value' })
  @IsOptional()
  @Type(() => Number)
  final_value?: number;

  @ApiPropertyOptional({ description: 'Limit for pagination (default 10)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Offset for pagination (default 0)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
