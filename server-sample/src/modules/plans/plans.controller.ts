import {
  Body, Controller, Get, Param, Patch, Post,
} from '@nestjs/common';
import { PlansService } from './plans.service';
import { CurrentUser } from '../../common/current-user.decorator';

@Controller('plans')
export class PlansController {
  constructor(private plans: PlansService) {}

  // 开始 21 天计划：POST /api/plans { startDate?: 'YYYY-MM-DD' }
  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() body: { startDate?: string },
  ) {
    return this.plans.create(userId, body.startDate);
  }

  @Get('current')
  current(@CurrentUser('id') userId: string) {
    return this.plans.getCurrent(userId);
  }

  @Get(':id')
  get(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.plans.getById(userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: { status?: 'active' | 'completed' | 'abandoned' },
  ) {
    return this.plans.update(userId, id, body);
  }
}