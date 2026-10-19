import {
  Injectable, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan, Task } from '../../entities';

const TOTAL_DAYS = 21;

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan) private repo: Repository<Plan>,
    @InjectRepository(Task) private tasks: Repository<Task>,
  ) {}

  // 创建计划：默认从今天开始，首次创建会自动种入 5 个默认打卡项
  async create(userId: string, startDate?: string) {
    const start = startDate ?? this.todayStr();
    const end = this.addDays(start, TOTAL_DAYS - 1);

    const existing = await this.repo.findOne({
      where: { user: { id: userId }, status: 'active' },
    });
    if (existing) {
      throw new BadRequestException('已有进行中的计划，请先结束当前计划');
    }

    const plan = this.repo.create({
      user: { id: userId } as any,
      startDate: start,
      endDate: end,
      status: 'active',
    });
    const saved = await this.repo.save(plan);

    // 首次创建自动初始化默认打卡项
    await this.seedDefaultTasks(userId);
    return saved;
  }

  async getCurrent(userId: string) {
    return this.repo.findOne({
      where: { user: { id: userId }, status: 'active' },
      order: { createdAt: 'DESC' },
    });
  }

  async getById(userId: string, id: string) {
    const plan = await this.repo.findOne({
      where: { id, user: { id: userId } },
    });
    if (!plan) throw new NotFoundException('计划不存在');
    return plan;
  }

  async update(userId: string, id: string, body: { status?: any }) {
    const plan = await this.getById(userId, id);
    if (body.status) plan.status = body.status;
    return this.repo.save(plan);
  }

  private async seedDefaultTasks(userId: string) {
    const hasTasks = await this.tasks.count({ where: { user: { id: userId } } });
    if (hasTasks > 0) return;
const defaults = [
  { name: '远离电子设备', icon: '📵', color: '#9B7EBD', frequencyType: 'daily' },
  { name: '早睡',        icon: '🌙', color: '#4A90A4', frequencyType: 'daily' },
  { name: '早起',        icon: '☀️', color: '#E8B04B', frequencyType: 'daily' },
  { name: '运动',        icon: '💪', color: '#D87171', frequencyType: 'custom' },
  { name: '阅读',        icon: '📖', color: '#5B8C5A', frequencyType: 'custom' },
];
    let i = 0;
    for (const d of defaults) {
      await this.tasks.save(
        this.tasks.create({ user: { id: userId } as any, sortOrder: i++, isDefault: true, ...d }),
      );
    }
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
}