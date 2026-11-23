import { ApiProperty } from '@nestjs/swagger';
import { UserSummaryDto } from './user-summary.dto';

export class PaginatedUsersResponseDto {
  @ApiProperty({ type: [UserSummaryDto] })
  users: UserSummaryDto[];

  @ApiProperty({ example: 45 })
  total: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 0 })
  offset: number;

  @ApiProperty({ example: 5 })
  offsets: number;
}
