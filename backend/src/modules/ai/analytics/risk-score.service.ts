import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import logger from '../../../common/logger/winston.logger';

export interface RiskScore {
  score: number; // 0-100
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: Array<{
    name: string;
    weight: number;
    contribution: number;
  }>;
  recommendations: string[];
}

/**
 * Risk Scoring Service
 * Calculates risk scores for entities
 */
@Injectable()
export class RiskScoreService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Score a user
   */
  async scoreUser(userId: string, tenantId?: string): Promise<RiskScore> {
    logger.info('Scoring user risk', { userId, tenantId });

    // In production, analyze:
    // - Activity patterns
    // - Login frequency
    // - Task completion rates
    // - Audit log anomalies

    const factors = [
      { name: 'Activity Level', weight: 0.3, contribution: 20 },
      { name: 'Task Completion', weight: 0.3, contribution: 15 },
      { name: 'Login Frequency', weight: 0.2, contribution: 10 },
      { name: 'Anomalies', weight: 0.2, contribution: 5 },
    ];

    const totalScore = factors.reduce(
      (sum, f) => sum + f.contribution * f.weight,
      0,
    );

    return {
      score: Math.min(100, totalScore),
      level: this.getRiskLevel(totalScore),
      factors,
      recommendations: this.getRecommendations(totalScore, 'user'),
    };
  }

  /**
   * Score a department
   */
  async scoreDepartment(departmentId: string, tenantId?: string): Promise<RiskScore> {
    logger.info('Scoring department risk', { departmentId, tenantId });

    // In production, analyze:
    // - Team size vs workload
    // - Task delays
    // - Manager responsiveness
    // - Employee turnover
    // - Pending invites

    const factors = [
      { name: 'Workload Balance', weight: 0.25, contribution: 20 },
      { name: 'Task Delays', weight: 0.25, contribution: 25 },
      { name: 'Manager Activity', weight: 0.2, contribution: 15 },
      { name: 'Team Stability', weight: 0.15, contribution: 10 },
      { name: 'Pending Invites', weight: 0.15, contribution: 5 },
    ];

    const totalScore = factors.reduce(
      (sum, f) => sum + f.contribution * f.weight,
      0,
    );

    return {
      score: Math.min(100, totalScore),
      level: this.getRiskLevel(totalScore),
      factors,
      recommendations: this.getRecommendations(totalScore, 'department'),
    };
  }

  /**
   * Score a company
   */
  async scoreCompany(companyId: string): Promise<RiskScore> {
    logger.info('Scoring company risk', { companyId });

    // Aggregate department and user scores
    const factors = [
      { name: 'Department Health', weight: 0.4, contribution: 30 },
      { name: 'User Engagement', weight: 0.3, contribution: 20 },
      { name: 'System Usage', weight: 0.2, contribution: 15 },
      { name: 'Growth Rate', weight: 0.1, contribution: 10 },
    ];

    const totalScore = factors.reduce(
      (sum, f) => sum + f.contribution * f.weight,
      0,
    );

    return {
      score: Math.min(100, totalScore),
      level: this.getRiskLevel(totalScore),
      factors,
      recommendations: this.getRecommendations(totalScore, 'company'),
    };
  }

  /**
   * Score a project
   */
  async scoreProject(projectId: string, tenantId?: string): Promise<RiskScore> {
    logger.info('Scoring project risk', { projectId, tenantId });

    // Analyze:
    // - Deadline proximity
    // - Task completion rate
    // - Resource allocation
    // - Historical delays

    const factors = [
      { name: 'Deadline Risk', weight: 0.3, contribution: 25 },
      { name: 'Task Progress', weight: 0.3, contribution: 20 },
      { name: 'Resource Allocation', weight: 0.2, contribution: 15 },
      { name: 'Historical Delays', weight: 0.2, contribution: 10 },
    ];

    const totalScore = factors.reduce(
      (sum, f) => sum + f.contribution * f.weight,
      0,
    );

    return {
      score: Math.min(100, totalScore),
      level: this.getRiskLevel(totalScore),
      factors,
      recommendations: this.getRecommendations(totalScore, 'project'),
    };
  }

  /**
   * Get risk level from score
   */
  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 75) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 25) return 'medium';
    return 'low';
  }

  /**
   * Get recommendations based on score
   */
  private getRecommendations(
    score: number,
    entityType: string,
  ): string[] {
    const recommendations: string[] = [];

    if (score >= 75) {
      recommendations.push(`Immediate attention required for ${entityType}`);
      recommendations.push('Review and address critical issues');
    } else if (score >= 50) {
      recommendations.push(`Monitor ${entityType} closely`);
      recommendations.push('Consider preventive measures');
    } else if (score >= 25) {
      recommendations.push(`Regular monitoring recommended for ${entityType}`);
    } else {
      recommendations.push(`${entityType} is in good health`);
    }

    return recommendations;
  }
}

