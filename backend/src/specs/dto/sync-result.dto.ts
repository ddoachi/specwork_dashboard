import { ApiProperty } from '@nestjs/swagger';

export class SyncResultDto {
  @ApiProperty({ description: 'Number of files processed during sync' })
  processed: number;

  @ApiProperty({ description: 'Number of epics processed' })
  epics: number;

  @ApiProperty({ description: 'Number of features processed' })
  features: number;

  @ApiProperty({ description: 'Number of tasks processed' })
  tasks: number;

  @ApiProperty({ description: 'List of errors encountered during sync', type: [String] })
  errors: string[];
}