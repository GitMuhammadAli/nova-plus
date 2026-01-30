/**
 * MongoDB Index Definitions
 * 
 * This file contains index definitions for all collections.
 * Run this script to ensure all indexes are created.
 * 
 * Usage: npx ts-node src/database/indexes.ts
 */

import { Schema } from 'mongoose';

/**
 * User collection indexes
 */
export const userIndexes = [
  { key: { email: 1 }, options: { unique: true, name: 'email_unique' } },
  { key: { companyId: 1 }, options: { name: 'companyId_idx' } },
  { key: { companyId: 1, role: 1 }, options: { name: 'companyId_role_idx' } },
  { key: { companyId: 1, isActive: 1 }, options: { name: 'companyId_isActive_idx' } },
  { key: { companyId: 1, email: 1 }, options: { name: 'companyId_email_idx' } },
  { key: { managerId: 1 }, options: { name: 'managerId_idx', sparse: true } },
  { key: { createdAt: -1 }, options: { name: 'createdAt_desc_idx' } },
  { key: { lastSeenAt: -1 }, options: { name: 'lastSeenAt_desc_idx', sparse: true } },
];

/**
 * Company collection indexes
 */
export const companyIndexes = [
  { key: { name: 1 }, options: { unique: true, name: 'name_unique' } },
  { key: { domain: 1 }, options: { unique: true, sparse: true, name: 'domain_unique' } },
  { key: { isActive: 1 }, options: { name: 'isActive_idx' } },
  { key: { createdAt: -1 }, options: { name: 'createdAt_desc_idx' } },
];

/**
 * Department collection indexes
 */
export const departmentIndexes = [
  { key: { companyId: 1 }, options: { name: 'companyId_idx' } },
  { key: { companyId: 1, name: 1 }, options: { unique: true, name: 'companyId_name_unique' } },
  { key: { companyId: 1, isActive: 1 }, options: { name: 'companyId_isActive_idx' } },
  { key: { managerId: 1 }, options: { name: 'managerId_idx', sparse: true } },
];

/**
 * Project collection indexes
 */
export const projectIndexes = [
  { key: { companyId: 1 }, options: { name: 'companyId_idx' } },
  { key: { companyId: 1, status: 1 }, options: { name: 'companyId_status_idx' } },
  { key: { companyId: 1, isActive: 1 }, options: { name: 'companyId_isActive_idx' } },
  { key: { createdBy: 1 }, options: { name: 'createdBy_idx' } },
  { key: { assignedUsers: 1 }, options: { name: 'assignedUsers_idx' } },
  { key: { createdAt: -1 }, options: { name: 'createdAt_desc_idx' } },
  { key: { startDate: 1, endDate: 1 }, options: { name: 'dateRange_idx' } },
];

/**
 * Task collection indexes
 */
export const taskIndexes = [
  { key: { companyId: 1 }, options: { name: 'companyId_idx' } },
  { key: { companyId: 1, status: 1 }, options: { name: 'companyId_status_idx' } },
  { key: { companyId: 1, assignedTo: 1 }, options: { name: 'companyId_assignedTo_idx' } },
  { key: { projectId: 1 }, options: { name: 'projectId_idx' } },
  { key: { projectId: 1, status: 1 }, options: { name: 'projectId_status_idx' } },
  { key: { assignedTo: 1 }, options: { name: 'assignedTo_idx' } },
  { key: { createdBy: 1 }, options: { name: 'createdBy_idx' } },
  { key: { dueDate: 1 }, options: { name: 'dueDate_idx' } },
  { key: { createdAt: -1 }, options: { name: 'createdAt_desc_idx' } },
  { key: { priority: 1, dueDate: 1 }, options: { name: 'priority_dueDate_idx' } },
];

/**
 * Team collection indexes
 */
export const teamIndexes = [
  { key: { manager: 1 }, options: { name: 'manager_idx' } },
  { key: { members: 1 }, options: { name: 'members_idx' } },
  { key: { name: 1 }, options: { name: 'name_idx' } },
];

/**
 * Workflow collection indexes
 */
export const workflowIndexes = [
  { key: { companyId: 1 }, options: { name: 'companyId_idx' } },
  { key: { companyId: 1, status: 1 }, options: { name: 'companyId_status_idx' } },
  { key: { createdBy: 1 }, options: { name: 'createdBy_idx' } },
  { key: { status: 1 }, options: { name: 'status_idx' } },
  { key: { tags: 1 }, options: { name: 'tags_idx' } },
  { key: { createdAt: -1 }, options: { name: 'createdAt_desc_idx' } },
];

/**
 * Audit Log collection indexes
 */
export const auditLogIndexes = [
  { key: { companyId: 1 }, options: { name: 'companyId_idx' } },
  { key: { companyId: 1, createdAt: -1 }, options: { name: 'companyId_createdAt_idx' } },
  { key: { companyId: 1, action: 1 }, options: { name: 'companyId_action_idx' } },
  { key: { companyId: 1, resource: 1 }, options: { name: 'companyId_resource_idx' } },
  { key: { userId: 1 }, options: { name: 'userId_idx' } },
  { key: { userId: 1, createdAt: -1 }, options: { name: 'userId_createdAt_idx' } },
  { key: { action: 1 }, options: { name: 'action_idx' } },
  { key: { resource: 1 }, options: { name: 'resource_idx' } },
  { key: { createdAt: -1 }, options: { name: 'createdAt_desc_idx' } },
  // TTL index to auto-delete old audit logs after 90 days
  { key: { createdAt: 1 }, options: { name: 'createdAt_ttl_idx', expireAfterSeconds: 7776000 } },
];

/**
 * Subscription collection indexes
 */
export const subscriptionIndexes = [
  { key: { companyId: 1 }, options: { unique: true, name: 'companyId_unique' } },
  { key: { stripeSubscriptionId: 1 }, options: { unique: true, name: 'stripeSubscriptionId_unique' } },
  { key: { stripeCustomerId: 1 }, options: { name: 'stripeCustomerId_idx' } },
  { key: { status: 1 }, options: { name: 'status_idx' } },
  { key: { currentPeriodEnd: 1 }, options: { name: 'currentPeriodEnd_idx' } },
];

/**
 * Invoice collection indexes
 */
export const invoiceIndexes = [
  { key: { companyId: 1 }, options: { name: 'companyId_idx' } },
  { key: { companyId: 1, createdAt: -1 }, options: { name: 'companyId_createdAt_idx' } },
  { key: { stripeInvoiceId: 1 }, options: { unique: true, name: 'stripeInvoiceId_unique' } },
  { key: { stripeSubscriptionId: 1 }, options: { name: 'stripeSubscriptionId_idx' } },
  { key: { status: 1 }, options: { name: 'status_idx' } },
];

/**
 * Upload collection indexes
 */
export const uploadIndexes = [
  { key: { companyId: 1 }, options: { name: 'companyId_idx' } },
  { key: { companyId: 1, createdAt: -1 }, options: { name: 'companyId_createdAt_idx' } },
  { key: { uploadedBy: 1 }, options: { name: 'uploadedBy_idx' } },
  { key: { mimeType: 1 }, options: { name: 'mimeType_idx' } },
  { key: { publicId: 1 }, options: { name: 'publicId_idx', sparse: true } },
];

/**
 * Invite collection indexes
 */
export const inviteIndexes = [
  { key: { token: 1 }, options: { unique: true, name: 'token_unique' } },
  { key: { email: 1 }, options: { name: 'email_idx' } },
  { key: { companyId: 1 }, options: { name: 'companyId_idx' } },
  { key: { companyId: 1, status: 1 }, options: { name: 'companyId_status_idx' } },
  { key: { status: 1 }, options: { name: 'status_idx' } },
  { key: { expiresAt: 1 }, options: { name: 'expiresAt_idx' } },
  // TTL index to auto-delete expired invites after 30 days past expiration
  { key: { expiresAt: 1 }, options: { name: 'expiresAt_ttl_idx', expireAfterSeconds: 2592000 } },
];

/**
 * Session collection indexes
 */
export const sessionIndexes = [
  { key: { userId: 1 }, options: { name: 'userId_idx' } },
  { key: { refreshTokenHash: 1 }, options: { name: 'refreshTokenHash_idx' } },
  { key: { createdAt: -1 }, options: { name: 'createdAt_desc_idx' } },
  // TTL index for session expiration (30 days)
  { key: { createdAt: 1 }, options: { name: 'createdAt_ttl_idx', expireAfterSeconds: 2592000 } },
];

/**
 * Webhook collection indexes
 */
export const webhookIndexes = [
  { key: { companyId: 1 }, options: { name: 'companyId_idx' } },
  { key: { companyId: 1, isActive: 1 }, options: { name: 'companyId_isActive_idx' } },
  { key: { events: 1 }, options: { name: 'events_idx' } },
];

/**
 * Activity collection indexes
 */
export const activityIndexes = [
  { key: { userId: 1 }, options: { name: 'userId_idx' } },
  { key: { userId: 1, createdAt: -1 }, options: { name: 'userId_createdAt_idx' } },
  { key: { entityType: 1 }, options: { name: 'entityType_idx' } },
  { key: { entityId: 1 }, options: { name: 'entityId_idx' } },
  { key: { action: 1 }, options: { name: 'action_idx' } },
  { key: { createdAt: -1 }, options: { name: 'createdAt_desc_idx' } },
  // TTL index for activity cleanup (30 days)
  { key: { createdAt: 1 }, options: { name: 'createdAt_ttl_idx', expireAfterSeconds: 2592000 } },
];

/**
 * All index definitions mapped by collection name
 */
export const allIndexes = {
  users: userIndexes,
  companies: companyIndexes,
  departments: departmentIndexes,
  projects: projectIndexes,
  tasks: taskIndexes,
  teams: teamIndexes,
  workflows: workflowIndexes,
  auditlogs: auditLogIndexes,
  subscriptions: subscriptionIndexes,
  invoices: invoiceIndexes,
  uploads: uploadIndexes,
  invites: inviteIndexes,
  sessions: sessionIndexes,
  webhooks: webhookIndexes,
  activities: activityIndexes,
};

export default allIndexes;

