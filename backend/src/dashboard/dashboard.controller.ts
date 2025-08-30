import { Controller, Get } from '@nestjs/common';
// import { UseGuards } from '@nestjs/common';
// import { BasicAuthGuard } from '../auth/basic-auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardStatsDto, SpecTreeNodeDto, EpicProgressResponseDto, RecentActivityResponseDto } from './dto/dashboard.dto';

@ApiTags('dashboard')
@Controller('api/dashboard')
// @UseGuards(BasicAuthGuard) // Enable when auth is needed
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns comprehensive dashboard statistics including epic progress',
    type: DashboardStatsDto
  })
  async getStats(): Promise<DashboardStatsDto> {
    return this.dashboardService.getDashboardStats();
  }

  @Get('epic-progress')
  @ApiOperation({ summary: 'Get epic progress data' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns epic progress information',
    type: EpicProgressResponseDto
  })
  async getEpicProgress(): Promise<EpicProgressResponseDto> {
    return this.dashboardService.getEpicProgress();
  }

  @Get('recent-activity')
  @ApiOperation({ summary: 'Get recent activity feed' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns recent activity data',
    type: RecentActivityResponseDto
  })
  async getRecentActivity(): Promise<RecentActivityResponseDto> {
    return this.dashboardService.getRecentActivity();
  }
}

@ApiTags('specs')
@Controller('api/specs')
// @UseGuards(BasicAuthGuard) // Enable when auth is needed
export class SpecsController {
  constructor(
    private readonly dashboardService: DashboardService,
  ) {}

  @Get('tree')
  @ApiOperation({ summary: 'Get hierarchical specification tree' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns hierarchical tree of epics, features, and tasks',
    type: [SpecTreeNodeDto]
  })
  async getTree(): Promise<SpecTreeNodeDto[]> {
    return this.dashboardService.getSpecTree();
  }
}