import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AIAssistantService } from '../chat/ai-assistant.service';
import { RagService } from '../chat/rag.service';
import { AIInsightsService } from '../analytics/ai-insights.service';
import { RiskScoreService } from '../analytics/risk-score.service';
import { HRAgentService } from '../agents/hr-agent.service';
import { ChatRequestDto, ChatResponseDto } from '../dto/chat.dto';
import { SemanticSearchDto, SearchResponseDto } from '../dto/search.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
  constructor(
    private readonly aiAssistant: AIAssistantService,
    private readonly rag: RagService,
    private readonly insights: AIInsightsService,
    private readonly riskScore: RiskScoreService,
    private readonly hrAgent: HRAgentService,
  ) {}

  @Post('chat')
  async chat(
    @Body() dto: ChatRequestDto,
    @CurrentUser() user: any,
  ): Promise<ChatResponseDto> {
    return this.aiAssistant.chat(dto.message, user._id || user.id, {
      tenantId: dto.tenantId || user.companyId,
      conversationHistory: dto.history as
        | Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
        | undefined,
    });
  }

  @Post('search')
  async search(
    @Body() dto: SemanticSearchDto,
    @CurrentUser() user: any,
  ): Promise<SearchResponseDto> {
    const results = await this.rag.query(dto.query, user._id || user.id, {
      tenantId: dto.tenantId || user.companyId,
      topK: dto.topK,
    });

    return {
      results: results.sources,
      total: results.sources.length,
    };
  }

  @Get('insights')
  async getInsights(@CurrentUser() user: any) {
    const companyId = user.companyId;
    return this.insights.generateCompanyInsights(companyId);
  }

  @Get('insights/departments')
  async getDepartmentInsights(@CurrentUser() user: any) {
    const companyId = user.companyId;
    return this.insights.generateDepartmentInsights(companyId);
  }

  @Get('risks')
  async getRisks(@CurrentUser() user: any) {
    const companyId = user.companyId;
    const companyRisk = await this.riskScore.scoreCompany(companyId);
    const highRiskDepts =
      await this.insights.detectHighRiskDepartments(companyId);

    return {
      company: companyRisk,
      departments: highRiskDepts,
    };
  }

  @Get('risks/user/:userId')
  async getUserRisk(@Param('userId') userId: string, @CurrentUser() user: any) {
    return this.riskScore.scoreUser(userId, user.companyId);
  }

  @Get('risks/department/:departmentId')
  async getDepartmentRisk(
    @Param('departmentId') departmentId: string,
    @CurrentUser() user: any,
  ) {
    return this.riskScore.scoreDepartment(departmentId, user.companyId);
  }

  @Get('hr/recommendations/:departmentId')
  async getHiringRecommendations(@Param('departmentId') departmentId: string) {
    return this.hrAgent.recommendHiring(departmentId);
  }

  @Get('hr/morale/:departmentId')
  async getMoraleIssues(@Param('departmentId') departmentId: string) {
    return this.hrAgent.detectMoraleIssues(departmentId);
  }

  @Get('summary/:type')
  async generateSummary(
    @Param('type') type: 'daily' | 'weekly' | 'department',
    @Query('departmentId') departmentId: string,
    @CurrentUser() user: any,
  ) {
    return this.aiAssistant.generateSummary(type, user.companyId, {
      departmentId,
    });
  }
}
