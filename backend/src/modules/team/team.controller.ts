import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { TeamsService } from './team.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { AddMemberDto } from './dto/add-member.dto';

@Controller('teams')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  // Managers and Admins can create teams
  @Post()
  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPERADMIN)
  async create(@Body() dto: CreateTeamDto, @Req() req) {
    const user = req.user;
    return this.teamsService.create(dto, user.userId || user._id || user.id);
  }

  // list teams related to the logged-in user
  @Get()
  async list(@Req() req) {
    const user = req.user;
    return this.teamsService.listForUser(user.userId || user._id || user.id);
  }

  // get a single team (only if manager or member)
  @Get(':id')
  async get(@Param('id') id: string, @Req() req) {
    const user = req.user;
    return this.teamsService.getById(id, user.userId || user._id || user.id);
  }

  // add member to team
  @Post(':id/members')
  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPERADMIN)
  async addMember(
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
    @Req() req,
  ) {
    const user = req.user;
    return this.teamsService.addMember(id, dto, user);
  }

  // remove member
  @Delete(':id/members/:memberId')
  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPERADMIN)
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Req() req,
  ) {
    const user = req.user;
    return this.teamsService.removeMember(id, memberId, user);
  }

  // delete team
  @Delete(':id')
  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPERADMIN)
  async delete(@Param('id') id: string, @Req() req) {
    const user = req.user;
    return this.teamsService.deleteTeam(id, user);
  }
}
