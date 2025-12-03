import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { SettingType } from './entities/setting.entity';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async create(@Body() createSettingDto: CreateSettingDto, @Req() req) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    if (!companyId) {
      throw new Error('User must belong to a company');
    }
    const setting = await this.settingsService.create(createSettingDto, companyId);
    return {
      success: true,
      setting,
    };
  }

  @Get()
  async findAll(@Req() req, @Param('type') type?: SettingType) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    if (!companyId) {
      throw new Error('User must belong to a company');
    }
    const settings = await this.settingsService.findAll(companyId, type);
    return {
      success: true,
      settings,
    };
  }

  @Get('company')
  async getCompanySettings(@Req() req) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    if (!companyId) {
      throw new Error('User must belong to a company');
    }
    const settings = await this.settingsService.getCompanySettings(companyId);
    return {
      success: true,
      settings,
    };
  }

  @Get('branding')
  async getBranding(@Req() req) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    if (!companyId) {
      throw new Error('User must belong to a company');
    }
    const settings = await this.settingsService.getBrandingSettings(companyId);
    return {
      success: true,
      settings,
    };
  }

  @Patch('branding')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async updateBranding(@Body() body: { logo?: string; primaryColor?: string; secondaryColor?: string; companyName?: string }, @Req() req) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    if (!companyId) {
      throw new Error('User must belong to a company');
    }
    const settings = await this.settingsService.updateBranding(companyId, body);
    return {
      success: true,
      settings,
    };
  }

  @Get('permissions')
  async getPermissions(@Req() req) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    if (!companyId) {
      throw new Error('User must belong to a company');
    }
    const settings = await this.settingsService.getPermissionsSettings(companyId);
    return {
      success: true,
      settings,
    };
  }

  @Patch('permissions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async updatePermissions(@Body() body: Record<string, any>, @Req() req) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    if (!companyId) {
      throw new Error('User must belong to a company');
    }
    const setting = await this.settingsService.updatePermissions(companyId, body);
    return {
      success: true,
      setting,
    };
  }

  @Patch('company')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async updateCompanySettings(@Body() settings: Record<string, any>, @Req() req) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    if (!companyId) {
      throw new Error('User must belong to a company');
    }
    const updated = await this.settingsService.updateCompanySettings(companyId, settings);
    return {
      success: true,
      settings: updated,
    };
  }

  @Get('working-hours')
  async getWorkingHours(@Req() req) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    if (!companyId) {
      throw new Error('User must belong to a company');
    }
    const workingHours = await this.settingsService.getWorkingHours(companyId);
    return {
      success: true,
      workingHours,
    };
  }

  @Patch('working-hours')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async updateWorkingHours(@Body() workingHours: any, @Req() req) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    if (!companyId) {
      throw new Error('User must belong to a company');
    }
    const updated = await this.settingsService.updateWorkingHours(companyId, workingHours);
    return {
      success: true,
      workingHours: updated,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    if (!companyId) {
      throw new Error('User must belong to a company');
    }
    const setting = await this.settingsService.findOne(id, companyId);
    return {
      success: true,
      setting,
    };
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async update(@Param('id') id: string, @Body() updateSettingDto: UpdateSettingDto, @Req() req) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    if (!companyId) {
      throw new Error('User must belong to a company');
    }
    const setting = await this.settingsService.update(id, updateSettingDto, companyId);
    return {
      success: true,
      setting,
    };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async remove(@Param('id') id: string, @Req() req) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    if (!companyId) {
      throw new Error('User must belong to a company');
    }
    await this.settingsService.remove(id, companyId);
    return {
      success: true,
      message: 'Setting deleted successfully',
    };
  }
}
