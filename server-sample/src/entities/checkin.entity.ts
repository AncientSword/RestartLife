import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, Relation, Unique, Index,
} from 'typeorm';
import { User, Plan, Task } from './index';

export type CheckInStatus = 'pending' | 'done';

@Entity('checkins')
@Unique('uq_user_task_date', ['user', 'task', 'date'])
@Index(['user', 'date'])
export class CheckIn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (u) => u.checkins, { onDelete: 'CASCADE' })
  user: Relation<User>;

  @ManyToOne(() => Plan, (p) => p.checkins, { onDelete: 'CASCADE' })
  plan: Relation<Plan>;

  @ManyToOne(() => Task, (t) => t.checkins, { onDelete: 'CASCADE' })
  task: Relation<Task>;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'int', comment: '1~21' })
  dayNumber: number;

  @Column({ type: 'varchar', default: 'pending' })
  status: CheckInStatus;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}