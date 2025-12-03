import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserRole } from '../src/modules/user/entities/user.entity';
import { Company } from '../src/modules/company/entities/company.entity';
import { Project } from '../src/modules/project/entities/project.entity';
import { Task, TaskStatus } from '../src/modules/task/entities/task.entity';

describe('Phase 3 - User Module (e2e)', () => {
  let app: INestApplication;
  let userToken: string;
  let userId: string;
  let companyId: string;
  let projectId: string;
  let taskId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create test company
    const companyModel = app.get<Model<Company>>(getModelToken(Company.name));
    const company = await companyModel.create({
      name: 'Test Company',
      domain: 'test.com',
      isActive: true,
    });
    companyId = company._id.toString();

    // Create user
    const userModel = app.get<Model<User>>(getModelToken(User.name));
    const user = await userModel.create({
      email: 'testuser@test.com',
      password: 'hashedpassword',
      name: 'Test User',
      role: UserRole.USER,
      companyId: company._id,
      isActive: true,
    });
    userId = user._id.toString();

    // Create project with user assigned
    const projectModel = app.get<Model<Project>>(getModelToken(Project.name));
    const project = await projectModel.create({
      name: 'User Project',
      description: 'Test Description',
      companyId: company._id,
      createdBy: userId,
      assignedUsers: [userId],
      status: 'active',
      isActive: true,
    });
    projectId = project._id.toString();

    // Create task assigned to user
    const taskModel = app.get<Model<Task>>(getModelToken(Task.name));
    const task = await taskModel.create({
      title: 'User Task',
      description: 'Test Description',
      companyId: company._id,
      assignedBy: userId,
      assignedTo: userId,
      projectId: project._id,
      status: TaskStatus.TODO,
      priority: 'medium',
      isActive: true,
    });
    taskId = task._id.toString();

    // Login as user to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'testuser@test.com',
        password: 'hashedpassword',
      });

    userToken = loginResponse.body.token || loginResponse.body.data?.token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('User Tasks', () => {
    it('GET /user/tasks - should get user tasks', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/user/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('_id');
        expect(response.body.data[0]).toHaveProperty('title');
      }
    });

    it('GET /user/tasks/:id - should get task details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/user/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.title).toBe('User Task');
    });

    it('PATCH /user/tasks/:id/status - should update task status (todo -> in_progress)', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/user/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          status: 'in_progress',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('in_progress');
    });

    it('PATCH /user/tasks/:id/status - should update task status (in_progress -> review)', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/user/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          status: 'review',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('review');
    });

    it('PATCH /user/tasks/:id/status - should update task status (review -> done)', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/user/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          status: 'done',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('done');
    });

    it('PATCH /user/tasks/:id/status - should reject invalid status transition', async () => {
      // Create a new task in todo status
      const taskModel = app.get<Model<Task>>(getModelToken(Task.name));
      const newTask = await taskModel.create({
        title: 'New Task',
        companyId: companyId,
        assignedBy: userId,
        assignedTo: userId,
        status: TaskStatus.TODO,
        isActive: true,
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/user/tasks/${newTask._id}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          status: 'done', // Invalid: can't go from todo directly to done
        })
        .expect(400);

      expect(response.body.message).toContain('Invalid status transition');
    });

    it('POST /user/tasks/:id/comment - should add comment', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/user/tasks/${taskId}/comment`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          comment: 'User comment',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('POST /user/tasks/:id/attachment - should add attachment', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/user/tasks/${taskId}/attachment`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          filename: 'user-file.pdf',
          url: 'https://example.com/user-file.pdf',
          size: 2048,
          mimeType: 'application/pdf',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('User Projects', () => {
    it('GET /user/projects - should get user projects', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/user/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('_id');
        expect(response.body.data[0]).toHaveProperty('progress');
        expect(response.body.data[0]).toHaveProperty('myTasks');
      }
    });

    it('GET /user/projects/:id - should get project details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/user/projects/${projectId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('tasks');
    });
  });

  describe('User Stats', () => {
    it('GET /user/stats/overview - should get overview stats', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/user/stats/overview')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalTasks');
      expect(response.body.data).toHaveProperty('completedTasks');
      expect(response.body.data).toHaveProperty('completionRate');
    });

    it('GET /user/stats/productivity - should get productivity stats', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/user/stats/productivity')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tasksByStatus');
      expect(response.body.data).toHaveProperty('tasksByPriority');
      expect(response.body.data).toHaveProperty('averageCompletionTime');
    });
  });
});

