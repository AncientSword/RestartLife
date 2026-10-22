import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, Relation,
} from 'typeorm';
import { User } from './index';

@Entity('todos')
export class Todo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (u) => u.tasks, { onDelete: 'CASCADE' })
  user: Relation<User>;

  @Column({ length: 100 })
  title: string;

  @Column({ type: 'text', default: '' })
  note: string;

  // 可选截止日期 YYYY-MM-DD
  @Column({ type: 'date', nullable: true })
  dueDate: string | null;

  @Column({ default: false })
  pinned: boolean;

  // 完成时间，null = 未完成
  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}