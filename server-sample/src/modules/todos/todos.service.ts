import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from '../../entities';
import { CreateTodoDto } from './dto/create-todo.dto';

@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(Todo) private repo: Repository<Todo>,
  ) {}

  list(userId: string, showDone: boolean) {
    const qb = this.repo
      .createQueryBuilder('t')
      .where('t.user_id = :userId', { userId })
      .orderBy('t.pinned', 'DESC')
      .addOrderBy('t.completedAt IS NULL', 'DESC') // 未完成在前
      .addOrderBy('t.createdAt', 'DESC');
    if (!showDone) {
      qb.andWhere('t.completed_at IS NULL');
    }
    return qb.getMany();
  }

  create(userId: string, dto: CreateTodoDto) {
    const todo = this.repo.create({
      user: { id: userId } as any,
      title: dto.title,
      note: dto.note ?? '',
      dueDate: dto.dueDate ?? null,
      pinned: false,
      completedAt: null,
    });
    return this.repo.save(todo);
  }

  async update(userId: string, id: string, dto: Partial<CreateTodoDto>) {
    const todo = await this.own(userId, id);
    Object.assign(todo, {
      title: dto.title ?? todo.title,
      note: dto.note ?? todo.note,
      dueDate: dto.dueDate ?? todo.dueDate,
    });
    return this.repo.save(todo);
  }

  async toggle(userId: string, id: string) {
    const todo = await this.own(userId, id);
    todo.completedAt = todo.completedAt ? null : new Date();
    await this.repo.save(todo);
    return { id, completedAt: todo.completedAt };
  }

  async togglePin(userId: string, id: string) {
    const todo = await this.own(userId, id);
    todo.pinned = !todo.pinned;
    await this.repo.save(todo);
    return { id, pinned: todo.pinned };
  }

  async remove(userId: string, id: string) {
    const todo = await this.own(userId, id);
    await this.repo.remove(todo);
    return { ok: true };
  }

  private async own(userId: string, id: string) {
    const todo = await this.repo.findOne({
      where: { id, user: { id: userId } },
    });
    if (!todo) throw new NotFoundException('任务不存在');
    return todo;
  }
}