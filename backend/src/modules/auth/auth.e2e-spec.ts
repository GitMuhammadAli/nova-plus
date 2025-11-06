import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from './auth.module';
import { UsersModule } from '../user/user.module';
import { CompanyModule } from '../company/company.module';
import { InviteModule } from '../invite/invite.module';
import { getJwtSecret } from './utils/jwt-secret.util';
import { TestDataSeed } from '../user/seed/test-data.seed';
import { User, UserRole, UserSchema } from '../user/entities/user.entity';
import { Company, CompanySchema } from '../company/entities/company.entity';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import * as jwt from 'jsonwebtoken';

/**
 * E2E Tests for Multi-Tenant Authentication & Authorization
 * 
 * Tests:
 * - JWT token generation with companyId + role
 * - Company isolation
 * - RBAC (Role-Based Access Control)
 * - Company registration flow
 * - Invite/Join flow
 * - Company guard validation
 */
describe('Multi-Tenant Auth E2E Tests', () => {
  let app: INestApplication;
  let testDataSeed: TestDataSeed;
  let userModel: Model<User>;
  let companyModel: Model<Company>;

  // Test user credentials (will be populated after seed)
  let superAdminToken: string;
  let acmeAdminToken: string;
  let acmeManagerToken: string;
  let acmeUserToken: string;
  let techAdminToken: string;
  let techUserToken: string;

  let acmeCompanyId: string;
  let techCompanyId: string;
  let acmeAdminId: string;
  let acmeManagerId: string;
  let acmeUserId: string;
  let techAdminId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/novapulse-test'),
        MongooseModule.forFeature([
          { name: User.name, schema: UserSchema },
          { name: Company.name, schema: CompanySchema },
        ]),
        PassportModule,
        JwtModule.register({
          secret: getJwtSecret(),
          signOptions: { expiresIn: '15m' },
        }),
        AuthModule,
        UsersModule,
        CompanyModule,
        InviteModule,
      ],
      providers: [TestDataSeed],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    testDataSeed = moduleFixture.get<TestDataSeed>(TestDataSeed);
    userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));
    companyModel = moduleFixture.get<Model<Company>>(getModelToken(Company.name));

    // Seed test data
    await testDataSeed.seedTestData();

    // Get company IDs
    const acmeCorp = await companyModel.findOne({ name: 'AcmeCorp' }).exec();
    const techVerse = await companyModel.findOne({ name: 'TechVerse' }).exec();
    acmeCompanyId = acmeCorp?._id.toString() || '';
    techCompanyId = techVerse?._id.toString() || '';

    // Get user IDs and generate tokens
    const acmeAdmin = await userModel.findOne({ email: 'acme.admin@acme.com' }).exec();
    const acmeManager = await userModel.findOne({ email: 'acme.manager@acme.com' }).exec();
    const acmeUser = await userModel.findOne({ email: 'acme.user1@acme.com' }).exec();
    const techAdmin = await userModel.findOne({ email: 'tech.admin@techverse.com' }).exec();
    const superAdmin = await userModel.findOne({ email: 'super.admin@test.com' }).exec();

    acmeAdminId = acmeAdmin?._id.toString() || '';
    acmeManagerId = acmeManager?._id.toString() || '';
    acmeUserId = acmeUser?._id.toString() || '';
    techAdminId = techAdmin?._id.toString() || '';

    // Generate tokens by logging in
    const loginResponse = async (email: string, password: string) => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password });
      return response.body;
    };

    // Helper to extract token from login response cookies
    const extractTokenFromLogin = async (email: string, password: string): Promise<string> => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password });
      
      const cookies = response.headers['set-cookie'];
      if (Array.isArray(cookies)) {
        const accessTokenCookie = cookies.find(c => c.startsWith('access_token='));
        if (accessTokenCookie) {
          const match = accessTokenCookie.match(/access_token=([^;]+)/);
          return match ? match[1] : '';
        }
      }
      return '';
    };

    superAdminToken = await extractTokenFromLogin('super.admin@test.com', 'super123');
    acmeAdminToken = await extractTokenFromLogin('acme.admin@acme.com', 'acme123');
    acmeManagerToken = await extractTokenFromLogin('acme.manager@acme.com', 'acme123');
    acmeUserToken = await extractTokenFromLogin('acme.user1@acme.com', 'acme123');
    techAdminToken = await extractTokenFromLogin('tech.admin@techverse.com', 'tech123');
    techUserToken = await extractTokenFromLogin('tech.user1@techverse.com', 'tech123');
  });

  afterAll(async () => {
    // Clean up test data
    await userModel.deleteMany({
      email: {
        $in: [
          'super.admin@test.com',
          'acme.admin@acme.com',
          'acme.manager@acme.com',
          'acme.user1@acme.com',
          'acme.user2@acme.com',
          'tech.admin@techverse.com',
          'tech.manager@techverse.com',
          'tech.user1@techverse.com',
          'tech.user2@techverse.com',
        ],
      },
    }).exec();

    await companyModel.deleteMany({
      name: { $in: ['AcmeCorp', 'TechVerse'] },
    }).exec();

    await app.close();
  });

  describe('Step 2: Auth & JWT Verification', () => {
    it('POST /auth/login should return JWT with userId, role, companyId', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'acme.admin@acme.com',
          password: 'acme123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('_id');
      expect(response.body.user).toHaveProperty('email', 'acme.admin@acme.com');
      expect(response.body.user).toHaveProperty('role', UserRole.COMPANY_ADMIN);
      expect(response.body.user).toHaveProperty('companyId', acmeCompanyId);

      // Verify JWT payload - extract token from cookies
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      
      // Verify token contains correct payload
      const cookieString = Array.isArray(cookies) ? cookies.join('; ') : cookies;
      const tokenMatch = cookieString.match(/access_token=([^;]+)/);
      if (tokenMatch) {
        const token = tokenMatch[1];
        const payload: any = jwt.decode(token);
        expect(payload).toHaveProperty('sub');
        expect(payload).toHaveProperty('role', UserRole.COMPANY_ADMIN);
        expect(payload).toHaveProperty('companyId', acmeCompanyId);
      }
    });

    it('GET /auth/me should return current user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', [`access_token=${acmeAdminToken}`])
        .expect(200);

      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('email', 'acme.admin@acme.com');
      expect(response.body).toHaveProperty('role', UserRole.COMPANY_ADMIN);
      expect(response.body).toHaveProperty('companyId', acmeCompanyId);
    });

    it('Tokens should differ per company', async () => {
      // Decode tokens to verify they have different companyIds
      const acmeTokenPayload: any = jwt.decode(acmeAdminToken);
      const techTokenPayload: any = jwt.decode(techAdminToken);

      expect(acmeTokenPayload.companyId).toBe(acmeCompanyId);
      expect(techTokenPayload.companyId).toBe(techCompanyId);
      expect(acmeTokenPayload.companyId).not.toBe(techTokenPayload.companyId);
    });
  });

  describe('Step 3: Company Isolation', () => {
    it('Company Admin from AcmeCorp cannot access TechVerse company ID (403)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/company/${techCompanyId}`)
        .set('Cookie', [`access_token=${acmeAdminToken}`])
        .expect(403);

      expect(response.body.message).toContain('own company');
    });

    it('GET /company/:id should only allow access to own company for Company Admin', async () => {
      // Acme Admin accessing AcmeCorp - should succeed
      const acmeResponse = await request(app.getHttpServer())
        .get(`/company/${acmeCompanyId}`)
        .set('Cookie', [`access_token=${acmeAdminToken}`])
        .expect(200);

      expect(acmeResponse.body).toHaveProperty('_id', acmeCompanyId);
      expect(acmeResponse.body).toHaveProperty('name', 'AcmeCorp');

      // Acme Admin accessing TechVerse - should fail
      await request(app.getHttpServer())
        .get(`/company/${techCompanyId}`)
        .set('Cookie', [`access_token=${acmeAdminToken}`])
        .expect(403);
    });

    it('GET /company/:id/users should enforce company isolation', async () => {
      // Acme Admin viewing AcmeCorp users - should succeed
      const acmeUsersResponse = await request(app.getHttpServer())
        .get(`/company/${acmeCompanyId}/users`)
        .set('Cookie', [`access_token=${acmeAdminToken}`])
        .expect(200);

      expect(Array.isArray(acmeUsersResponse.body)).toBe(true);
      acmeUsersResponse.body.forEach((user: any) => {
        expect(user.companyId?.toString()).toBe(acmeCompanyId);
      });

      // Acme Admin trying to view TechVerse users - should fail
      await request(app.getHttpServer())
        .get(`/company/${techCompanyId}/users`)
        .set('Cookie', [`access_token=${acmeAdminToken}`])
        .expect(403);
    });

    it('Negative test: Modified JWT with wrong companyId should be rejected', async () => {
      // Create a token with modified companyId
      const fakePayload = {
        sub: acmeAdminId,
        email: 'acme.admin@acme.com',
        role: UserRole.COMPANY_ADMIN,
        companyId: techCompanyId, // Wrong company!
      };

      const fakeToken = jwt.sign(fakePayload, getJwtSecret(), { expiresIn: '15m' });

      // The token will be validated, but the user document will have the correct companyId
      // So the guard should still reject it
      await request(app.getHttpServer())
        .get(`/company/${techCompanyId}`)
        .set('Cookie', [`access_token=${fakeToken}`])
        .expect(403); // Should fail because user's actual companyId doesn't match
    });
  });

  describe('Step 4: RBAC (Role Guard)', () => {
    it('POST /company/register should be accessible without auth (public)', async () => {
      const response = await request(app.getHttpServer())
        .post('/company/register')
        .send({
          companyName: 'TestCorp',
          adminName: 'Test Admin',
          email: 'test.admin@testcorp.com',
          password: 'test123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('company');
      expect(response.body).toHaveProperty('admin');

      // Clean up
      await companyModel.deleteOne({ name: 'TestCorp' }).exec();
      await userModel.deleteOne({ email: 'test.admin@testcorp.com' }).exec();
    });

    it('POST /company/create should require SUPER_ADMIN role', async () => {
      // Acme Admin (Company Admin) should get 403
      await request(app.getHttpServer())
        .post('/company/create')
        .set('Cookie', [`access_token=${acmeAdminToken}`])
        .send({
          name: 'NewCorp',
          companyAdminEmail: 'new@corp.com',
          companyAdminName: 'New Admin',
          companyAdminPassword: 'new123',
        })
        .expect(403);

      // Super Admin should succeed
      const response = await request(app.getHttpServer())
        .post('/company/create')
        .set('Cookie', [`access_token=${superAdminToken}`])
        .send({
          name: 'NewCorp',
          companyAdminEmail: 'new@corp.com',
          companyAdminName: 'New Admin',
          companyAdminPassword: 'new123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('company');

      // Clean up
      await companyModel.deleteOne({ name: 'NewCorp' }).exec();
      await userModel.deleteOne({ email: 'new@corp.com' }).exec();
    });

    it('GET /company/all should require SUPER_ADMIN role', async () => {
      // Acme Admin should get 403
      await request(app.getHttpServer())
        .get('/company/all')
        .set('Cookie', [`access_token=${acmeAdminToken}`])
        .expect(403);

      // Super Admin should succeed
      const response = await request(app.getHttpServer())
        .get('/company/all')
        .set('Cookie', [`access_token=${superAdminToken}`])
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('POST /user/create should require COMPANY_ADMIN or MANAGER role', async () => {
      // Regular user should get 403
      await request(app.getHttpServer())
        .post('/user/create')
        .set('Cookie', [`access_token=${acmeUserToken}`])
        .send({
          email: 'newuser@acme.com',
          name: 'New User',
          password: 'new123',
          role: UserRole.USER,
        })
        .expect(403);

      // Company Admin should succeed
      const response = await request(app.getHttpServer())
        .post('/user/create')
        .set('Cookie', [`access_token=${acmeAdminToken}`])
        .send({
          email: 'newuser@acme.com',
          name: 'New User',
          password: 'new123',
          role: UserRole.USER,
        })
        .expect(201);

      expect(response.body).toHaveProperty('user');

      // Clean up
      await userModel.deleteOne({ email: 'newuser@acme.com' }).exec();
    });

    it('GET /user/company should require COMPANY_ADMIN role', async () => {
      // Manager should get 403
      await request(app.getHttpServer())
        .get('/user/company')
        .set('Cookie', [`access_token=${acmeManagerToken}`])
        .expect(403);

      // Regular user should get 403
      await request(app.getHttpServer())
        .get('/user/company')
        .set('Cookie', [`access_token=${acmeUserToken}`])
        .expect(403);

      // Company Admin should succeed
      const response = await request(app.getHttpServer())
        .get('/user/company')
        .set('Cookie', [`access_token=${acmeAdminToken}`])
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Step 5: Company Registration Flow', () => {
    it('POST /company/register should create company and admin user', async () => {
      const response = await request(app.getHttpServer())
        .post('/company/register')
        .send({
          companyName: 'NewCompany',
          adminName: 'New Admin',
          email: 'newadmin@newcompany.com',
          password: 'new123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('company');
      expect(response.body).toHaveProperty('admin');
      expect(response.body.company).toHaveProperty('name', 'NewCompany');
      expect(response.body.admin).toHaveProperty('role', UserRole.COMPANY_ADMIN);
      expect(response.body.admin).toHaveProperty('companyId', response.body.company._id);

      // Verify in database
      const company = await companyModel.findById(response.body.company._id).exec();
      const admin = await userModel.findById(response.body.admin._id).exec();

      expect(company).toBeDefined();
      expect(admin).toBeDefined();
      expect(admin?.companyId?.toString()).toBe(company?._id.toString());

      // Clean up
      await companyModel.deleteOne({ _id: response.body.company._id }).exec();
      await userModel.deleteOne({ _id: response.body.admin._id }).exec();
    });
  });

  describe('Step 6: Join Company / Invite Flow', () => {
    let inviteToken: string;

    it('1️⃣ POST /invite/company/:companyId should generate invite (Company Admin)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/invite/company/${acmeCompanyId}`)
        .set('Cookie', [`access_token=${acmeAdminToken}`])
        .send({
          email: 'invited@acme.com',
          role: UserRole.USER,
          expiresInDays: 7,
        })
        .expect(201);

      expect(response.body).toHaveProperty('invite');
      expect(response.body.invite).toHaveProperty('token');
      expect(response.body.invite).toHaveProperty('email', 'invited@acme.com');
      expect(response.body.invite).toHaveProperty('role', UserRole.USER);

      inviteToken = response.body.invite.token;
    });

    it('2️⃣ GET /invite/:token should return invite details (public)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/invite/${inviteToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('invite');
      expect(response.body.invite).toHaveProperty('email', 'invited@acme.com');
      expect(response.body.invite).toHaveProperty('company');
    });

    it('3️⃣ POST /invite/:token/accept should create user with correct companyId', async () => {
      const response = await request(app.getHttpServer())
        .post(`/invite/${inviteToken}/accept`)
        .send({
          email: 'invited@acme.com',
          name: 'Invited User',
          password: 'invited123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'invited@acme.com');
      expect(response.body.user).toHaveProperty('companyId', acmeCompanyId);
      expect(response.body.user).toHaveProperty('role', UserRole.USER);

      // Verify user was created in database
      const user = await userModel.findOne({ email: 'invited@acme.com' }).exec();
      expect(user).toBeDefined();
      expect(user?.companyId?.toString()).toBe(acmeCompanyId);

      // Clean up
      await userModel.deleteOne({ email: 'invited@acme.com' }).exec();
    });

    it('4️⃣ Negative: Expired/wrong token should return error', async () => {
      // Wrong token
      await request(app.getHttpServer())
        .get('/invite/invalid-token-12345')
        .expect(404);

      // Try to accept already used token
      await request(app.getHttpServer())
        .post(`/invite/${inviteToken}/accept`)
        .send({
          email: 'invited2@acme.com',
          name: 'Invited User 2',
          password: 'invited123',
        })
        .expect(404); // Token already used
    });

    it('Manager can only invite users (not managers)', async () => {
      // Manager trying to invite another manager - should fail
      await request(app.getHttpServer())
        .post(`/invite/company/${acmeCompanyId}`)
        .set('Cookie', [`access_token=${acmeManagerToken}`])
        .send({
          email: 'newmanager@acme.com',
          role: UserRole.MANAGER,
        })
        .expect(403);

      // Manager inviting user - should succeed
      const response = await request(app.getHttpServer())
        .post(`/invite/company/${acmeCompanyId}`)
        .set('Cookie', [`access_token=${acmeManagerToken}`])
        .send({
          email: 'managerinvited@acme.com',
          role: UserRole.USER,
        })
        .expect(201);

      expect(response.body.invite.role).toBe(UserRole.USER);

      // Clean up invite
      // Note: In a real scenario, you'd delete the invite from the database
    });
  });

  describe('Step 7: Company Guard', () => {
    it('GET /company/:id/users should only allow access to own company', async () => {
      // Acme Admin accessing AcmeCorp users - should succeed
      const response = await request(app.getHttpServer())
        .get(`/company/${acmeCompanyId}/users`)
        .set('Cookie', [`access_token=${acmeAdminToken}`])
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((user: any) => {
        expect(user.companyId?.toString()).toBe(acmeCompanyId);
      });

      // Acme Admin trying to access TechVerse users - should fail
      await request(app.getHttpServer())
        .get(`/company/${techCompanyId}/users`)
        .set('Cookie', [`access_token=${acmeAdminToken}`])
        .expect(403);
    });
  });
});

