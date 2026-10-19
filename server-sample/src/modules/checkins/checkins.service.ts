import {
  Injectable, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { CheckIn, Task, Plan } from '../../entities';

const TOTAL_DAYS = 21;

@Injectable()
export class CheckinsService {
  constructor(
    @InjectRepository(CheckIn) private repo: Repository<CheckIn>,
    @InjectRepository(Task) private tasks: Repository<Task>,
    @InjectRepository(Plan) private plans: Repository<Plan>,
  ) {}

  async getOfDay(userId: string, date: string) {
    const rows = await this.repo.find({
      where: { user: { id: userId }, date },
    });
    // 以 taskId 为键返回，方便前端合并
    return rows.map((r) => ({
      taskId: r.task.id,
      date: r.date,
      dayNumber: r.dayNumber,
      status: r.status,
      completedAt: r.completedAt,
    }));
  }

  async getRange(userId: string, from: string, to: string) {
    const rows = await this.repo.find({
      where: {
        user: { id: userId },
        date: MoreThanOrEqual(from),
      },
    });
    return rows
      .filter((r) => r.date <= to)
      .map((r) => ({
        taskId: r.task.id,
        date: r.date,
        dayNumber: r.dayNumber,
        status: r.status,
        completedAt: r.completedAt,
      }));
  }

  // toggle：不存在则创建 done，存在 done 则改 pending，存在 pending 则改 done
  async toggle(userId: string, taskId: string, date: string) {
    const task = await this.tasks.findOne({
      where: { id: taskId, user: { id: userId }, isArchived: false },
    });
    if (!task) throw new NotFoundException('项目不存在');

    const plan = await this.getCurrentPlan(userId);
    const dayNumber = this.dayNumberOf(date, plan.startDate);
    if (dayNumber < 1 || dayNumber > TOTAL_DAYS) {
      throw new BadRequestException('日期不在当前计划范围内');
    }

    let record = await this.repo.findOne({
      where: { user: { id: userId }, task: { id: taskId }, date },
    });

    if (!record) {
      record = this.repo.create({
        user: { id: userId } as any,
        plan: { id: plan.id } as any,
        task: { id: taskId } as any,
        date,
        dayNumber,
        status: 'done',
        completedAt: new Date(),
      });
    } else {
      record.status = record.status === 'done' ? 'pending' : 'done';
      record.completedAt = record.status === 'done' ? new Date() : null;
    }

    const saved = await this.repo.save(record);
    return { taskId, date, status: saved.status, completedAt: saved.completedAt };
  }

  private async getCurrentPlan(userId: string): Promise<Plan> {
    const plan = await this.plans.findOne({
      where: { user: { id: userId }, status: 'active' },
      order: { createdAt: 'DESC' },
    });
    if (!plan) throw new BadRequestException('还没有进行中的计划，请先创建计划');
    return plan;
  }

private dayNumberOf(date: string, startDate: string): number {
  const ms = new Date(date).getTime() - new Date(startDate).getTime();
  return Math.floor(ms / 86400000) + 1;
}

// 补打卡：仅对历史日期有效，消耗1次机会
async makeup(userId: string, taskId: string, date: string) {
  const today = this.todayStr();
  if (date >= today) {
    throw new BadRequestException('补打卡仅适用于历史日期');
  }
  const task = await this.tasks.findOne({
    where: { id: taskId, user: { id: userId } },
  });
  if (!task) throw new NotFoundException('项目不存在');
  if (task.makeupUsed >= 3) {
    throw new BadRequestException('补打卡次数已用完（每项目21天3次）');
  }
  const plan = await this.getCurrentPlan(userId);
  const dayNumber = this.dayNumberOf(date, plan.startDate);
  if (dayNumber < 1 || dayNumber > 21) {
    throw new BadRequestException('日期不在计划范围内');
  }
  // 若已打卡则不重复
  const existing = await this.repo.findOne({
    where: { user: { id: userId }, task: { id: taskId }, date },
  });
  if (existing && existing.status === 'done') {
    return { taskId, date, status: 'done', alreadyDone: true };
  }
  const record = this.repo.create({
    user: { id: userId } as any,
    plan: { id: plan.id } as any,
    task: { id: taskId } as any,
    date,
    dayNumber,
    status: 'done',
    completedAt: new Date(),
  });
  await this.repo.save(record);
  // 累加计数
  task.makeupUsed += 1;
  await this.tasks.save(task);
  return { taskId, date, status: 'done', makeupUsed: task.makeupUsed };
}

private todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
}