import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Team, TeamDocument } from './entities/team.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UserDocument } from '../user/entities/user.entity';

@Injectable()
export class TeamsService {
  constructor(@InjectModel(Team.name) private teamModel: Model<TeamDocument>) {}

  async create(createDto: CreateTeamDto, managerId: string) {
    const team = new this.teamModel({
      name: createDto.name,
      manager: new Types.ObjectId(managerId),
      members: (createDto.members || []).map((m) => new Types.ObjectId(m)),
    });
    return team.save();
  }

  // list teams where user is manager or member
  async listForUser(userId: string) {
    return this.teamModel
      .find({
        $or: [{ manager: new Types.ObjectId(userId) }, { members: new Types.ObjectId(userId) }],
      })
      .populate('manager', '-password -__v')
      .populate('members', '-password -__v')
      .lean()
      .exec();
  }

  // get one team by id (if user is manager or member)
  async getById(teamId: string, userId: string) {
    const team = await this.teamModel.findById(teamId).populate('members', '-password -__v').populate('manager', '-password -__v').exec();
    if (!team) throw new NotFoundException('Team not found');
    const isRelated =
      team.manager.toString() === userId || team.members.some((m: Types.ObjectId) => m.toString() === userId);
    if (!isRelated) throw new ForbiddenException('Access denied to this team');
    return team;
  }

  // manager or admin can add member
  async addMember(teamId: string, dto: AddMemberDto, actor: UserDocument) {
    const team = await this.teamModel.findById(teamId).exec();
    if (!team) throw new NotFoundException('Team not found');

    // only manager or admin can add members
    const actorId = actor._id?.toString?.() ?? actor['id'] ?? String(actor);
    const isManager = team.manager.toString() === actorId;
    const isAdmin = actor.role === 'admin' || actor.role === 'superadmin';

    if (!isManager && !isAdmin) throw new ForbiddenException('Only team manager or admin can add members');

    const newMemberId = new Types.ObjectId(dto.userId);
    // prevent duplicates
    if (!team.members.some((m: Types.ObjectId) => m.toString() === newMemberId.toString())) {
      team.members.push(newMemberId);
      await team.save();
    }
    return team;
  }

  // manager or admin can remove member
  async removeMember(teamId: string, memberId: string, actor: UserDocument) {
    const team = await this.teamModel.findById(teamId).exec();
    if (!team) throw new NotFoundException('Team not found');

    const actorId = actor._id?.toString?.() ?? actor['id'] ?? String(actor);
    const isManager = team.manager.toString() === actorId;
    const isAdmin = actor.role === 'admin' || actor.role === 'superadmin';

    if (!isManager && !isAdmin) throw new ForbiddenException('Only team manager or admin can remove members');

    team.members = team.members.filter((m: Types.ObjectId) => m.toString() !== memberId);
    await team.save();
    return team;
  }

  // optional: manager can delete their team (admins can too)
  async deleteTeam(teamId: string, actor: UserDocument) {
    const team = await this.teamModel.findById(teamId).exec();
    if (!team) throw new NotFoundException('Team not found');

    const actorId = actor._id?.toString?.() ?? actor['id'] ?? String(actor);
    const isManager = team.manager.toString() === actorId;
        const isAdmin = actor.role === 'admin' || actor.role === 'superadmin';

    if (!isManager && !isAdmin) throw new ForbiddenException('Only manager or admin can delete team');

    await this.teamModel.deleteOne({ _id: team._id }).exec();
    return { ok: true };
  }
}
