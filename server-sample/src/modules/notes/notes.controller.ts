import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { NotesService } from './notes.service';
import { CurrentUser } from '../../common/current-user.decorator';

@Controller('notes')
export class NotesController {
  constructor(private notes: NotesService) {}

  @Get(':date')
  get(@CurrentUser('id') userId: string, @Param('date') date: string) {
    return this.notes.get(userId, date);
  }

  // upsert：当天存在则更新，不存在则创建
  @Post()
  upsert(
    @CurrentUser('id') userId: string,
    @Body() body: { date: string; content: string; mood?: string },
  ) {
    return this.notes.upsert(userId, body);
  }
}