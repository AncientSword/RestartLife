import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, Relation, Unique,
} from 'typeorm';
import { User, Plan } from './index';

@Entity('daily_notes')
@Unique('uq_user_plan_date', ['user', 'plan', 'date'])
export class DailyNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (u) => u.notes, { onDelete: 'CASCADE' })
  user: Relation<User>;

  @ManyToOne(() => Plan, (p) => p.notes, { onDelete: 'CASCADE' })
  plan: Relation<Plan>;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'int' })
  dayNumber: number;

  @Column({ type: 'text', default: '' })
  content: string;

  @Column({ length: 16, nullable: true, comment: 'happy/ok/tired/sad/fire' })
  mood: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}