import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserRole } from '../entities/user.entity';
import { Company, CompanyDocument } from '../../company/entities/company.entity';
import * as bcrypt from 'bcrypt';

/**
 * Test Data Seed for Phase 2 Testing
 * 
 * Creates:
 * - 1 Super Admin (global SaaS owner)
 * - 2 Companies: AcmeCorp, TechVerse
 * - Each company with:
 *   - 1 Company Admin (CEO)
 *   - 1 Manager
 *   - 2 Users
 * 
 * Usage: Call seedTestData() method to populate database
 */
@Injectable()
export class TestDataSeed {
  private readonly logger = new Logger(TestDataSeed.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  ) {}

  /**
   * Seeds test data for comprehensive testing
   * WARNING: This will clear existing test data if run multiple times
   */
  async seedTestData(): Promise<void> {
    try {
      this.logger.log('🌱 Starting test data seed...');

      // Clear existing test data (optional - comment out if you want to keep existing data)
      await this.clearTestData();

      // Create Super Admin
      const superAdmin = await this.createSuperAdmin();

      // Create AcmeCorp
      const acmeCorp = await this.createCompany('AcmeCorp', 'acme.com', superAdmin._id);
      const acmeAdmin = await this.createUser(
        'acme.admin@acme.com',
        'Acme Admin',
        'acme123',
        UserRole.COMPANY_ADMIN,
        acmeCorp._id,
      );
      const acmeManager = await this.createUser(
        'acme.manager@acme.com',
        'Acme Manager',
        'acme123',
        UserRole.MANAGER,
        acmeCorp._id,
        acmeAdmin._id,
      );
      const acmeUser1 = await this.createUser(
        'acme.user1@acme.com',
        'Acme User 1',
        'acme123',
        UserRole.USER,
        acmeCorp._id,
        acmeAdmin._id,
        acmeManager._id,
      );
      const acmeUser2 = await this.createUser(
        'acme.user2@acme.com',
        'Acme User 2',
        'acme123',
        UserRole.USER,
        acmeCorp._id,
        acmeAdmin._id,
        acmeManager._id,
      );

      // Update AcmeCorp with users
      acmeCorp.managers.push(acmeAdmin._id as any, acmeManager._id as any);
      acmeCorp.users.push(
        acmeAdmin._id as any,
        acmeManager._id as any,
        acmeUser1._id as any,
        acmeUser2._id as any,
      );
      await acmeCorp.save();

      // Create TechVerse
      const techVerse = await this.createCompany('TechVerse', 'techverse.com', superAdmin._id);
      const techAdmin = await this.createUser(
        'tech.admin@techverse.com',
        'TechVerse Admin',
        'tech123',
        UserRole.COMPANY_ADMIN,
        techVerse._id,
      );
      const techManager = await this.createUser(
        'tech.manager@techverse.com',
        'TechVerse Manager',
        'tech123',
        UserRole.MANAGER,
        techVerse._id,
        techAdmin._id,
      );
      const techUser1 = await this.createUser(
        'tech.user1@techverse.com',
        'TechVerse User 1',
        'tech123',
        UserRole.USER,
        techVerse._id,
        techAdmin._id,
        techManager._id,
      );
      const techUser2 = await this.createUser(
        'tech.user2@techverse.com',
        'TechVerse User 2',
        'tech123',
        UserRole.USER,
        techVerse._id,
        techAdmin._id,
        techManager._id,
      );

      // Update TechVerse with users
      techVerse.managers.push(techAdmin._id as any, techManager._id as any);
      techVerse.users.push(
        techAdmin._id as any,
        techManager._id as any,
        techUser1._id as any,
        techUser2._id as any,
      );
      await techVerse.save();

      this.logger.log('✅ Test data seed completed successfully!');
      this.logger.log('\n📋 Test Users Created:');
      this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      this.logger.log('SUPER ADMIN:');
      this.logger.log(`  Email: ${superAdmin.email}`);
      this.logger.log(`  Password: super123`);
      this.logger.log(`  Role: ${superAdmin.role}`);
      this.logger.log('\nACME CORP:');
      this.logger.log(`  Company ID: ${acmeCorp._id}`);
      this.logger.log(`  Admin: ${acmeAdmin.email} / acme123`);
      this.logger.log(`  Manager: ${acmeManager.email} / acme123`);
      this.logger.log(`  User 1: ${acmeUser1.email} / acme123`);
      this.logger.log(`  User 2: ${acmeUser2.email} / acme123`);
      this.logger.log('\nTECHVERSE:');
      this.logger.log(`  Company ID: ${techVerse._id}`);
      this.logger.log(`  Admin: ${techAdmin.email} / tech123`);
      this.logger.log(`  Manager: ${techManager.email} / tech123`);
      this.logger.log(`  User 1: ${techUser1.email} / tech123`);
      this.logger.log(`  User 2: ${techUser2.email} / tech123`);
      this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } catch (error) {
      this.logger.error('❌ Failed to seed test data:', error.message);
      throw error;
    }
  }

  /**
   * Clears existing test data (companies and users with test emails)
   */
  private async clearTestData(): Promise<void> {
    this.logger.log('🧹 Clearing existing test data...');

    // Delete test companies
    await this.companyModel.deleteMany({
      name: { $in: ['AcmeCorp', 'TechVerse'] },
    }).exec();

    // Delete test users
    await this.userModel.deleteMany({
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

    this.logger.log('✅ Test data cleared');
  }

  /**
   * Creates a Super Admin user
   */
  private async createSuperAdmin(): Promise<User> {
    const email = 'super.admin@test.com';
    const existing = await this.userModel.findOne({ email }).exec();
    if (existing) {
      this.logger.log(`Super Admin already exists: ${email}`);
      return existing;
    }

    const hashedPassword = await bcrypt.hash('super123', 10);
    const superAdmin = new this.userModel({
      email,
      password: hashedPassword,
      name: 'Super Admin',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    });

    await superAdmin.save();
    this.logger.log(`✅ Created Super Admin: ${email}`);
    return superAdmin;
  }

  /**
   * Creates a company
   */
  private async createCompany(
    name: string,
    domain: string,
    createdBy: any,
  ): Promise<CompanyDocument> {
    const existing = await this.companyModel.findOne({ name }).exec();
    if (existing) {
      this.logger.log(`Company already exists: ${name}`);
      return existing;
    }

    const company = new this.companyModel({
      name,
      domain,
      createdBy,
      managers: [],
      users: [],
      isActive: true,
    });

    await company.save();
    this.logger.log(`✅ Created Company: ${name}`);
    return company;
  }

  /**
   * Creates a user
   */
  private async createUser(
    email: string,
    name: string,
    password: string,
    role: UserRole,
    companyId: any,
    createdBy?: any,
    managerId?: any,
  ): Promise<User> {
    const existing = await this.userModel.findOne({ email }).exec();
    if (existing) {
      this.logger.log(`User already exists: ${email}`);
      return existing;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new this.userModel({
      email,
      password: hashedPassword,
      name,
      role,
      companyId: companyId.toString(),
      orgId: companyId.toString(), // Backward compatibility
      createdBy: createdBy?.toString(),
      managerId: managerId?.toString(),
      isActive: true,
    });

    await user.save();
    this.logger.log(`✅ Created User: ${email} (${role})`);
    return user;
  }
}

