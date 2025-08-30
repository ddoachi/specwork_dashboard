import { Body, Controller, Get, Param, Post, Query, Headers } from '@nestjs/common';
import { SpecsService } from './specs.service';
import { UpsertSpecDto } from './dto/upsert-spec.dto';
import { BatchSyncDto } from './dto/batch-sync.dto';

@Controller('specs')
export class SpecsController {
  constructor(private readonly service: SpecsService) {}

  @Post('upsert')
  upsert(@Body() dto: UpsertSpecDto) {
    return this.service.upsert(dto);
  }

  @Post('batch-sync')
  async batchSync(@Body() dto: BatchSyncDto, @Headers('authorization') auth?: string) {
    // Simple API key check for GitHub Actions
    const apiKey = auth?.replace('Bearer ', '');
    if (process.env.NODE_ENV === 'production' && apiKey !== process.env.SYNC_API_KEY) {
      throw new Error('Unauthorized');
    }
    return this.service.batchSync(dto);
  }

  @Get(':hierarchicalId')
  getOne(@Param('hierarchicalId') hierarchicalId: string) {
    return this.service.findOne(hierarchicalId);
  }

  @Get()
  list(@Query('status') status?: string, @Query('type') type?: string, @Query('epic') epic?: string, @Query('parent') parent?: string) {
    return this.service.list({ status, type, epic, parent });
  }
}
