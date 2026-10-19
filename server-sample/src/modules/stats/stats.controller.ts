import { Controller, Get, Query } from '@nestjs/common';
import { StatsService } from './stats.service';
import { CurrentUser } from '../../common/current-user.decorator';

@Controller('stats')
export class StatsController {
  constructor(private stats: StatsService) {}

  @Get('overview')
  overview(@CurrentUser('id') userId: string) {
    return this.stats.overview(userId);
  }

  @Get('by-task')
  byTask(@CurrentUser('id') userId: string) {
    return this.stats.byTask(userId);
  }

  @Get('heatmap')
  heatmap(
    @CurrentUser('id') userId: string,
    @Query('planId') planId?: string,
  ) {
    return this.stats.heatmap(userId, planId);
  }
}