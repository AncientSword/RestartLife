import {
  Body, Controller, Delete, Get, Param, Patch, Post,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { CurrentUser } from '../../common/current-user.decorator';

@Controller('tasks')
export class TasksController {
  constructor(private tasks: TasksService) {}

  // 当前用户的有效（未归档）项目
  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.tasks.listActive(userId);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateTaskDto) {
    return this.tasks.create(userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateTaskDto>,
  ) {
    return this.tasks.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.tasks.archive(userId, id);
  }

  @Post('reorder')
  reorder(
    @CurrentUser('id') userId: string,
    @Body() body: { orders: { id: string; sortOrder: number }[] },
  ) {
    return this.tasks.reorder(userId, body.orders);
  }
}