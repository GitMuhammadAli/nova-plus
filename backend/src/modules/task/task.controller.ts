import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TasksService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TaskStatus } from './entities/task.entity';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() dto: CreateTaskDto, @Req() req) {
    return this.tasksService.create(dto, req.user);
  }

  @Get()
  findAll(
    @Req() req,
    @Query('projectId') projectId?: string,
    @Query('status') status?: TaskStatus,
    @Query('assignedTo') assignedTo?: string,
  ) {
    return this.tasksService.findAll(req.user, {
      projectId,
      status,
      assignedTo,
    });
  }

  @Get('me')
  findMyTasks(@Req() req) {
    return this.tasksService.findMyTasks(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.tasksService.findOne(id, req.user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Req() req,
  ) {
    return this.tasksService.update(id, updateTaskDto, req.user);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: TaskStatus },
    @Req() req,
  ) {
    return this.tasksService.updateStatus(id, body.status, req.user);
  }

  @Post(':id/comments')
  addComment(
    @Param('id') id: string,
    @Body() body: { comment: string },
    @Req() req,
  ) {
    return this.tasksService.addComment(id, body.comment, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.tasksService.remove(id, req.user);
  }
}
