import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserRole } from '../src/modules/user/entities/user.entity';
import { Company } from '../src/modules/company/entities/company.entity';
import { Department } from '../src/modules/department/entities/department.entity';
import { Project } from '../src/modules/project/entities/project.entity';
import { Task, TaskStatus } from '../src/modules/task/entities/task.entity';

/**
 * Comprehensive Phase 3 Integration Tests
 * Tests all roles: Company Admin, Manager, User
 */
describe('Phase 3 - Complete Role Integration (e2e)', () => {
  let app: INestApplication;
  let companyId: string;
  let adminToken: string;
  let managerToken: string;
  let userToken: string;
  let adminId: string;
  let managerId: string;
  let userId: string;
  let departmentId: string;
  let projectId: string;
  let taskId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    // Clean up any existing test data first
    const companyModel = app.get<Model<Company>>(getModelToken(Company.name));
    const userModel = app.get<Model<User>>(getModelToken(User.name));
    const departmentModel = app.get<Model<Department>>(
      getModelToken(Department.name),
    );
    const projectModel = app.get<Model<Project>>(getModelToken(Project.name));
    const taskModel = app.get<Model<Task>>(getModelToken(Task.name));

    await userModel
      .deleteMany({
        email: {
          $in: [
            'admin@test.com',
            'manager@test.com',
            'user@test.com',
            'outside@test.com',
            'other@test.com',
          ],
        },
      })
      .exec();
    await departmentModel
      .deleteMany({ name: { $in: ['Engineering', 'Sales'] } })
      .exec();
    await projectModel
      .deleteMany({ name: { $in: ['Integration Project', 'Cross-Role Task'] } })
      .exec();
    await taskModel
      .deleteMany({
        title: {
          $in: [
            'Manager Created Task',
            'Cross-Role Task',
            'Invalid Task',
            'Other Dept Task',
            'Other User Task',
          ],
        },
      })
      .exec();
    await companyModel.deleteMany({ name: 'Integration Test Company' }).exec();

    // Create test company
    const company = await companyModel.create({
      name: 'Integration Test Company',
      domain: 'integration-test.com',
      isActive: true,
    });
    companyId = company._id.toString();

    // Create Company Admin
    const admin = await userModel.create({
      email: 'admin@test.com',
      password: 'hashedpassword',
      name: 'Company Admin',
      role: UserRole.COMPANY_ADMIN,
      companyId: company._id,
      isActive: true,
    });
    adminId = admin._id.toString();

    // Create Manager
    const manager = await userModel.create({
      email: 'manager@test.com',
      password: 'hashedpassword',
      name: 'Test Manager',
      role: UserRole.MANAGER,
      companyId: company._id,
      isActive: true,
    });
    managerId = manager._id.toString();

    // Create Department and assign manager
    const department = await departmentModel.create({
      name: 'Engineering',
      companyId: company._id,
      managerId: manager._id,
      isActive: true,
    });
    departmentId = department._id.toString();

    // Create User in department
    const user = await userModel.create({
      email: 'user@test.com',
      password: 'hashedpassword',
      name: 'Test User',
      role: UserRole.USER,
      companyId: company._id,
      managerId: manager._id,
      isActive: true,
    });
    userId = user._id.toString();

    // Add user to department
    department.members.push(user._id);
    await department.save();

    // Create project
    const project = await projectModel.create({
      name: 'Integration Project',
      companyId: company._id,
      createdBy: manager._id,
      assignedUsers: [user._id],
      status: 'active',
      isActive: true,
    });
    projectId = project._id.toString();

    // For testing, we'll use placeholder tokens
    // In real tests, you would login properly or generate JWT tokens
    adminToken = 'test-admin-token-placeholder';
    managerToken = 'test-manager-token-placeholder';
    userToken = 'test-user-token-placeholder';

    // Note: In production tests, you would:
    // 1. Hash passwords properly with bcrypt
    // 2. Login via /api/v1/auth/login for each user
    // 3. Extract tokens from responses
  });

  afterAll(async () => {
    // Cleanup test data
    const userModel = app.get<Model<User>>(getModelToken(User.name));
    const companyModel = app.get<Model<Company>>(getModelToken(Company.name));
    const departmentModel = app.get<Model<Department>>(
      getModelToken(Department.name),
    );
    const projectModel = app.get<Model<Project>>(getModelToken(Project.name));
    const taskModel = app.get<Model<Task>>(getModelToken(Task.name));

    await userModel
      .deleteMany({
        email: {
          $in: [
            'admin@test.com',
            'manager@test.com',
            'user@test.com',
            'outside@test.com',
            'other@test.com',
          ],
        },
      })
      .exec();
    await departmentModel
      .deleteMany({ name: { $in: ['Engineering', 'Sales'] } })
      .exec();
    await projectModel
      .deleteMany({ name: { $in: ['Integration Project', 'Cross-Role Task'] } })
      .exec();
    await taskModel
      .deleteMany({
        title: {
          $in: [
            'Manager Created Task',
            'Cross-Role Task',
            'Invalid Task',
            'Other Dept Task',
            'Other User Task',
          ],
        },
      })
      .exec();
    await companyModel.deleteMany({ name: 'Integration Test Company' }).exec();

    await app.close();
  });

  describe('Company Admin Role', () => {
    it('Company Admin can access all company data', async () => {
      // Admin can see all users
      const usersResponse = await request(app.getHttpServer())
        .get('/api/v1/user/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(
        usersResponse.body.success || Array.isArray(usersResponse.body.data),
      ).toBe(true);

      // Admin can see company stats
      const statsResponse = await request(app.getHttpServer())
        .get(`/api/v1/company/${companyId}/stats`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(statsResponse.body.success).toBe(true);
    });

    it('Company Admin can manage departments', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Sales',
          description: 'Sales Department',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Manager Role', () => {
    it('Manager can view department projects', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/manager/projects')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('Manager can create tasks for department users', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/manager/tasks')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: 'Manager Created Task',
          description: 'Task created by manager',
          projectId: projectId,
          assignedTo: userId,
          priority: 'high',
          status: 'todo',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      taskId = response.body.data._id;
    });

    it('Manager cannot assign tasks to users outside department', async () => {
      // Create user outside department
      const userModel = app.get<Model<User>>(getModelToken(User.name));
      const outsideUser = await userModel.create({
        email: 'outside@test.com',
        password: 'hashedpassword',
        name: 'Outside User',
        role: UserRole.USER,
        companyId: companyId,
        isActive: true,
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/manager/tasks')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: 'Invalid Task',
          assignedTo: outsideUser._id.toString(),
          priority: 'high',
        })
        .expect(403); // Should be forbidden

      expect(response.body.message).toContain('outside your department');
    });

    it('Manager can view team members', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/manager/team')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('Manager can view team stats', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/manager/stats/team')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('teamProductivity');
    });
  });

  describe('User Role', () => {
    it('User can view assigned tasks', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/user/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('User can update task status (valid transitions)', async () => {
      // todo -> in_progress
      await request(app.getHttpServer())
        .patch(`/api/v1/user/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'in_progress' })
        .expect(200);

      // in_progress -> review
      await request(app.getHttpServer())
        .patch(`/api/v1/user/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'review' })
        .expect(200);

      // review -> done
      await request(app.getHttpServer())
        .patch(`/api/v1/user/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'done' })
        .expect(200);
    });

    it('User cannot skip status transitions', async () => {
      // Create new task in todo
      const taskModel = app.get<Model<Task>>(getModelToken(Task.name));
      const newTask = await taskModel.create({
        title: 'New Task',
        companyId: companyId,
        assignedBy: managerId,
        assignedTo: userId,
        status: TaskStatus.TODO,
        isActive: true,
      });

      // Try to go directly from todo to done (should fail)
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/user/tasks/${newTask._id}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'done' })
        .expect(400);

      expect(response.body.message).toContain('Invalid status transition');
    });

    it('User can add comments to tasks', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/user/tasks/${taskId}/comment`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ comment: 'User comment on task' })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('User can view assigned projects', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/user/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('User can view productivity stats', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/user/stats/productivity')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tasksByStatus');
      expect(response.body.data).toHaveProperty('completionRate');
    });
  });

  describe('Cross-Role Interactions', () => {
    it('Manager creates task -> User can see and update it', async () => {
      // Manager creates task
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/manager/tasks')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: 'Cross-Role Task',
          assignedTo: userId,
          priority: 'medium',
        })
        .expect(201);

      const newTaskId = createResponse.body.data._id;

      // User can see the task
      const userTasksResponse = await request(app.getHttpServer())
        .get('/api/v1/user/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const userTask = userTasksResponse.body.data.find(
        (t: any) => t._id === newTaskId,
      );
      expect(userTask).toBeDefined();

      // User can update status
      await request(app.getHttpServer())
        .patch(`/api/v1/user/tasks/${newTaskId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'in_progress' })
        .expect(200);
    });

    it('User updates task -> Manager can see updated status', async () => {
      // User updates task to in_progress
      await request(app.getHttpServer())
        .patch(`/api/v1/user/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'in_progress' })
        .expect(200);

      // Manager can see updated status
      const response = await request(app.getHttpServer())
        .get(`/api/v1/manager/tasks/${taskId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.data.status).toBe('in_progress');
    });
  });

  describe('Security & Access Control', () => {
    it('User cannot access manager endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/manager/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403); // Forbidden
    });

    it('User cannot access other users tasks', async () => {
      // Create another user
      const userModel = app.get<Model<User>>(getModelToken(User.name));
      const otherUser = await userModel.create({
        email: 'other@test.com',
        password: 'hashedpassword',
        name: 'Other User',
        role: UserRole.USER,
        companyId: companyId,
        isActive: true,
      });

      // Create task for other user
      const taskModel = app.get<Model<Task>>(getModelToken(Task.name));
      const otherTask = await taskModel.create({
        title: 'Other User Task',
        companyId: companyId,
        assignedBy: managerId,
        assignedTo: otherUser._id,
        isActive: true,
      });

      // First user cannot access other user's task
      await request(app.getHttpServer())
        .get(`/api/v1/user/tasks/${otherTask._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404); // Not found (access denied)
    });

    it('Manager cannot access tasks outside their department', async () => {
      // Create another department
      const departmentModel = app.get<Model<Department>>(
        getModelToken(Department.name),
      );
      const otherDept = await departmentModel.create({
        name: 'Sales',
        companyId: companyId,
        isActive: true,
      });

      // Create task in other department
      const taskModel = app.get<Model<Task>>(getModelToken(Task.name));
      const otherTask = await taskModel.create({
        title: 'Other Dept Task',
        companyId: companyId,
        departmentId: otherDept._id,
        isActive: true,
      });

      // Manager cannot access
      await request(app.getHttpServer())
        .get(`/api/v1/manager/tasks/${otherTask._id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403); // Forbidden
    });
  });
});
