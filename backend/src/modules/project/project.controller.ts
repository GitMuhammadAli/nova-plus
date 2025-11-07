import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectStatus } from './entities/project.entity';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  create(@Body() createProjectDto: CreateProjectDto, @Req() req) {
    return this.projectService.create(createProjectDto, req.user);
  }

  @Get()
  findAll(
    @Req() req,
    @Query('status') status?: ProjectStatus,
    @Query('assignedTo') assignedTo?: string,
  ) {
    return this.projectService.findAll(req.user, { status, assignedTo });
  }

  @Get('me')
  findMyProjects(@Req() req) {
    return this.projectService.findUserProjects(req.user._id.toString(), req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.projectService.findOne(id, req.user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Req() req,
  ) {
    return this.projectService.update(id, updateProjectDto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.projectService.remove(id, req.user);
  }
}

