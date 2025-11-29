import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Setting, SettingDocument, SettingType } from './entities/setting.entity';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { UserRole } from '../user/entities/user.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Setting.name) private settingModel: Model<SettingDocument>,
  ) {}

  async create(createSettingDto: CreateSettingDto, companyId: string): Promise<SettingDocument> {
    // Check if setting already exists
    const existing = await this.settingModel.findOne({
      companyId: new Types.ObjectId(companyId),
      key: createSettingDto.key,
    }).exec();

    if (existing) {
      throw new ForbiddenException('Setting with this key already exists');
    }

    const setting = new this.settingModel({
      ...createSettingDto,
      companyId: new Types.ObjectId(companyId),
      type: createSettingDto.type || SettingType.GENERAL,
    });

    return setting.save();
  }

  async findAll(companyId: string, type?: SettingType): Promise<SettingDocument[]> {
    const query: any = { companyId: new Types.ObjectId(companyId) };
    if (type) {
      query.type = type;
    }
    return this.settingModel.find(query).exec();
  }

  async findOne(id: string, companyId: string): Promise<SettingDocument> {
    const setting = await this.settingModel.findOne({
      _id: id,
      companyId: new Types.ObjectId(companyId),
    }).exec();

    if (!setting) {
      throw new NotFoundException('Setting not found');
    }

    return setting;
  }

  async findByKey(key: string, companyId: string): Promise<SettingDocument | null> {
    return this.settingModel.findOne({
      key,
      companyId: new Types.ObjectId(companyId),
    }).exec();
  }

  async update(id: string, updateSettingDto: UpdateSettingDto, companyId: string): Promise<SettingDocument> {
    const setting = await this.settingModel.findOne({
      _id: id,
      companyId: new Types.ObjectId(companyId),
    }).exec();

    if (!setting) {
      throw new NotFoundException('Setting not found');
    }

    Object.assign(setting, updateSettingDto);
    return setting.save();
  }

  async updateByKey(key: string, value: any, companyId: string): Promise<SettingDocument> {
    const setting = await this.settingModel.findOne({
      key,
      companyId: new Types.ObjectId(companyId),
    }).exec();

    if (!setting) {
      throw new NotFoundException('Setting not found');
    }

    setting.value = value;
    return setting.save();
  }

  async remove(id: string, companyId: string): Promise<void> {
    const result = await this.settingModel.deleteOne({
      _id: id,
      companyId: new Types.ObjectId(companyId),
    }).exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException('Setting not found');
    }
  }

  /**
   * Get company settings grouped by type
   */
  async getCompanySettings(companyId: string) {
    const settings = await this.findAll(companyId);
    const grouped: Record<string, any[]> = {};

    settings.forEach(setting => {
      if (!grouped[setting.type]) {
        grouped[setting.type] = [];
      }
      grouped[setting.type].push({
        key: setting.key,
        value: setting.value,
        description: setting.description,
        isActive: setting.isActive,
      });
    });

    return grouped;
  }

  /**
   * Get branding settings
   */
  async getBrandingSettings(companyId: string) {
    return this.findAll(companyId, SettingType.BRANDING);
  }

  /**
   * Update branding settings
   */
  async updateBranding(companyId: string, branding: { logo?: string; primaryColor?: string; secondaryColor?: string; companyName?: string }) {
    const brandingKeys = ['logo', 'primaryColor', 'secondaryColor', 'companyName'];

    for (const key of brandingKeys) {
      if (branding[key as keyof typeof branding] !== undefined) {
        const existing = await this.findByKey(key, companyId);
        if (existing) {
          await this.updateByKey(key, branding[key as keyof typeof branding], companyId);
        } else {
          await this.create({
            key,
            value: branding[key as keyof typeof branding],
            type: SettingType.BRANDING,
          }, companyId);
        }
      }
    }

    return this.getBrandingSettings(companyId);
  }

  /**
   * Get permissions settings
   */
  async getPermissionsSettings(companyId: string) {
    return this.findAll(companyId, SettingType.PERMISSIONS);
  }

  /**
   * Update permissions settings
   */
  async updatePermissions(companyId: string, permissions: Record<string, any>) {
    const existing = await this.findByKey('permissions', companyId);
    if (existing) {
      return this.updateByKey('permissions', permissions, companyId);
    } else {
      return this.create({
        key: 'permissions',
        value: permissions,
        type: SettingType.PERMISSIONS,
      }, companyId);
    }
  }
}
