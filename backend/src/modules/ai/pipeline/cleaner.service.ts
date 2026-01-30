import { Injectable } from '@nestjs/common';
import logger from '../../../common/logger/winston.logger';

/**
 * Data Cleaning Service
 * Cleans and normalizes data before embedding
 */
@Injectable()
export class CleanerService {
  /**
   * Clean text data
   */
  clean(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    // Remove extra whitespace
    let cleaned = text.replace(/\s+/g, ' ').trim();

    // Remove special characters but keep basic punctuation
    cleaned = cleaned.replace(/[^\w\s.,!?;:()\-]/g, '');

    // Normalize line breaks
    cleaned = cleaned.replace(/\n+/g, '\n');

    // Remove HTML tags if present
    cleaned = cleaned.replace(/<[^>]*>/g, '');

    return cleaned;
  }

  /**
   * Clean and normalize entity data for embedding
   */
  cleanEntity(entity: any, entityType: string): string {
    const parts: string[] = [];

    // Add entity type
    parts.push(`Entity Type: ${entityType}`);

    // Add relevant fields based on entity type
    switch (entityType) {
      case 'user':
        if (entity.name) parts.push(`Name: ${entity.name}`);
        if (entity.email) parts.push(`Email: ${entity.email}`);
        if (entity.role) parts.push(`Role: ${entity.role}`);
        if (entity.department) parts.push(`Department: ${entity.department}`);
        break;

      case 'department':
        if (entity.name) parts.push(`Department: ${entity.name}`);
        if (entity.description) parts.push(`Description: ${entity.description}`);
        if (entity.manager) parts.push(`Manager: ${entity.manager}`);
        break;

      case 'task':
        if (entity.title) parts.push(`Task: ${entity.title}`);
        if (entity.description) parts.push(`Description: ${entity.description}`);
        if (entity.status) parts.push(`Status: ${entity.status}`);
        if (entity.priority) parts.push(`Priority: ${entity.priority}`);
        break;

      case 'project':
        if (entity.name) parts.push(`Project: ${entity.name}`);
        if (entity.description) parts.push(`Description: ${entity.description}`);
        if (entity.status) parts.push(`Status: ${entity.status}`);
        break;

      case 'audit':
        if (entity.action) parts.push(`Action: ${entity.action}`);
        if (entity.resource) parts.push(`Resource: ${entity.resource}`);
        if (entity.changes) {
          parts.push(`Changes: ${JSON.stringify(entity.changes)}`);
        }
        break;
    }

    // Add metadata
    if (entity.createdAt) {
      parts.push(`Created: ${new Date(entity.createdAt).toISOString()}`);
    }

    const combined = parts.join('\n');
    return this.clean(combined);
  }
}

