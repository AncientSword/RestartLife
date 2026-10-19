import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckIn, Task, Plan } from '../../entities';

const TOTAL_DAYS = 21;

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(CheckIn) private checkins: Repository<CheckIn>,
    @InjectRepository(Task) private tasks: Repository<Task>,
    @InjectRepository(Plan) private plans: Repository<Plan>,
  ) {}

  async overview(userId: string) {
    const plan = await this.currentPlan(userId);
    const { elapsedDays } = this.calcElapsed(plan.startDate);
    const tasks = await this.activeTasks(userId);

    const all = await this.checkins.find({
      where: { user: { id: userId }, plan: { id: plan.id } },
    });

    // 各项目按"频率感知"累计分子/分母
    let done = 0, total = 0;
    for (const t of tasks) {
      const r = this.taskProgressOverall(t, all, plan.startDate);
      done += r.done;
      total += r.total;
    }

    return {
      dayNumber: elapsedDays,
      totalDays: TOTAL_DAYS,
      overallRate: total > 0 ? +(done / total).toFixed(4) : 0,
      doneCount: done,
      totalCount: total,
      streak: await this.calcStreak(userId, plan, all),
      totalDoneDays: this.countDoneDays(all),
    };
  }

  async byTask(userId: string) {
    const plan = await this.currentPlan(userId);
    const tasks = await this.activeTasks(userId);
    const all = await this.checkins.find({
      where: { user: { id: userId }, plan: { id: plan.id } },
    });

return tasks.map((t) => {
  const r = this.taskProgressOverall(t, all, plan.startDate);
  return {
    taskId: t.id,
    name: t.name,
    icon: t.icon,
    color: t.color,
    frequencyType: t.frequencyType,
    targetDays: t.targetDays,
    makeupUsed: t.makeupUsed,
    done: r.done,
    total: r.total,
    rate: r.rate,
  };
});
  }

  async heatmap(userId: string, planId?: string) {
    const plan = planId
      ? await this.plans.findOne({ where: { id: planId, user: { id: userId } } })
      : await this.currentPlan(userId);
    if (!plan) return [];

    const tasks = await this.activeTasks(userId);
    const all = await this.checkins.find({
      where: { user: { id: userId }, plan: { id: plan.id } },
    });

    const grid = [];
    for (let i = 0; i < TOTAL_DAYS; i++) {
      const date = this.addDays(plan.startDate, i);
      const dayNumber = i + 1;
      const done = all.filter(
        (c) => c.dayNumber === dayNumber && c.status === 'done',
      ).length;
      grid.push({
        dayNumber,
        date,
        done,
        total: tasks.length,
        // 当日完成率：当日已打数 / 当日应打数（daily 算 1，weekly 算"本周剩余配额"
        // 简化：直接用 done / total
        rate: tasks.length > 0 ? +(done / tasks.length).toFixed(4) : 0,
      });
    }
    return grid;
  }

// ---- 目标日感知的单项目进度 ----
// 分子：历史目标日中已打卡天数（含补打卡）
// 分母：历史目标日总数（含今天）
private taskProgressOverall(
  task: Task,
  allCheckins: CheckIn[],
  startDate: string,
): { done: number; total: number; rate: number } {
  const today = this.todayStr();
  const elapsed0 = this.diffDays(today, startDate) + 1;
  const elapsed = Math.min(Math.max(elapsed0, 0), TOTAL_DAYS);
  if (elapsed <= 0) return { done: 0, total: 0, rate: 0 };

  // 以 dayNumber 分组
  const doneSet = new Set<number>();
  allCheckins
    .filter((c) => c.task.id === task.id && c.status === 'done')
    .forEach((c) => doneSet.add(c.dayNumber));

  let done = 0, total = 0;
  for (let i = 1; i <= elapsed; i++) {
    if (this.isTargetDay(task, i)) {
      total++;
      if (doneSet.has(i)) done++;
    }
  }
  return { done, total, rate: total > 0 ? +(done / total).toFixed(4) : 0 };
}

// 是否目标日：daily=是；custom=查 targetDays[dayNum-1]
private isTargetDay(task: Task, dayNumber: number): boolean {
  if (task.frequencyType === 'daily') return true;
  if (!task.targetDays) return false;
  return task.targetDays[dayNumber - 1] === true;
}

  // ---- helpers ----
  private async currentPlan(userId: string): Promise<Plan> {
    const plan = await this.plans.findOne({
      where: { user: { id: userId }, status: 'active' },
      order: { createdAt: 'DESC' },
    });
    if (!plan) throw new Error('还没有进行中的计划');
    return plan;
  }

  private calcElapsed(startDate: string) {
    const ms = new Date(this.todayStr()).getTime() - new Date(startDate).getTime();
    const elapsed = Math.floor(ms / 86400000) + 1;
    return { elapsedDays: Math.min(Math.max(elapsed, 0), TOTAL_DAYS) };
  }

  private async calcStreak(
    userId: string,
    plan: Plan,
    all: CheckIn[],
  ): Promise<number> {
    const set = new Set(
      all.filter((c) => c.status === 'done').map((c) => c.date),
    );
    let s = 0;
    for (let i = 0; i < TOTAL_DAYS; i++) {
      const dt = this.addDays(this.todayStr(), -i);
      if (dt < plan.startDate) break;
      if (set.has(dt)) {
        s++;
      } else if (dt === this.todayStr()) {
        continue; // 今天未打卡不中断
      } else {
        break;
      }
    }
    return s;
  }

  private countDoneDays(all: CheckIn[]): number {
    const set = new Set(all.filter((c) => c.status === 'done').map((c) => c.date));
    return set.size;
  }

  private async activeTasks(userId: string): Promise<Task[]> {
    return this.tasks.find({
      where: { user: { id: userId }, isArchived: false },
      order: { sortOrder: 'ASC' },
    });
  }

  private todayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  private addDays(s: string, n: number): string {
    const d = new Date(s);
    d.setDate(d.getDate() + n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  private diffDays(a: string, b: string): number {
    return Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86400000);
  }
}