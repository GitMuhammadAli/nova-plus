import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { CreateUploadDto } from './dto/create-upload.dto';
import { UpdateUploadDto } from './dto/update-upload.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  /**
   * Upload file
   * POST /uploads
   */
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
    @Body() createUploadDto?: CreateUploadDto,
  ) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    const userId = req.user._id?.toString() || req.user.id;

    if (!companyId) {
      throw new Error('Company ID not found in user session');
    }

    const upload = await this.uploadsService.uploadFile(
      file,
      companyId,
      userId,
      createUploadDto,
    );
    return {
      success: true,
      data: upload,
    };
  }

  /**
   * Get all uploads
   * GET /uploads
   */
  @Get()
  async findAll(
    @Req() req: any,
    @Query('category') category?: string,
    @Query('isPublic') isPublic?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    const result = await this.uploadsService.findAll(companyId, {
      category,
      isPublic:
        isPublic === 'true' ? true : isPublic === 'false' ? false : undefined,
      search,
      limit: limit ? parseInt(limit) : undefined,
      page: page ? parseInt(page) : undefined,
    });

    return {
      success: true,
      data: result.uploads,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  /**
   * Get upload by ID
   * GET /uploads/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    const upload = await this.uploadsService.findOne(id, companyId);
    return {
      success: true,
      data: upload,
    };
  }

  /**
   * Update upload
   * PATCH /uploads/:id
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUploadDto: UpdateUploadDto,
    @Req() req: any,
  ) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    const userId = req.user._id?.toString() || req.user.id;
    const upload = await this.uploadsService.update(
      id,
      updateUploadDto,
      companyId,
      userId,
    );
    return {
      success: true,
      data: upload,
    };
  }

  /**
   * Delete upload
   * DELETE /uploads/:id
   */
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    const userId = req.user._id?.toString() || req.user.id;
    await this.uploadsService.remove(id, companyId, userId);
    return {
      success: true,
      message: 'Upload deleted successfully',
    };
  }

  /**
   * Make upload public
   * POST /uploads/:id/make-public
   */
  @Post(':id/make-public')
  async makePublic(@Param('id') id: string, @Req() req: any) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    const userId = req.user._id?.toString() || req.user.id;
    const upload = await this.uploadsService.makePublic(id, companyId, userId);
    return {
      success: true,
      data: upload,
    };
  }

  /**
   * Generate signed upload URL
   * POST /uploads/signed-url
   */
  @Post('signed-url')
  async generateSignedUploadUrl(
    @Body() body: { folder?: string; expiresIn?: number },
    @Req() req: any,
  ) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    const result = await this.uploadsService.generateSignedUploadUrl(
      companyId,
      body.folder,
      body.expiresIn,
    );
    return {
      success: true,
      data: result,
    };
  }
}
