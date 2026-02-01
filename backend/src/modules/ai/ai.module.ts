import { Module } from '@nestjs/common';
import { AIController } from './controllers/ai.controller';
import { CleanerService } from './pipeline/cleaner.service';
import { ChunkService } from './pipeline/chunk.service';
import { EmbeddingService } from './pipeline/embedding.service';
import { IngestionConsumer } from './pipeline/ingestion.consumer';
import { PineconeService } from './vector/pinecone.service';
import { RagService } from './chat/rag.service';
import { AIAssistantService } from './chat/ai-assistant.service';
import { HRAgentService } from './agents/hr-agent.service';
import { ManagerAgentService } from './agents/manager-agent.service';
import { WorkflowAgentService } from './agents/workflow-agent.service';
import { AutomationAgentService } from './agents/automation-agent.service';
import { AIInsightsService } from './analytics/ai-insights.service';
import { RiskScoreService } from './analytics/risk-score.service';
import { PredictionService } from './analytics/prediction.service';
import { AISchedulerService } from './jobs/ai-scheduler.service';

@Module({
  controllers: [AIController],
  providers: [
    // Pipeline
    CleanerService,
    ChunkService,
    EmbeddingService,
    IngestionConsumer,
    // Vector
    PineconeService,
    // Chat
    RagService,
    AIAssistantService,
    // Agents
    HRAgentService,
    ManagerAgentService,
    WorkflowAgentService,
    AutomationAgentService,
    // Analytics
    AIInsightsService,
    RiskScoreService,
    PredictionService,
    // Jobs
    AISchedulerService,
  ],
  exports: [
    IngestionConsumer,
    RagService,
    AIAssistantService,
    AIInsightsService,
    RiskScoreService,
  ],
})
export class AIModule {}

