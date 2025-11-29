import { Controller, Post, Get, Delete, Body, UseGuards, Req } from '@nestjs/common';
import { MfaService } from './mfa.service';
import { VerifyMfaDto } from './dto/mfa.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

@Controller('auth/mfa')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @Post('setup')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.USER, UserRole.SUPER_ADMIN)
  async setup(@Req() req) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;

    if (!companyId) {
      throw new Error('User must belong to a company');
    }

    const result = await this.mfaService.setupMfa(user._id || user.id, companyId);

    return {
      ...result,
      success: true,
    };
  }

  @Post('verify')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.USER, UserRole.SUPER_ADMIN)
  async verify(@Body() verifyMfaDto: VerifyMfaDto, @Req() req) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;

    if (!companyId) {
      throw new Error('User must belong to a company');
    }

    const result = await this.mfaService.verifyAndEnableMfa(
      user._id || user.id,
      companyId,
      verifyMfaDto.token,
    );

    return {
      ...result,
      success: true,
    };
  }

  @Delete('disable')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.USER, UserRole.SUPER_ADMIN)
  async disable(@Req() req) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;

    if (!companyId) {
      throw new Error('User must belong to a company');
    }

    const result = await this.mfaService.disableMfa(user._id || user.id, companyId);

    return {
      ...result,
      success: true,
    };
  }

  @Post('recovery-codes/regenerate')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.USER, UserRole.SUPER_ADMIN)
  async regenerateRecoveryCodes(@Req() req) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;

    if (!companyId) {
      throw new Error('User must belong to a company');
    }

    const result = await this.mfaService.regenerateRecoveryCodes(user._id || user.id, companyId);

    return {
      success: true,
      ...result,
    };
  }

  @Get('status')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.USER, UserRole.SUPER_ADMIN)
  async getStatus(@Req() req) {
    const user = req.user;
    const isEnabled = await this.mfaService.isMfaEnabled(user._id || user.id);

    return {
      success: true,
      enabled: isEnabled,
    };
  }
}

