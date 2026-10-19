import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, OneToMany, Relation, Index,
} from 'typeorm';
import { User, CheckIn, DailyNote } from './index';

export type PlanStatus = 'active' | 'completed' | 'abandoned';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (u) => u.plans, { onDelete: 'CASCADE' })
  user: Relation<User>;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date', comment: 'start_date + 20 天' })
  endDate: string;

  @Column({ type: 'varchar', default: 'active' })
  status: PlanStatus;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => CheckIn, (c) => c.plan)
  checkins: Relation<CheckIn>[];

  @OneToMany(() => DailyNote, (n) => n.plan)
  notes: Relation<DailyNote>[];
}