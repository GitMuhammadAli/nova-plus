import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invite, InviteDocument } from './entities/invite.entity';
import { User, UserRole } from '../user/entities/user.entity';
import { Company } from '../company/entities/company.entity';
import { CreateInviteDto } from './dto/create-invite.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { EmailService } from '../email/email.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class InviteService {
  constructor(
    @InjectModel(Invite.name) private inviteModel: Model<InviteDocument>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Company.name) private companyModel: Model<Company>,
    private emailService: EmailService,
  ) {}

  /**
   * Generate a secure random token
   */
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create an invite for a company
   * Company Admin can invite managers or users
   * Manager can invite users only
   */
  async createInvite(
    companyId: string,
    creatorId: string,
    creatorRole: UserRole,
    createInviteDto: CreateInviteDto,
  ) {
    // Verify company exists
    const company = await this.companyModel.findById(companyId).exec();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Verify creator belongs to this company
    const creator = await this.userModel.findById(creatorId).exec();
    if (!creator || creator.companyId?.toString() !== companyId) {
      throw new ForbiddenException('You can only create invites for your own company');
    }

    // Role validation: Company Admin can invite managers/users, Manager can only invite users
    if (creatorRole === UserRole.MANAGER && createInviteDto.role !== UserRole.USER) {
      throw new ForbiddenException('Managers can only invite users');
    }

    // Note: Admin roles are already rejected by DTO validation, so no need to check here

    // If email is provided, check if user already exists
    if (createInviteDto.email) {
      const existingUser = await this.userModel.findOne({ email: createInviteDto.email }).exec();
      if (existingUser) {
        throw new BadRequestException('A user with this email already exists. They can log in directly without an invite.');
      }

      // Check if there's already an active (unused) invite for this email in this company
      const existingInvite = await this.inviteModel.findOne({
        email: createInviteDto.email,
        companyId: companyId,
        isUsed: false,
        isActive: true,
        expiresAt: { $gt: new Date() },
      }).exec();

      if (existingInvite) {
        throw new BadRequestException('An active invite already exists for this email. Please wait for it to be used or expired before creating a new one.');
      }
    }

    // Generate unique token
    let token = this.generateToken();
    let attempts = 0;
    while (await this.inviteModel.findOne({ token }).exec() && attempts < 10) {
      token = this.generateToken();
      attempts++;
    }

    if (attempts >= 10) {
      throw new BadRequestException('Failed to generate unique token');
    }

    // Set expiration (default 7 days)
    const expiresInDays = createInviteDto.expiresInDays || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create invite
    const invite = new this.inviteModel({
      token,
      companyId,
      createdBy: creatorId,
      email: createInviteDto.email,
      role: createInviteDto.role,
      expiresAt,
      isUsed: false,
      isActive: true,
    });

    const savedInvite = await invite.save();

    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3100'}/register?token=${savedInvite.token}`;

    // Send email if email is provided
    if (createInviteDto.email) {
      const company = await this.companyModel.findById(companyId).exec();
      const inviter = await this.userModel.findById(creatorId).exec();
      
      try {
        await this.emailService.sendInviteEmail({
          to: createInviteDto.email,
          inviteLink,
          companyName: company?.name || 'Unknown Company',
          inviterName: inviter?.name || 'Admin',
          role: createInviteDto.role,
          expiresAt: savedInvite.expiresAt,
        });
      } catch (error) {
        // Log error but don't fail the invite creation
        console.error('Failed to send invite email:', error);
      }
    }

    return {
      invite: {
        _id: savedInvite._id,
        token: savedInvite.token,
        email: savedInvite.email,
        role: savedInvite.role,
        expiresAt: savedInvite.expiresAt,
        inviteLink,
      },
      // Always return token and link for manual sharing (even without email)
      token: savedInvite.token,
      inviteLink,
    };
  }

  /**
   * Get invite details by token (for validation)
   */
  async getInviteByToken(token: string) {
    // First check if invite exists (including used ones)
    const invite = await this.inviteModel
      .findOne({ token, isActive: true })
      .populate('companyId', 'name domain')
      .populate('createdBy', 'name email')
      .exec();

    if (!invite) {
      throw new NotFoundException('Invite not found or has been revoked');
    }

    // Check if already used
    if (invite.isUsed) {
      throw new BadRequestException('This invite has already been used. Please contact your administrator for a new invite.');
    }

    // Check if expired
    if (new Date() > invite.expiresAt) {
      throw new BadRequestException('This invite has expired. Please contact your administrator for a new invite.');
    }

    return invite;
  }

  /**
   * Accept an invite and create user account
   */
  async acceptInvite(token: string, acceptInviteDto: AcceptInviteDto) {
    // Get invite (check all invites first to provide better error messages)
    const invite = await this.inviteModel.findOne({ token, isActive: true }).exec();

    if (!invite) {
      throw new NotFoundException('Invite not found or has been revoked');
    }

    // Check if already used
    if (invite.isUsed) {
      throw new BadRequestException('This invite has already been used. Please contact your administrator for a new invite.');
    }

    // Check if expired
    if (new Date() > invite.expiresAt) {
      throw new BadRequestException('This invite has expired. Please contact your administrator for a new invite.');
    }

    // If invite has specific email, verify it matches
    if (invite.email && invite.email.toLowerCase() !== acceptInviteDto.email.toLowerCase()) {
      throw new BadRequestException('Email does not match the invite');
    }

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email: acceptInviteDto.email }).exec();
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Verify company exists
    const company = await this.companyModel.findById(invite.companyId).exec();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Create user
    const hashedPassword = await bcrypt.hash(acceptInviteDto.password, 10);
    const user = await this.userModel.create({
      email: acceptInviteDto.email,
      password: hashedPassword,
      name: acceptInviteDto.name,
      role: invite.role as UserRole,
      companyId: invite.companyId.toString(),
      orgId: invite.companyId.toString(), // Backward compatibility
      createdBy: invite.createdBy,
      isActive: true,
    });

    // Update company users array
    company.users.push(user._id as any);
    if (invite.role === 'manager') {
      company.managers.push(user._id as any);
    }
    await company.save();

    // Mark invite as used
    invite.isUsed = true;
    invite.usedBy = user._id as any;
    invite.usedAt = new Date();
    await invite.save();

    // Return user without password
    const userObj: any = user.toObject();
    delete userObj.password;

    return {
      user: userObj,
      company: {
        _id: company._id,
        name: company.name,
        domain: company.domain,
      },
    };
  }

  /**
   * Get all invites for a company (Company Admin only)
   */
  async getCompanyInvites(companyId: string, requestUserId: string, requestUserRole: UserRole) {
    // Verify access
    if (requestUserRole !== UserRole.COMPANY_ADMIN && requestUserRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only company admins can view invites');
    }

    const user = await this.userModel.findById(requestUserId).exec();
    if (requestUserRole === UserRole.COMPANY_ADMIN && user?.companyId?.toString() !== companyId) {
      throw new ForbiddenException('You can only view invites for your own company');
    }

    const invites = await this.inviteModel
      .find({ companyId }) // Get all invites, not just active ones
      .populate('createdBy', 'name email')
      .populate('usedBy', 'name email')
      .sort({ createdAt: -1 })
      .exec();

    // Add invite links to each invite
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3100';
    const invitesWithLinks = invites.map((invite: any) => {
      const inviteObj = invite.toObject ? invite.toObject() : invite;
      return {
        ...inviteObj,
        inviteLink: `${frontendUrl}/register?token=${inviteObj.token}`,
      };
    });

    return invitesWithLinks;
  }

  /**
   * Revoke an invite (Company Admin only)
   */
  async revokeInvite(inviteId: string, companyId: string, requestUserId: string, requestUserRole: UserRole) {
    // Verify access
    if (requestUserRole !== UserRole.COMPANY_ADMIN && requestUserRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only company admins can revoke invites');
    }

    const user = await this.userModel.findById(requestUserId).exec();
    if (requestUserRole === UserRole.COMPANY_ADMIN && user?.companyId?.toString() !== companyId) {
      throw new ForbiddenException('You can only revoke invites for your own company');
    }

    const invite = await this.inviteModel.findById(inviteId).exec();
    if (!invite || invite.companyId.toString() !== companyId) {
      throw new NotFoundException('Invite not found');
    }

    // Allow deleting used invites (just mark as inactive for history)
    // The user who used it will remain, but the invite will be marked as inactive
    invite.isActive = false;
    await invite.save();

    return { message: 'Invite revoked successfully' };
  }
}

