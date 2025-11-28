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
  Query,
} from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { WorkflowEngineService } from './workflow-engine.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { ExecuteWorkflowDto } from './dto/execute-workflow.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { WorkflowStatus } from './entities/workflow.entity';

@Controller('workflow')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkflowController {
  constructor(
    private readonly workflowService: WorkflowService,
    private readonly workflowEngineService: WorkflowEngineService,
  ) {}

  /**
   * Create workflow
   */
  @Post()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async create(@Body() createWorkflowDto: CreateWorkflowDto, @Req() req) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;

    const workflow = await this.workflowService.create(createWorkflowDto, companyId, user._id || user.id);
    
    return {
      success: true,
      workflow,
    };
  }

  /**
   * Get all workflows
   */
  @Get()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.USER, UserRole.SUPER_ADMIN)
  async findAll(
    @Req() req,
    @Query('status') status?: WorkflowStatus,
    @Query('search') search?: string,
  ) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;

    const workflows = await this.workflowService.findAll(companyId, { status, search });
    
    return {
      success: true,
      workflows,
    };
  }

  /**
   * Get one workflow
   */
  @Get(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.USER, UserRole.SUPER_ADMIN)
  async findOne(@Param('id') id: string, @Req() req) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;

    const workflow = await this.workflowService.findOne(id, companyId);
    
    return {
      success: true,
      workflow,
    };
  }

  /**
   * Update workflow
   */
  @Patch(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateWorkflowDto: UpdateWorkflowDto,
    @Req() req,
  ) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;

    const workflow = await this.workflowService.update(id, updateWorkflowDto, companyId);
    
    return {
      success: true,
      workflow,
    };
  }

  /**
   * Delete workflow
   */
  @Delete(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async remove(@Param('id') id: string, @Req() req) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;

    await this.workflowService.remove(id, companyId);
    
    return {
      success: true,
      message: 'Workflow deleted successfully',
    };
  }

  /**
   * Toggle workflow status
   */
  @Patch(':id/toggle-status')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async toggleStatus(@Param('id') id: string, @Req() req) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;

    const workflow = await this.workflowService.toggleStatus(id, companyId);
    
    return {
      success: true,
      workflow,
    };
  }

  /**
   * Duplicate workflow
   */
  @Post(':id/duplicate')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async duplicate(@Param('id') id: string, @Req() req) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;

    const workflow = await this.workflowService.duplicate(id, companyId, user._id || user.id);
    
    return {
      success: true,
      workflow,
    };
  }

  /**
   * Execute workflow (test)
   */
  @Post(':id/execute')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async execute(
    @Param('id') id: string,
    @Body() executeDto: ExecuteWorkflowDto,
    @Req() req,
  ) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;

    const execution = await this.workflowEngineService.executeWorkflow(
      id,
      companyId,
      executeDto.triggerData || {},
    );
    
    return {
      success: true,
      execution,
    };
  }

  /**
   * Get workflow executions
   */
  @Get(':id/executions')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async getExecutions(
    @Param('id') id: string,
    @Req() req,
    @Query('limit') limit?: string,
  ) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;

    // This would be implemented in a separate service
    // For now, return empty array
    return {
      success: true,
      executions: [],
    };
  }
}

