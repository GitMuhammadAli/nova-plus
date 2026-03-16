import { Injectable } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationEventsService {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Notify a user that a task has been assigned to them
   */
  async onTaskAssigned(task: {
    _id: string;
    title: string;
    assignedTo: string;
    assignedBy: string;
    companyId: string;
  }) {
    // Don't notify if user assigned to themselves
    if (task.assignedTo === task.assignedBy) return;

    return this.notificationsService.create({
      userId: task.assignedTo,
      companyId: task.companyId,
      type: NotificationType.TASK_ASSIGNED,
      title: 'New Task Assigned',
      message: `You have been assigned a new task: "${task.title}"`,
      data: {
        taskId: task._id,
        taskTitle: task.title,
        assignedBy: task.assignedBy,
      },
    });
  }

  /**
   * Notify relevant users when a task is updated
   */
  async onTaskUpdated(task: {
    _id: string;
    title: string;
    assignedTo: string;
    updatedBy: string;
    companyId: string;
    changes?: string;
  }) {
    // Don't notify the person who made the update
    if (task.assignedTo === task.updatedBy) return;

    return this.notificationsService.create({
      userId: task.assignedTo,
      companyId: task.companyId,
      type: NotificationType.TASK_UPDATED,
      title: 'Task Updated',
      message: `Task "${task.title}" has been updated${task.changes ? `: ${task.changes}` : ''}`,
      data: {
        taskId: task._id,
        taskTitle: task.title,
        updatedBy: task.updatedBy,
        changes: task.changes,
      },
    });
  }

  /**
   * Notify company users when a new project is created
   */
  async onProjectCreated(project: {
    _id: string;
    name: string;
    createdBy: string;
    companyId: string;
    memberIds?: string[];
  }) {
    const recipients = (project.memberIds || []).filter(
      (id) => id !== project.createdBy,
    );

    const promises = recipients.map((userId) =>
      this.notificationsService.create({
        userId,
        companyId: project.companyId,
        type: NotificationType.PROJECT_CREATED,
        title: 'New Project Created',
        message: `A new project "${project.name}" has been created`,
        data: {
          projectId: project._id,
          projectName: project.name,
          createdBy: project.createdBy,
        },
      }),
    );

    return Promise.all(promises);
  }

  /**
   * Notify a user when they receive an invite
   */
  async onInviteCreated(invite: {
    _id: string;
    email: string;
    invitedUserId: string;
    invitedBy: string;
    companyId: string;
    companyName?: string;
  }) {
    return this.notificationsService.create({
      userId: invite.invitedUserId,
      companyId: invite.companyId,
      type: NotificationType.INVITE_RECEIVED,
      title: 'Invitation Received',
      message: `You have been invited to join ${invite.companyName || 'a company'}`,
      data: {
        inviteId: invite._id,
        invitedBy: invite.invitedBy,
        companyName: invite.companyName,
      },
    });
  }

  /**
   * Notify task assignee and watchers when a comment is added
   */
  async onCommentAdded(
    task: {
      _id: string;
      title: string;
      assignedTo: string;
      companyId: string;
      watchers?: string[];
    },
    comment: {
      userId: string;
      comment: string;
    },
  ) {
    // Collect unique recipients (assignee + watchers), excluding the commenter
    const recipientSet = new Set<string>();
    if (task.assignedTo !== comment.userId) {
      recipientSet.add(task.assignedTo);
    }
    (task.watchers || []).forEach((w) => {
      if (w !== comment.userId) {
        recipientSet.add(w);
      }
    });

    const promises = Array.from(recipientSet).map((userId) =>
      this.notificationsService.create({
        userId,
        companyId: task.companyId,
        type: NotificationType.COMMENT_ADDED,
        title: 'New Comment',
        message: `New comment on task "${task.title}"`,
        data: {
          taskId: task._id,
          taskTitle: task.title,
          commentBy: comment.userId,
          commentPreview:
            comment.comment.length > 100
              ? comment.comment.substring(0, 100) + '...'
              : comment.comment,
        },
      }),
    );

    return Promise.all(promises);
  }

  /**
   * Notify when a workflow execution completes
   */
  async onWorkflowCompleted(workflow: {
    _id: string;
    name: string;
    triggeredBy: string;
    companyId: string;
    status: string;
  }) {
    return this.notificationsService.create({
      userId: workflow.triggeredBy,
      companyId: workflow.companyId,
      type: NotificationType.WORKFLOW_COMPLETED,
      title: 'Workflow Completed',
      message: `Workflow "${workflow.name}" has completed with status: ${workflow.status}`,
      data: {
        workflowId: workflow._id,
        workflowName: workflow.name,
        status: workflow.status,
      },
    });
  }

  /**
   * Send a system alert to a specific user
   */
  async sendSystemAlert(params: {
    userId: string;
    companyId: string;
    title: string;
    message: string;
    data?: Record<string, any>;
  }) {
    return this.notificationsService.create({
      userId: params.userId,
      companyId: params.companyId,
      type: NotificationType.SYSTEM_ALERT,
      title: params.title,
      message: params.message,
      data: params.data || {},
    });
  }
}
