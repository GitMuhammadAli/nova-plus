import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async create(@Body() createDepartmentDto: CreateDepartmentDto, @Req() req) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;

    const department = await this.departmentService.create(
      createDepartmentDto,
      companyId,
      user._id || user.id,
    );

    return {
      success: true,
      department,
    };
  }

  @Get()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.USER, UserRole.SUPER_ADMIN)
  async findAll(@Req() req) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;

    const departments = await this.departmentService.findAll(companyId);

    return {
      success: true,
      departments,
    };
  }

  @Get(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.USER, UserRole.SUPER_ADMIN)
  async findOne(@Param('id') id: string, @Req() req) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;

    const department = await this.departmentService.findOne(id, companyId);

    return {
      success: true,
      department,
    };
  }

  @Patch(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
    @Req() req,
  ) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;

    const department = await this.departmentService.update(id, updateDepartmentDto, companyId);

    return {
      success: true,
      department,
    };
  }

  @Delete(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async remove(@Param('id') id: string, @Req() req) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;

    await this.departmentService.remove(id, companyId);

    return {
      success: true,
      message: 'Department deleted successfully',
    };
  }

  @Post(':id/assign-manager')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async assignManager(
    @Param('id') id: string,
    @Body() body: { managerId: string },
    @Req() req,
  ) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;

    const department = await this.departmentService.assignManager(id, body.managerId, companyId);

    return {
      success: true,
      department,
    };
  }

  @Post(':id/members')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async addMember(
    @Param('id') id: string,
    @Body() body: { userId: string },
    @Req() req,
  ) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;

    const department = await this.departmentService.addMember(id, body.userId, companyId);

    return {
      success: true,
      department,
    };
  }

  @Delete(':id/members/:userId')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Req() req,
  ) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;

    const department = await this.departmentService.removeMember(id, userId, companyId);

    return {
      success: true,
      department,
    };
  }

  @Get(':id/members')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.USER, UserRole.SUPER_ADMIN)
  async getMembers(@Param('id') id: string, @Req() req) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;

    const department = await this.departmentService.findOne(id, companyId);
    const members = await this.departmentService.getMembers(id, companyId);

    return {
      success: true,
      department: {
        _id: department._id,
        name: department.name,
        description: department.description,
      },
      members,
    };
  }
}

