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
import { Task } from '../src/modules/task/entities/task.entity';

describe('Phase 3 - Manager Module (e2e)', () => {
  let app: INestApplication;
  let managerToken: string;
  let managerId: string;
  let companyId: string;
  let departmentId: string;
  let userId: string;
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

    await userModel
      .deleteMany({ email: { $in: ['manager@test.com', 'user@test.com'] } })
      .exec();
    await departmentModel.deleteMany({ name: 'Engineering' }).exec();
    await companyModel.deleteMany({ name: 'Test Company' }).exec();

    // Create test company
    const company = await companyModel.create({
      name: 'Test Company',
      domain: 'test.com',
      isActive: true,
    });
    companyId = company._id.toString();

    // Create manager user
    const manager = await userModel.create({
      email: 'manager@test.com',
      password: 'hashedpassword',
      name: 'Test Manager',
      role: UserRole.MANAGER,
      companyId: company._id,
      isActive: true,
    });
    managerId = manager._id.toString();

    // Create department and assign manager
    const department = await departmentModel.create({
      name: 'Engineering',
      companyId: company._id,
      managerId: manager._id,
      isActive: true,
    });
    departmentId = department._id.toString();

    // Create regular user in department
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

    // For testing, we'll use a placeholder token
    // In real tests, you would login properly or generate JWT tokens
    managerToken = 'test-manager-token-placeholder';

    // Note: In production tests, you would:
    // 1. Hash password properly with bcrypt
    // 2. Login via /api/v1/auth/login
    // 3. Extract token from response
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
      .deleteMany({ email: { $in: ['manager@test.com', 'user@test.com'] } })
      .exec();
    await departmentModel.deleteMany({ name: 'Engineering' }).exec();
    await projectModel.deleteMany({ name: 'Test Project' }).exec();
    await taskModel
      .deleteMany({ title: { $in: ['Test Task', 'Updated Task'] } })
      .exec();
    await companyModel.deleteMany({ name: 'Test Company' }).exec();

    await app.close();
  });

  describe('Manager Projects', () => {
    it('GET /manager/projects - should get all department projects', async () => {
      // Create a project
      const projectModel = app.get<Model<Project>>(getModelToken(Project.name));
      const project = await projectModel.create({
        name: 'Test Project',
        description: 'Test Description',
        companyId: companyId,
        createdBy: managerId,
        assignedUsers: [userId],
        status: 'active',
        isActive: true,
      });
      projectId = project._id.toString();

      const response = await request(app.getHttpServer())
        .get('/api/v1/manager/projects')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('GET /manager/projects/:id - should get project details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/manager/projects/${projectId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('progress');
    });

    it('GET /manager/projects/:id/tasks - should get project tasks', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/manager/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Manager Tasks', () => {
    it('POST /manager/tasks - should create a task', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/manager/tasks')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: 'Test Task',
          description: 'Test Description',
          projectId: projectId,
          assignedTo: userId,
          priority: 'high',
          status: 'todo',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.title).toBe('Test Task');
      taskId = response.body.data._id;
    });

    it('GET /manager/tasks - should get all tasks', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/manager/tasks')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('GET /manager/tasks/:id - should get task details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/manager/tasks/${taskId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.title).toBe('Test Task');
    });

    it('PATCH /manager/tasks/:id - should update task', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/manager/tasks/${taskId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: 'Updated Task',
          priority: 'medium',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Task');
    });

    it('POST /manager/tasks/:id/assign - should assign task to user', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/manager/tasks/${taskId}/assign`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          userId: userId,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('POST /manager/tasks/:id/status - should update task status', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/manager/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          status: 'in_progress',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('in_progress');
    });

    it('POST /manager/tasks/:id/comment - should add comment', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/manager/tasks/${taskId}/comment`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          comment: 'Test comment',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('POST /manager/tasks/:id/attachment - should add attachment', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/manager/tasks/${taskId}/attachment`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          filename: 'test.pdf',
          url: 'https://example.com/test.pdf',
          size: 1024,
          mimeType: 'application/pdf',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('DELETE /manager/tasks/:id - should delete task', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/manager/tasks/${taskId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Manager Team', () => {
    it('GET /manager/team - should get team members', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/manager/team')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('numberOfTasksAssigned');
        expect(response.body.data[0]).toHaveProperty('numberOfTasksCompleted');
      }
    });

    it('GET /manager/team/:userId - should get team member details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/manager/team/${userId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data).toHaveProperty('numberOfTasksAssigned');
      expect(response.body.data).toHaveProperty('completionRate');
    });
  });

  describe('Manager Stats', () => {
    it('GET /manager/stats/overview - should get overview stats', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/manager/stats/overview')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalTasks');
      expect(response.body.data).toHaveProperty('completedTasks');
      expect(response.body.data).toHaveProperty('teamSize');
    });

    it('GET /manager/stats/tasks - should get task stats', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/manager/stats/tasks')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tasksByStatus');
      expect(response.body.data).toHaveProperty('tasksByPriority');
    });

    it('GET /manager/stats/team - should get team stats', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/manager/stats/team')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('teamProductivity');
      expect(response.body.data).toHaveProperty('averageCompletionRate');
    });
  });
});
