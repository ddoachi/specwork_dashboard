import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { SpecsService } from './specs.service';
import { UpsertSpecDto } from './dto/upsert-spec.dto';

@Controller('specs')
export class SpecsController {
  constructor(private readonly service: SpecsService) {}

  @Post('upsert')
  upsert(@Body() dto: UpsertSpecDto) {
    return this.service.upsert(dto);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get()
  list(@Query('status') status?: string, @Query('type') type?: string, @Query('epic') epic?: string, @Query('tag') tag?: string) {
    return this.service.list({ status, type, epic, tag });
  }
}
