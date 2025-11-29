/**
 * Standardized Event Schema for Microservices Communication
 * All events across services follow this structure
 */

export interface BaseEvent {
  eventId: string; // UUID
  eventType: string; // e.g., 'user.created', 'company.updated'
  version: number; // Schema version for backward compatibility
  timestamp: string; // ISO 8601 timestamp
  sourceService: string; // Service that emitted the event
  tenantId?: string; // Company/tenant identifier
  userId?: string; // User who triggered the event
  correlationId?: string; // For tracing across services
  data: Record<string, any>; // Event-specific payload
}

/**
 * Event Types Enum
 */
export enum EventType {
  // User Events
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_PASSWORD_CHANGED = 'user.password.changed',
  USER_ROLE_CHANGED = 'user.role.changed',

  // Company Events
  COMPANY_CREATED = 'company.created',
  COMPANY_UPDATED = 'company.updated',
  COMPANY_DELETED = 'company.deleted',

  // Invite Events
  INVITE_SENT = 'invite.sent',
  INVITE_ACCEPTED = 'invite.accepted',
  INVITE_EXPIRED = 'invite.expired',

  // Department Events
  DEPARTMENT_CREATED = 'department.created',
  DEPARTMENT_UPDATED = 'department.updated',
  DEPARTMENT_DELETED = 'department.deleted',

  // Task Events
  TASK_CREATED = 'task.created',
  TASK_UPDATED = 'task.updated',
  TASK_COMPLETED = 'task.completed',
  TASK_DELETED = 'task.deleted',

  // Project Events
  PROJECT_CREATED = 'project.created',
  PROJECT_UPDATED = 'project.updated',
  PROJECT_DELETED = 'project.deleted',

  // Audit Events
  AUDIT_LOG_CREATED = 'audit.log.created',

  // Notification Events
  NOTIFICATION_SENT = 'notification.sent',
  NOTIFICATION_FAILED = 'notification.failed',

  // Analytics Events
  ANALYTICS_EVENT = 'analytics.event',
  ANALYTICS_AGGREGATION_COMPLETE = 'analytics.aggregation.complete',
}

/**
 * Event Factory - Creates standardized events
 */
export class EventFactory {
  /**
   * Create a standardized event
   */
  static create(
    eventType: EventType | string,
    data: Record<string, any>,
    options: {
      sourceService: string;
      tenantId?: string;
      userId?: string;
      correlationId?: string;
    },
  ): BaseEvent {
    return {
      eventId: this.generateEventId(),
      eventType,
      version: 1,
      timestamp: new Date().toISOString(),
      sourceService: options.sourceService,
      tenantId: options.tenantId,
      userId: options.userId,
      correlationId: options.correlationId,
      data,
    };
  }

  /**
   * Generate unique event ID
   */
  private static generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate event structure
   */
  static validate(event: any): event is BaseEvent {
    return (
      typeof event === 'object' &&
      typeof event.eventId === 'string' &&
      typeof event.eventType === 'string' &&
      typeof event.version === 'number' &&
      typeof event.timestamp === 'string' &&
      typeof event.sourceService === 'string' &&
      typeof event.data === 'object'
    );
  }
}

/**
 * Event Payload Types
 */
export interface UserCreatedEventData {
  userId: string;
  email: string;
  name: string;
  role: string;
  companyId: string;
}

export interface CompanyUpdatedEventData {
  companyId: string;
  changes: Record<string, any>;
}

export interface InviteSentEventData {
  inviteId: string;
  email: string;
  role: string;
  companyId: string;
  token: string;
}

export interface AuditLogEventData {
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface NotificationEventData {
  type: 'email' | 'sms' | 'push' | 'in-app';
  recipient: string;
  template: string;
  data: Record<string, any>;
}

