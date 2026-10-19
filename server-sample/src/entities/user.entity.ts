import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  OneToMany, Relation,
} from 'typeorm';
import { Plan, Task, CheckIn, DailyNote } from './index';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 64 })
  nickname: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ unique: true, length: 128, nullable: true })
  email: string;

  @Column({ select: false, nullable: true })
  passwordHash: string;

  @Column({ nullable: true, comment: '微信小程序 openid' })
  wxOpenId: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Plan, (p) => p.user)
  plans: Relation<Plan>[];

  @OneToMany(() => Task, (t) => t.user)
  tasks: Relation<Task>[];

  @OneToMany(() => CheckIn, (c) => c.user)
  checkins: Relation<CheckIn>[];

  @OneToMany(() => DailyNote, (n) => n.user)
  notes: Relation<DailyNote>[];
}