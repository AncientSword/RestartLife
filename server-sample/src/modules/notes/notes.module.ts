import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyNote, Plan } from '../../entities';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

@Module({
  imports: [TypeOrmModule.forFeature([DailyNote, Plan])],
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}