import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsUUID } from 'class-validator';
import { TransformDateDDMMYYYY } from '../../common/transforms/date.transform';

export class CreateReservationDto {
  @ApiProperty({ example: '20/04/2023', description: 'Start date in DD/MM/YYYY format' })
  @TransformDateDDMMYYYY()
  @IsDate()
  @IsNotEmpty()
  start_date: Date;

  @ApiProperty({ example: '30/04/2023', description: 'End date in DD/MM/YYYY format' })
  @TransformDateDDMMYYYY()
  @IsDate()
  @IsNotEmpty()
  end_date: Date;

  @ApiProperty({ example: 'uuid-here' })
  @IsUUID()
  @IsNotEmpty()
  id_car: string;
}
