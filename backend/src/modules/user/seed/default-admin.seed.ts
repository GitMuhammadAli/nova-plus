import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserRole } from '../entities/user.entity';
import bcrypt from 'bcrypt';

@Injectable()
export class DefaultAdminSeed implements OnModuleInit {
  private readonly logger = new Logger(DefaultAdminSeed.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async onModuleInit() {
    await this.createDefaultAdmin();
  }

  /**
   * Creates a default admin user if no admin exists in the database
   * This runs automatically when the backend starts
   */
  async createDefaultAdmin(): Promise<void> {
    try {
      // Check if any admin user already exists
      const existingAdmin = await this.userModel.findOne({
        role: { $in: [UserRole.ADMIN, UserRole.SUPERADMIN] }
      }).exec();

      if (existingAdmin) {
        this.logger.log('✅ Admin user already exists. Skipping default admin creation.');
        return;
      }

      // Default admin credentials from environment or use defaults
      const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@novapulse.com';
      const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
      const adminName = process.env.DEFAULT_ADMIN_NAME || 'Admin User';

      // Check if the email is already taken
      const existingUser = await this.userModel.findOne({ email: adminEmail }).exec();
      if (existingUser) {
        this.logger.warn(`⚠️  Email ${adminEmail} already exists. Skipping default admin creation.`);
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      // Create admin user
      const adminUser = new this.userModel({
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
        role: UserRole.ADMIN,
      });

      await adminUser.save();

      this.logger.log('✅ Default admin user created successfully!');
      this.logger.log(`📧 Email: ${adminEmail}`);
      this.logger.log(`🔑 Password: ${adminPassword}`);
      this.logger.warn('⚠️  Please change the default password after first login!');

    } catch (error) {
      this.logger.error('❌ Failed to create default admin user:', error.message);
      // Don't throw - allow app to continue even if seed fails
    }
  }
}

