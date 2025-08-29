import { Controller, Get, Post } from '@nestjs/common';
// import { UseGuards } from '@nestjs/common';
// import { BasicAuthGuard } from '../auth/basic-auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DashboardService, DashboardStats, SpecTreeNode } from './dashboard.service';
import { SpecSyncService, SyncResult } from '../specs/spec-sync.service';

@ApiTags('dashboard')
@Controller('api/dashboard')
// @UseGuards(BasicAuthGuard) // Enable when auth is needed
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly specSyncService: SpecSyncService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns comprehensive dashboard statistics including epic progress',
    type: 'object'
  })
  async getStats(): Promise<DashboardStats> {
    return this.dashboardService.getDashboardStats();
  }
}

@ApiTags('specs')
@Controller('api/specs')
// @UseGuards(BasicAuthGuard) // Enable when auth is needed
export class SpecsController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly specSyncService: SpecSyncService,
  ) {}

  @Get('tree')
  @ApiOperation({ summary: 'Get hierarchical specification tree' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns hierarchical tree of epics, features, and tasks',
    type: 'array'
  })
  async getTree(): Promise<SpecTreeNode[]> {
    return this.dashboardService.getSpecTree();
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync specifications from filesystem' })
  @ApiResponse({ 
    status: 200, 
    description: 'Synchronizes spec files from filesystem and returns sync results',
    type: 'object'
  })
  async syncSpecs(): Promise<SyncResult> {
    return this.specSyncService.syncSpecs();
  }
}