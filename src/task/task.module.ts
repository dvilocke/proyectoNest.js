import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  controllers: [TaskController],
  providers: [TaskService],
  imports: [
    DatabaseModule
  ]
})
export class TaskModule {}
