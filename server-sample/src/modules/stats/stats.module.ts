import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckIn, Task, Plan, DailyNote } from '../../entities';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [TypeOrmModule.forFeature([CheckIn, Task, Plan, DailyNote])],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}