import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, OneToMany, Relation,
} from 'typeorm';
import { User, CheckIn } from './index';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (u) => u.tasks, { onDelete: 'CASCADE' })
  user: Relation<User>;

  @Column({ length: 32 })
  name: string;

  @Column({ length: 16, comment: 'emoji 或图标 key' })
  icon: string;

  @Column({ length: 9, default: '#5B8C5A' })
  color: string;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ default: false })
  isDefault: boolean;

  // 频率类型：daily=每天必打；custom=自由选择目标日
  @Column({ type: 'varchar', length: 10, default: 'daily' })
  frequencyType: 'daily' | 'custom';

  // custom 模式下，哪些天是目标日（21 个布尔，对应 day 1~21）
  // daily 模式可为 null
  @Column({ type: 'simple-json', nullable: true })
  targetDays: boolean[] | null;

  // 已使用的补打卡次数（每项目21天内最多3次）
  @Column({ type: 'int', default: 0 })
  makeupUsed: number;

  @Column({ default: false, comment: '软删除标记' })
  isArchived: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => CheckIn, (c) => c.task)
  checkins: Relation<CheckIn>[];
}