import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CheckinsService } from './checkins.service';
import { CurrentUser } from '../../common/current-user.decorator';

@Controller('checkins')
export class CheckinsController {
  constructor(private checkins: CheckinsService) {}

  // 某天打卡：GET /api/checkins?date=2026-10-19
  @Get()
  getOfDay(@CurrentUser('id') userId: string, @Query('date') date: string) {
    return this.checkins.getOfDay(userId, date);
  }

  // 范围：GET /api/checkins?from=2026-10-15&to=2026-10-19
  @Get('range')
  getRange(
    @CurrentUser('id') userId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.checkins.getRange(userId, from, to);
  }

  // 切换状态：POST /api/checkins/toggle { taskId, date }
  // 仅对今天及未来有效；历史日期请用 /makeup
  @Post('toggle')
  toggle(
    @CurrentUser('id') userId: string,
    @Body() body: { taskId: string; date: string },
  ) {
    return this.checkins.toggle(userId, body.taskId, body.date);
  }

  // 补打卡：POST /api/checkins/makeup { taskId, date }
  // 仅对历史日期有效，消耗1次补打卡机会（每项目21天内3次）
  @Post('makeup')
  makeup(
    @CurrentUser('id') userId: string,
    @Body() body: { taskId: string; date: string },
  ) {
    return this.checkins.makeup(userId, body.taskId, body.date);
  }
}