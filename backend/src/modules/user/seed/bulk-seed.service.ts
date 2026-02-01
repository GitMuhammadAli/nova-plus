import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../entities/user.entity';
import {
  Company,
  CompanyDocument,
} from '../../company/entities/company.entity';
import {
  Department,
  DepartmentDocument,
} from '../../department/entities/department.entity';
import { Team, TeamDocument } from '../../team/entities/team.entity';
import {
  Project,
  ProjectDocument,
  ProjectStatus,
} from '../../project/entities/project.entity';
import {
  Task,
  TaskDocument,
  TaskStatus,
  TaskPriority,
} from '../../task/entities/task.entity';
import {
  Workflow,
  WorkflowDocument,
  WorkflowStatus,
  TriggerType,
  ActionType,
} from '../../workflow/entities/workflow.entity';

/**
 * Bulk Seed Service for Comprehensive Testing
 *
 * Creates:
 * - 1 Super Admin
 * - 3 Companies with full organizational structure
 * - Departments, Teams, Projects, Tasks, and Workflows
 *
 * Usage: npm run seed:bulk
 */
@Injectable()
export class BulkSeedService {
  private readonly logger = new Logger(BulkSeedService.name);

  // Test data configuration
  private readonly companies = [
    { name: 'AcmeCorp', domain: 'acme.com', prefix: 'acme' },
    { name: 'TechVerse', domain: 'techverse.io', prefix: 'tech' },
    { name: 'GlobalSoft', domain: 'globalsoft.com', prefix: 'global' },
  ];

  private readonly departments = [
    'Engineering',
    'Sales',
    'Marketing',
    'Human Resources',
  ];

  private readonly teams = [
    { name: 'Development Team', type: 'dev' },
    { name: 'QA Team', type: 'qa' },
    { name: 'Support Team', type: 'support' },
  ];

  private readonly projects = [
    {
      name: 'Website Redesign',
      status: ProjectStatus.ACTIVE,
      description: 'Complete overhaul of company website with modern UI/UX',
    },
    {
      name: 'Mobile App v2.0',
      status: ProjectStatus.ACTIVE,
      description: 'Next generation mobile application with new features',
    },
    {
      name: 'CRM Integration',
      status: ProjectStatus.ON_HOLD,
      description: 'Integration with third-party CRM systems',
    },
    {
      name: 'Data Migration',
      status: ProjectStatus.COMPLETED,
      description: 'Legacy data migration to new platform',
    },
    {
      name: 'API Gateway',
      status: ProjectStatus.ACTIVE,
      description: 'Centralized API gateway implementation',
    },
  ];

  private readonly taskTemplates = [
    { title: 'Setup development environment', priority: TaskPriority.HIGH },
    { title: 'Write technical documentation', priority: TaskPriority.MEDIUM },
    { title: 'Implement user authentication', priority: TaskPriority.HIGH },
    { title: 'Design database schema', priority: TaskPriority.HIGH },
    { title: 'Create API endpoints', priority: TaskPriority.MEDIUM },
    { title: 'Write unit tests', priority: TaskPriority.MEDIUM },
    { title: 'Code review', priority: TaskPriority.LOW },
    { title: 'Performance optimization', priority: TaskPriority.MEDIUM },
    { title: 'Bug fixes', priority: TaskPriority.HIGH },
    { title: 'UI/UX improvements', priority: TaskPriority.LOW },
    { title: 'Security audit', priority: TaskPriority.HIGH },
    { title: 'Deploy to staging', priority: TaskPriority.MEDIUM },
  ];

  private readonly userNames = [
    'Alice Johnson',
    'Bob Smith',
    'Carol Williams',
    'David Brown',
    'Emma Davis',
    'Frank Miller',
    'Grace Wilson',
    'Henry Taylor',
    'Ivy Anderson',
    'Jack Thomas',
    'Karen Martinez',
    'Leo Garcia',
  ];

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(Department.name)
    private departmentModel: Model<DepartmentDocument>,
    @InjectModel(Team.name) private teamModel: Model<TeamDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(Workflow.name) private workflowModel: Model<WorkflowDocument>,
  ) {}

  /**
   * Seeds comprehensive bulk test data
   */
  async seedBulkData(): Promise<void> {
    try {
      this.logger.log('🚀 Starting bulk seed data...');
      const startTime = Date.now();

      // Clear existing seed data
      await this.clearBulkData();

      // Create Super Admin
      const superAdmin = await this.createSuperAdmin();

      // Track created entities for summary
      let totalUsers = 1; // super admin
      let totalDepartments = 0;
      let totalTeams = 0;
      let totalProjects = 0;
      let totalTasks = 0;
      let totalWorkflows = 0;

      // Create companies with full structure
      for (const companyConfig of this.companies) {
        const result = await this.createCompanyWithStructure(
          companyConfig,
          superAdmin,
        );
        totalUsers += result.users;
        totalDepartments += result.departments;
        totalTeams += result.teams;
        totalProjects += result.projects;
        totalTasks += result.tasks;
        totalWorkflows += result.workflows;
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      this.logger.log('');
      this.logger.log(
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      );
      this.logger.log('✅ BULK SEED DATA COMPLETED SUCCESSFULLY!');
      this.logger.log(
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      );
      this.logger.log(`📊 Summary:`);
      this.logger.log(`   • Companies: ${this.companies.length}`);
      this.logger.log(`   • Users: ${totalUsers}`);
      this.logger.log(`   • Departments: ${totalDepartments}`);
      this.logger.log(`   • Teams: ${totalTeams}`);
      this.logger.log(`   • Projects: ${totalProjects}`);
      this.logger.log(`   • Tasks: ${totalTasks}`);
      this.logger.log(`   • Workflows: ${totalWorkflows}`);
      this.logger.log(
        `   • Total Documents: ${totalUsers + this.companies.length + totalDepartments + totalTeams + totalProjects + totalTasks + totalWorkflows}`,
      );
      this.logger.log(`   • Duration: ${duration}s`);
      this.logger.log(
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      );
      this.logger.log('');
      this.logger.log('🔑 TEST CREDENTIALS:');
      this.logger.log(
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      );
      this.logger.log('SUPER ADMIN:');
      this.logger.log('   Email: super.admin@novapulse.test');
      this.logger.log('   Password: SuperAdmin123!');
      this.logger.log('');
      for (const company of this.companies) {
        this.logger.log(`${company.name.toUpperCase()}:`);
        this.logger.log(
          `   Admin: ${company.prefix}.admin@${company.domain} / ${this.capitalize(company.prefix)}Admin123!`,
        );
        this.logger.log(
          `   Manager: ${company.prefix}.manager1@${company.domain} / ${this.capitalize(company.prefix)}123`,
        );
        this.logger.log(
          `   User: ${company.prefix}.user1@${company.domain} / ${this.capitalize(company.prefix)}123`,
        );
        this.logger.log('');
      }
      this.logger.log(
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      );
    } catch (error) {
      this.logger.error('❌ Failed to seed bulk data:', error.message);
      throw error;
    }
  }

  /**
   * Clears all seed data
   */
  private async clearBulkData(): Promise<void> {
    this.logger.log('🧹 Clearing existing seed data...');

    const companyNames = this.companies.map((c) => c.name);
    const emailPatterns = [
      'super.admin@novapulse.test',
      ...this.companies.flatMap((c) => [
        new RegExp(`^${c.prefix}\\..+@${c.domain.replace('.', '\\.')}$`),
      ]),
    ];

    // Delete in reverse order of dependencies
    await this.taskModel.deleteMany({}).exec();
    await this.workflowModel.deleteMany({}).exec();
    await this.projectModel.deleteMany({}).exec();
    await this.teamModel.deleteMany({}).exec();
    await this.departmentModel.deleteMany({}).exec();

    // Delete companies and users
    const companies = await this.companyModel
      .find({ name: { $in: companyNames } })
      .exec();
    const companyIds = companies.map((c) => c._id);

    if (companyIds.length > 0) {
      await this.userModel
        .deleteMany({ companyId: { $in: companyIds } })
        .exec();
    }
    await this.companyModel.deleteMany({ name: { $in: companyNames } }).exec();
    await this.userModel
      .deleteOne({ email: 'super.admin@novapulse.test' })
      .exec();

    this.logger.log('✅ Seed data cleared');
  }

  /**
   * Creates the super admin user
   */
  private async createSuperAdmin(): Promise<User> {
    const email = 'super.admin@novapulse.test';
    const hashedPassword = await bcrypt.hash('SuperAdmin123!', 10);

    const superAdmin = new this.userModel({
      email,
      password: hashedPassword,
      name: 'Super Administrator',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      department: 'Administration',
      location: 'Headquarters',
    });

    await superAdmin.save();
    this.logger.log(`✅ Created Super Admin: ${email}`);
    return superAdmin;
  }

  /**
   * Creates a complete company structure with all entities
   */
  private async createCompanyWithStructure(
    config: { name: string; domain: string; prefix: string },
    superAdmin: User,
  ): Promise<{
    users: number;
    departments: number;
    teams: number;
    projects: number;
    tasks: number;
    workflows: number;
  }> {
    this.logger.log(`\n📦 Creating ${config.name}...`);

    // Create company
    const company = new this.companyModel({
      name: config.name,
      domain: config.domain,
      description: `${config.name} - A leading technology company`,
      createdBy: superAdmin._id,
      managers: [],
      users: [],
      isActive: true,
    });
    await company.save();

    // Create users
    const users = await this.createCompanyUsers(config, company);
    const admin = users.find((u) => u.role === UserRole.COMPANY_ADMIN)!;
    const managers = users.filter((u) => u.role === UserRole.MANAGER);
    const regularUsers = users.filter((u) => u.role === UserRole.USER);

    // Update company with user references
    company.managers = [admin._id as any, ...managers.map((m) => m._id as any)];
    company.users = users.map((u) => u._id as any);
    await company.save();

    // Create departments
    const departments = await this.createDepartments(
      config,
      company,
      admin,
      managers,
    );

    // Create teams
    const teams = await this.createTeams(company, managers, regularUsers);

    // Create projects
    const projects = await this.createProjects(company, admin, regularUsers);

    // Create tasks
    let totalTasks = 0;
    for (const project of projects) {
      const tasksCreated = await this.createProjectTasks(
        company,
        project,
        managers,
        regularUsers,
      );
      totalTasks += tasksCreated;
    }

    // Create workflows
    const workflows = await this.createWorkflows(company, admin);

    this.logger.log(`✅ ${config.name} created successfully`);

    return {
      users: users.length,
      departments: departments.length,
      teams: teams.length,
      projects: projects.length,
      tasks: totalTasks,
      workflows: workflows.length,
    };
  }

  /**
   * Creates users for a company
   */
  private async createCompanyUsers(
    config: { name: string; domain: string; prefix: string },
    company: CompanyDocument,
  ): Promise<User[]> {
    const users: User[] = [];
    const password = `${this.capitalize(config.prefix)}123`;
    const adminPassword = `${this.capitalize(config.prefix)}Admin123!`;
    let nameIndex = 0;

    // Company Admin
    const admin = await this.createUser({
      email: `${config.prefix}.admin@${config.domain}`,
      name: `${config.name} Admin`,
      password: adminPassword,
      role: UserRole.COMPANY_ADMIN,
      companyId: company._id,
      department: 'Executive',
      location: 'Headquarters',
    });
    users.push(admin);

    // 2 Managers
    for (let i = 1; i <= 2; i++) {
      const manager = await this.createUser({
        email: `${config.prefix}.manager${i}@${config.domain}`,
        name: this.userNames[nameIndex++ % this.userNames.length],
        password,
        role: UserRole.MANAGER,
        companyId: company._id,
        createdBy: admin._id,
        department: i === 1 ? 'Engineering' : 'Sales',
        location: i === 1 ? 'Tech Hub' : 'Sales Office',
      });
      users.push(manager);
    }

    // 6 Regular Users
    const managers = users.filter((u) => u.role === UserRole.MANAGER);
    for (let i = 1; i <= 6; i++) {
      const managerId = managers[(i - 1) % managers.length]._id;
      const user = await this.createUser({
        email: `${config.prefix}.user${i}@${config.domain}`,
        name: this.userNames[nameIndex++ % this.userNames.length],
        password,
        role: UserRole.USER,
        companyId: company._id,
        createdBy: admin._id,
        managerId,
        department: this.departments[(i - 1) % this.departments.length],
        location: ['Remote', 'Office A', 'Office B'][i % 3],
      });
      users.push(user);
    }

    return users;
  }

  /**
   * Creates a single user
   */
  private async createUser(data: {
    email: string;
    name: string;
    password: string;
    role: UserRole;
    companyId: any;
    createdBy?: any;
    managerId?: any;
    department?: string;
    location?: string;
  }): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = new this.userModel({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: data.role,
      companyId: data.companyId,
      orgId: data.companyId, // Backward compatibility
      createdBy: data.createdBy,
      managerId: data.managerId,
      isActive: true,
      department: data.department,
      location: data.location,
      abacAttributes: {
        department: data.department,
        location: data.location,
        level:
          data.role === UserRole.COMPANY_ADMIN
            ? 'executive'
            : data.role === UserRole.MANAGER
              ? 'senior'
              : 'standard',
      },
    });

    await user.save();
    return user;
  }

  /**
   * Creates departments for a company
   */
  private async createDepartments(
    config: { name: string; domain: string; prefix: string },
    company: CompanyDocument,
    admin: User,
    managers: User[],
  ): Promise<DepartmentDocument[]> {
    const departments: DepartmentDocument[] = [];

    for (let i = 0; i < this.departments.length; i++) {
      const deptName = this.departments[i];
      const manager = managers[i % managers.length];

      const department = new this.departmentModel({
        name: deptName,
        description: `${deptName} department at ${config.name}`,
        companyId: company._id,
        managerId: manager._id,
        members: [],
        isActive: true,
        createdBy: admin._id,
      });

      await department.save();
      departments.push(department);
    }

    this.logger.log(`   📁 Created ${departments.length} departments`);
    return departments;
  }

  /**
   * Creates teams for a company
   */
  private async createTeams(
    company: CompanyDocument,
    managers: User[],
    users: User[],
  ): Promise<TeamDocument[]> {
    const teams: TeamDocument[] = [];

    for (let i = 0; i < this.teams.length; i++) {
      const teamConfig = this.teams[i];
      const manager = managers[i % managers.length];

      // Assign 2-3 users per team
      const teamMembers = users
        .slice(i * 2, i * 2 + 2)
        .map((u) => u._id as any);

      const team = new this.teamModel({
        name: teamConfig.name,
        manager: manager._id,
        members: [manager._id as any, ...teamMembers],
      });

      await team.save();
      teams.push(team);
    }

    this.logger.log(`   👥 Created ${teams.length} teams`);
    return teams;
  }

  /**
   * Creates projects for a company
   */
  private async createProjects(
    company: CompanyDocument,
    admin: User,
    users: User[],
  ): Promise<ProjectDocument[]> {
    const projects: ProjectDocument[] = [];
    const now = new Date();

    for (let i = 0; i < this.projects.length; i++) {
      const projectConfig = this.projects[i];
      const assignedUsers = users
        .slice(0, Math.min(4, users.length))
        .map((u) => u._id as any);

      // Set dates based on status
      const startDate = new Date(now);
      const endDate = new Date(now);

      if (projectConfig.status === ProjectStatus.COMPLETED) {
        startDate.setMonth(startDate.getMonth() - 3);
        endDate.setMonth(endDate.getMonth() - 1);
      } else if (projectConfig.status === ProjectStatus.ON_HOLD) {
        startDate.setMonth(startDate.getMonth() - 2);
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        startDate.setMonth(startDate.getMonth() - 1);
        endDate.setMonth(endDate.getMonth() + 2);
      }

      const project = new this.projectModel({
        name: projectConfig.name,
        description: projectConfig.description,
        companyId: company._id,
        createdBy: admin._id,
        assignedUsers,
        status: projectConfig.status,
        startDate,
        endDate,
        isActive: true,
      });

      await project.save();
      projects.push(project);
    }

    this.logger.log(`   📋 Created ${projects.length} projects`);
    return projects;
  }

  /**
   * Creates tasks for a project
   */
  private async createProjectTasks(
    company: CompanyDocument,
    project: ProjectDocument,
    managers: User[],
    users: User[],
  ): Promise<number> {
    const tasksToCreate = 8 + Math.floor(Math.random() * 5); // 8-12 tasks per project
    const statuses = [
      TaskStatus.TODO,
      TaskStatus.PENDING,
      TaskStatus.IN_PROGRESS,
      TaskStatus.REVIEW,
      TaskStatus.DONE,
    ];
    const statusWeights = [0.1, 0.2, 0.3, 0.1, 0.3]; // Distribution weights

    const now = new Date();

    for (let i = 0; i < tasksToCreate; i++) {
      const template = this.taskTemplates[i % this.taskTemplates.length];
      const assignedBy = managers[i % managers.length];
      const assignedTo = users[i % users.length];

      // Weighted random status selection
      const status = this.weightedRandom(statuses, statusWeights);

      // Set due date based on status
      const dueDate = new Date(now);
      if (status === TaskStatus.DONE) {
        dueDate.setDate(dueDate.getDate() - Math.floor(Math.random() * 14)); // Past dates
      } else if (
        status === TaskStatus.IN_PROGRESS ||
        status === TaskStatus.REVIEW
      ) {
        dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 7)); // Soon
      } else {
        dueDate.setDate(dueDate.getDate() + 7 + Math.floor(Math.random() * 21)); // Future
      }

      const task = new this.taskModel({
        title: `${template.title} - ${project.name}`,
        description: `Task for ${project.name}: ${template.title}. This task needs to be completed as part of the project deliverables.`,
        projectId: project._id,
        companyId: company._id,
        assignedBy: assignedBy._id,
        assignedTo: assignedTo._id,
        status,
        priority: template.priority,
        dueDate,
        isActive: true,
        comments:
          status !== TaskStatus.TODO
            ? [
                {
                  userId: new Types.ObjectId(assignedBy._id),
                  comment: 'Please prioritize this task.',
                  createdAt: new Date(Date.now() - 86400000), // 1 day ago
                },
              ]
            : [],
        watchers: [new Types.ObjectId(assignedBy._id)],
      });

      await task.save();
    }

    return tasksToCreate;
  }

  /**
   * Creates workflows for a company
   */
  private async createWorkflows(
    company: CompanyDocument,
    admin: User,
  ): Promise<WorkflowDocument[]> {
    const workflows: WorkflowDocument[] = [];

    const workflowConfigs = [
      {
        name: 'New User Onboarding',
        description: 'Automated workflow for onboarding new team members',
        triggerType: TriggerType.USER_CREATED,
        actionType: ActionType.SEND_EMAIL,
      },
      {
        name: 'Task Completion Notification',
        description: 'Notify managers when tasks are completed',
        triggerType: TriggerType.WEBHOOK,
        actionType: ActionType.SEND_NOTIFICATION,
      },
      {
        name: 'Daily Report Generation',
        description: 'Generate and send daily reports',
        triggerType: TriggerType.SCHEDULE,
        actionType: ActionType.SEND_EMAIL,
      },
    ];

    for (const config of workflowConfigs) {
      const workflow = new this.workflowModel({
        name: config.name,
        description: config.description,
        companyId: company._id,
        createdBy: admin._id,
        status: WorkflowStatus.ACTIVE,
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            triggerType: config.triggerType,
            config: { enabled: true },
            position: { x: 100, y: 100 },
          },
          {
            id: 'action-1',
            type: 'action',
            actionType: config.actionType,
            config: {
              template: 'default',
              recipients: ['admin'],
            },
            position: { x: 300, y: 100 },
          },
        ],
        connections: [
          {
            id: 'conn-1',
            source: 'trigger-1',
            target: 'action-1',
          },
        ],
        runCount: Math.floor(Math.random() * 50),
        tags: ['automated', config.triggerType.toLowerCase()],
        isActive: true,
      });

      await workflow.save();
      workflows.push(workflow);
    }

    this.logger.log(`   ⚙️  Created ${workflows.length} workflows`);
    return workflows;
  }

  /**
   * Helper: Weighted random selection
   */
  private weightedRandom<T>(items: T[], weights: number[]): T {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }

    return items[items.length - 1];
  }

  /**
   * Helper: Capitalize first letter
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
