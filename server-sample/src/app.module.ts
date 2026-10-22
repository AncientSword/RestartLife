import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';

import { JwtAuthGuard } from './common/jwt-auth.guard';
import { User, Plan, Task, CheckIn, DailyNote, Todo } from './entities';

import { AuthModule } from './modules/auth/auth.module';
import { PlansModule } from './modules/plans/plans.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { CheckinsModule } from './modules/checkins/checkins.module';
import { NotesModule } from './modules/notes/notes.module';
import { StatsModule } from './modules/stats/stats.module';
import { TodosModule } from './modules/todos/todos.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [User, Plan, Task, CheckIn, DailyNote, Todo],
      synchronize: true, // dev only，生产用 migration
    }),
    AuthModule,
    PlansModule,
    TasksModule,
    CheckinsModule,
    NotesModule,
    StatsModule,
    TodosModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}