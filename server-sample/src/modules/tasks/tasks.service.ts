import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../../entities';
import { CreateTaskDto } from './dto/create-task.dto';

// 打卡项目 CRUD。删除用归档(soft delete)，历史打卡记录保留用于统计。
@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private repo: Repository<Task>,
  ) {}

  listActive(userId: string) {
    return this.repo.find({
      where: { user: { id: userId }, isArchived: false },
      order: { sortOrder: 'ASC' },
    });
  }

async create(userId: string, dto: CreateTaskDto) {
  const count = await this.repo.count({
    where: { user: { id: userId }, isArchived: false },
  });
  const task = this.repo.create({
    user: { id: userId } as any,
    name: dto.name,
    icon: dto.icon,
    color: dto.color ?? '#5B8C5A',
    frequencyType: dto.frequencyType ?? 'daily',
    targetDays: dto.targetDays ?? null,
    makeupUsed: 0,
    sortOrder: count,
  });
  return this.repo.save(task);
}

  async update(userId: string, id: string, dto: Partial<CreateTaskDto>) {
    const task = await this.ownTask(userId, id);
    Object.assign(task, dto);
    return this.repo.save(task);
  }

  async archive(userId: string, id: string) {
    const task = await this.ownTask(userId, id);
    task.isArchived = true;
    await this.repo.save(task);
    return { ok: true };
  }

  async reorder(userId: string, orders: { id: string; sortOrder: number }[]) {
    await Promise.all(
      orders.map((o) =>
        this.repo.update(
          { id: o.id, user: { id: userId } },
          { sortOrder: o.sortOrder },
        ),
      ),
    );
    return { ok: true };
  }

  private async ownTask(userId: string, id: string) {
    const task = await this.repo.findOne({
      where: { id, user: { id: userId } },
    });
    if (!task) throw new NotFoundException('项目不存在');
    return task;
  }
}