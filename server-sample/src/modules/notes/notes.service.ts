import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyNote, Plan } from '../../entities';

const TOTAL_DAYS = 21;

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(DailyNote) private repo: Repository<DailyNote>,
    @InjectRepository(Plan) private plans: Repository<Plan>,
  ) {}

  async get(userId: string, date: string) {
    const note = await this.repo.findOne({
      where: { user: { id: userId }, date },
    });
    return note ?? { date, content: '', mood: null };
  }

  async upsert(
    userId: string,
    body: { date: string; content: string; mood?: string },
  ) {
    const plan = await this.currentPlan(userId);
    const dayNumber = this.dayNumberOf(body.date, plan.startDate);
    if (dayNumber < 1 || dayNumber > TOTAL_DAYS) {
      throw new BadRequestException('日期不在计划范围内');
    }

    let note = await this.repo.findOne({
      where: { user: { id: userId }, date: body.date },
    });
    if (!note) {
      note = this.repo.create({
        user: { id: userId } as any,
        plan: { id: plan.id } as any,
        date: body.date,
        dayNumber,
        content: body.content,
        mood: body.mood ?? null,
      });
    } else {
      note.content = body.content;
      if (body.mood !== undefined) note.mood = body.mood ?? null;
    }
    return this.repo.save(note);
  }

  private async currentPlan(userId: string): Promise<Plan> {
    const plan = await this.plans.findOne({
      where: { user: { id: userId }, status: 'active' },
      order: { createdAt: 'DESC' },
    });
    if (!plan) throw new BadRequestException('还没有进行中的计划');
    return plan;
  }

  private dayNumberOf(date: string, startDate: string): number {
    const ms = new Date(date).getTime() - new Date(startDate).getTime();
    return Math.floor(ms / 86400000) + 1;
  }
}