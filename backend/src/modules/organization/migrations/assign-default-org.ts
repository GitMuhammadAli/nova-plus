/**
 * Migration script to assign existing users to a default organization
 * Run this once to migrate existing users who don't have orgId
 *
 * Usage: This should be run manually or via a migration command
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../user/entities/user.entity';
import { Organization } from '../entities/organization.entity';

@Injectable()
export class AssignDefaultOrgMigration {
  private readonly logger = new Logger(AssignDefaultOrgMigration.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Organization.name) private orgModel: Model<Organization>,
  ) {}

  /**
   * Run migration: Create default org and assign all users without orgId
   */
  async run() {
    try {
      this.logger.log(
        'Starting migration: Assign default organization to existing users',
      );

      // Find or create default organization
      let defaultOrg = await this.orgModel
        .findOne({ slug: 'default-org' })
        .exec();

      if (!defaultOrg) {
        this.logger.log('Creating default organization...');
        defaultOrg = new this.orgModel({
          name: 'Default Organization',
          slug: 'default-org',
          description: 'Default organization for migrated users',
          isActive: true,
        });
        await defaultOrg.save();
        this.logger.log(`Created default organization: ${defaultOrg._id}`);
      }

      // Find all users without orgId
      const usersWithoutOrg = await this.userModel
        .find({ orgId: { $exists: false } })
        .exec();

      if (usersWithoutOrg.length === 0) {
        this.logger.log('No users found without orgId. Migration complete.');
        return { migrated: 0, message: 'No users to migrate' };
      }

      this.logger.log(`Found ${usersWithoutOrg.length} users without orgId`);

      // Update all users to have orgId
      const updateResult = await this.userModel
        .updateMany(
          { orgId: { $exists: false } },
          { $set: { orgId: defaultOrg._id } },
        )
        .exec();

      // Update organization members list
      const userIds = usersWithoutOrg.map((u) => u._id);
      defaultOrg.members.push(...(userIds as any));
      await defaultOrg.save();

      this.logger.log(
        `✅ Migration complete: ${updateResult.modifiedCount} users assigned to default organization`,
      );

      return {
        migrated: updateResult.modifiedCount,
        organizationId: defaultOrg._id,
        message: 'Migration completed successfully',
      };
    } catch (error) {
      this.logger.error('Migration failed:', error);
      throw error;
    }
  }
}
