import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query,
} from '@nestjs/common';
import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { CurrentUser } from '../../common/current-user.decorator';

@Controller('todos')
export class TodosController {
  constructor(private todos: TodosService) {}

  // GET /api/todos?showDone=true
  @Get()
  list(
    @CurrentUser('id') userId: string,
    @Query('showDone') showDone?: string,
  ) {
    return this.todos.list(userId, showDone === 'true');
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateTodoDto) {
    return this.todos.create(userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateTodoDto>,
  ) {
    return this.todos.update(userId, id, dto);
  }

  // 切换完成状态
  @Post(':id/toggle')
  toggle(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.todos.toggle(userId, id);
  }

  @Post(':id/pin')
  togglePin(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.todos.togglePin(userId, id);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.todos.remove(userId, id);
  }
}