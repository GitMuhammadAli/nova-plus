import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/entities/user.entity';
import { Task, TaskDocument } from '../task/entities/task.entity';
import { Project, ProjectDocument } from '../project/entities/project.entity';
import {
  AuditLog,
  AuditLogDocument,
} from '../audit/entities/audit-log.entity';
import {
  AnalyticsVisit,
  AnalyticsVisitDocument,
} from '../analytics/entities/analytics-visit.entity';

@Injectable()
export class ExportService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
    @InjectModel(AnalyticsVisit.name)
    private analyticsVisitModel: Model<AnalyticsVisitDocument>,
  ) {}

  /**
   * Convert an array of objects to a CSV string.
   * Handles nested fields, dates, arrays, and proper escaping.
   */
  exportToCsv(data: any[], columns: { key: string; header: string }[]): string {
    const headerRow = columns.map((col) => this.escapeCsvField(col.header)).join(',');

    const dataRows = data.map((row) => {
      return columns
        .map((col) => {
          const value = this.resolveNestedField(row, col.key);
          return this.escapeCsvField(this.formatCsvValue(value));
        })
        .join(',');
    });

    return [headerRow, ...dataRows].join('\n');
  }

  /**
   * Export users for a company to CSV buffer.
   */
  async exportUsersToCSV(
    companyId: string,
    filters?: { role?: string; status?: string; department?: string },
  ): Promise<Buffer> {
    const query: any = { companyId };

    if (filters?.role) {
      query.role = filters.role;
    }
    if (filters?.status === 'active') {
      query.isActive = true;
    } else if (filters?.status === 'inactive') {
      query.isActive = false;
    }
    if (filters?.department) {
      query.department = filters.department;
    }

    const users = await this.userModel
      .find(query)
      .select('name email role department isActive createdAt')
      .lean()
      .exec();

    const columns = [
      { key: 'name', header: 'Name' },
      { key: 'email', header: 'Email' },
      { key: 'role', header: 'Role' },
      { key: 'department', header: 'Department' },
      { key: 'isActive', header: 'Status' },
      { key: 'createdAt', header: 'Joined At' },
    ];

    const mappedUsers = users.map((user) => ({
      ...user,
      isActive: user.isActive ? 'Active' : 'Inactive',
    }));

    const csv = this.exportToCsv(mappedUsers, columns);
    return Buffer.from(csv, 'utf-8');
  }

  /**
   * Export tasks for a company to CSV buffer.
   */
  async exportTasksToCSV(
    companyId: string,
    filters?: { status?: string; project?: string; priority?: string; assignedTo?: string },
  ): Promise<Buffer> {
    const query: any = { companyId };

    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.project) {
      query.projectId = filters.project;
    }
    if (filters?.priority) {
      query.priority = filters.priority;
    }
    if (filters?.assignedTo) {
      query.assignedTo = filters.assignedTo;
    }

    const tasks = await this.taskModel
      .find(query)
      .populate('assignedTo', 'name email')
      .populate('projectId', 'name')
      .select('title assignedTo status priority dueDate projectId createdAt')
      .lean()
      .exec();

    const columns = [
      { key: 'title', header: 'Title' },
      { key: 'assignedTo.name', header: 'Assigned To' },
      { key: 'status', header: 'Status' },
      { key: 'priority', header: 'Priority' },
      { key: 'dueDate', header: 'Due Date' },
      { key: 'projectId.name', header: 'Project' },
      { key: 'createdAt', header: 'Created At' },
    ];

    const csv = this.exportToCsv(tasks, columns);
    return Buffer.from(csv, 'utf-8');
  }

  /**
   * Export projects for a company to CSV buffer.
   */
  async exportProjectsToCSV(companyId: string): Promise<Buffer> {
    const projects = await this.projectModel
      .find({ companyId })
      .select('name status startDate endDate assignedUsers createdAt')
      .lean()
      .exec();

    const columns = [
      { key: 'name', header: 'Name' },
      { key: 'status', header: 'Status' },
      { key: 'startDate', header: 'Start Date' },
      { key: 'endDate', header: 'End Date' },
      { key: 'memberCount', header: 'Member Count' },
      { key: 'createdAt', header: 'Created At' },
    ];

    const mappedProjects = projects.map((project) => ({
      ...project,
      memberCount: project.assignedUsers ? project.assignedUsers.length : 0,
    }));

    const csv = this.exportToCsv(mappedProjects, columns);
    return Buffer.from(csv, 'utf-8');
  }

  /**
   * Export audit logs for a company to CSV buffer.
   */
  async exportAuditLogsToCSV(
    companyId: string,
    filters?: { from?: string; to?: string; action?: string; resource?: string },
  ): Promise<Buffer> {
    const query: any = { companyId };

    if (filters?.from || filters?.to) {
      query.createdAt = {};
      if (filters.from) {
        query.createdAt.$gte = new Date(filters.from);
      }
      if (filters.to) {
        query.createdAt.$lte = new Date(filters.to);
      }
    }
    if (filters?.action) {
      query.action = filters.action;
    }
    if (filters?.resource) {
      query.resource = filters.resource;
    }

    const logs = await this.auditLogModel
      .find(query)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const columns = [
      { key: 'action', header: 'Action' },
      { key: 'userName', header: 'User' },
      { key: 'resource', header: 'Resource Type' },
      { key: 'createdAt', header: 'Timestamp' },
      { key: 'description', header: 'Details' },
      { key: 'ipAddress', header: 'IP Address' },
    ];

    const csv = this.exportToCsv(logs, columns);
    return Buffer.from(csv, 'utf-8');
  }

  /**
   * Export analytics visit data for a company to CSV buffer.
   */
  async exportAnalyticsToCSV(
    companyId: string,
    dateRange?: { from?: string; to?: string },
  ): Promise<Buffer> {
    const query: any = { companyId };

    if (dateRange?.from || dateRange?.to) {
      query.visitedAt = {};
      if (dateRange.from) {
        query.visitedAt.$gte = new Date(dateRange.from);
      }
      if (dateRange.to) {
        query.visitedAt.$lte = new Date(dateRange.to);
      }
    }

    const visits = await this.analyticsVisitModel
      .find(query)
      .populate('userId', 'name email')
      .sort({ visitedAt: -1 })
      .lean()
      .exec();

    const columns = [
      { key: 'page', header: 'Page' },
      { key: 'userId.name', header: 'User' },
      { key: 'device', header: 'Device' },
      { key: 'browser', header: 'Browser' },
      { key: 'os', header: 'OS' },
      { key: 'duration', header: 'Duration (s)' },
      { key: 'visitedAt', header: 'Visited At' },
      { key: 'ipAddress', header: 'IP Address' },
    ];

    const csv = this.exportToCsv(visits, columns);
    return Buffer.from(csv, 'utf-8');
  }

  // ── Private helpers ────────────────────────────────────────────────

  /**
   * Resolve a potentially nested field from an object (e.g. "assignedTo.name").
   */
  private resolveNestedField(obj: any, path: string): any {
    if (!obj || !path) return '';
    return path.split('.').reduce((current, key) => {
      if (current === null || current === undefined) return '';
      return current[key];
    }, obj);
  }

  /**
   * Format a value for CSV output.
   * Handles dates, arrays, objects, null/undefined.
   */
  private formatCsvValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'object' && value.toISOString) {
      return value.toISOString();
    }
    if (Array.isArray(value)) {
      return value.map((v) => this.formatCsvValue(v)).join('; ');
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  /**
   * Escape a CSV field: wrap in quotes if it contains commas, quotes, or newlines.
   * Double any internal quotes.
   */
  private escapeCsvField(field: string): string {
    if (!field) return '""';
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }
}
