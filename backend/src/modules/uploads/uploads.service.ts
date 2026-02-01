import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Upload, UploadDocument } from './entities/upload.entity';
import { CreateUploadDto } from './dto/create-upload.dto';
import { UpdateUploadDto } from './dto/update-upload.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditResource } from '../audit/entities/audit-log.entity';

@Injectable()
export class UploadsService {
  constructor(
    @InjectModel(Upload.name) private uploadModel: Model<UploadDocument>,
    private configService: ConfigService,
    private auditService: AuditService,
  ) {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Upload file to Cloudinary
   */
  async uploadFile(
    file: Express.Multer.File,
    companyId: string,
    userId: string,
    createUploadDto?: CreateUploadDto,
  ): Promise<UploadDocument> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 50MB limit');
    }

    try {
      // Upload to Cloudinary
      const folder =
        createUploadDto?.folder || `companies/${companyId}/uploads`;
      const uploadResult = await cloudinary.uploader.upload(
        file.buffer.toString('base64'),
        {
          folder,
          resource_type: 'auto',
          use_filename: true,
          unique_filename: true,
        },
      );

      // Generate thumbnail for images
      let thumbnailUrl: string | undefined;
      if (uploadResult.resource_type === 'image') {
        thumbnailUrl = cloudinary.url(uploadResult.public_id, {
          transformation: [
            { width: 300, height: 300, crop: 'fill' },
            { quality: 'auto' },
          ],
        });
      }

      // Calculate expiration date if specified
      let expiresAt: Date | undefined;
      if (createUploadDto?.expiresInDays) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + createUploadDto.expiresInDays);
      }

      // Save upload metadata
      const upload = new this.uploadModel({
        filename: uploadResult.original_filename || file.originalname,
        originalName: file.originalname,
        url: uploadResult.secure_url,
        thumbnailUrl,
        mimeType: file.mimetype,
        size: file.size,
        companyId: new Types.ObjectId(companyId),
        uploadedBy: new Types.ObjectId(userId),
        isPublic: false,
        folder,
        publicId: uploadResult.public_id,
        category: createUploadDto?.category || 'general',
        expiresAt,
        isActive: true,
      });

      const savedUpload = await upload.save();

      // Audit log
      await this.auditService.createLog({
        action: AuditAction.CREATE,
        resource: AuditResource.TASK,
        resourceId:
          (savedUpload._id as any)?.toString() || String(savedUpload._id),
        userId,
        companyId,
        metadata: {
          filename: savedUpload.filename,
          size: savedUpload.size,
          mimeType: savedUpload.mimeType,
        },
      });

      return savedUpload;
    } catch (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Get all uploads for a company
   */
  async findAll(
    companyId: string,
    filters?: {
      category?: string;
      isPublic?: boolean;
      search?: string;
      limit?: number;
      page?: number;
    },
  ): Promise<{
    uploads: UploadDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const query: any = {
      companyId: new Types.ObjectId(companyId),
      isActive: true,
    };

    if (filters?.category) {
      query.category = filters.category;
    }

    if (filters?.isPublic !== undefined) {
      query.isPublic = filters.isPublic;
    }

    if (filters?.search) {
      query.$or = [
        { filename: { $regex: filters.search, $options: 'i' } },
        { originalName: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const limit = filters?.limit || 50;
    const page = filters?.page || 1;
    const skip = (page - 1) * limit;

    const [uploads, total] = await Promise.all([
      this.uploadModel
        .find(query)
        .populate('uploadedBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .exec(),
      this.uploadModel.countDocuments(query).exec(),
    ]);

    return { uploads, total, page, limit };
  }

  /**
   * Get upload by ID
   */
  async findOne(id: string, companyId: string): Promise<UploadDocument> {
    const upload = await this.uploadModel
      .findOne({
        _id: id,
        companyId: new Types.ObjectId(companyId),
      })
      .populate('uploadedBy', 'name email')
      .exec();

    if (!upload) {
      throw new NotFoundException('Upload not found');
    }

    return upload;
  }

  /**
   * Update upload
   */
  async update(
    id: string,
    updateUploadDto: UpdateUploadDto,
    companyId: string,
    userId: string,
  ): Promise<UploadDocument> {
    const upload = await this.findOne(id, companyId);

    // Check permissions (owner or admin)
    const isOwner = upload.uploadedBy.toString() === userId;
    // You might want to check if user is admin here

    if (!isOwner) {
      throw new ForbiddenException(
        'You do not have permission to update this upload',
      );
    }

    Object.assign(upload, updateUploadDto);
    const updated = await upload.save();

    // Audit log
    await this.auditService.createLog({
      action: AuditAction.UPDATE,
      resource: AuditResource.TASK,
      resourceId: id,
      userId,
      companyId,
      metadata: updateUploadDto,
    });

    return updated;
  }

  /**
   * Delete upload
   */
  async remove(id: string, companyId: string, userId: string): Promise<void> {
    const upload = await this.findOne(id, companyId);

    // Check permissions
    const isOwner = upload.uploadedBy.toString() === userId;
    // You might want to check if user is admin here

    if (!isOwner) {
      throw new ForbiddenException(
        'You do not have permission to delete this upload',
      );
    }

    try {
      // Delete from Cloudinary
      if (upload.publicId) {
        await cloudinary.uploader.destroy(upload.publicId);
      }

      // Delete from database
      await this.uploadModel.deleteOne({ _id: id }).exec();

      // Audit log
      await this.auditService.createLog({
        action: AuditAction.DELETE,
        resource: AuditResource.TASK,
        resourceId: id,
        userId,
        companyId,
        metadata: {
          filename: upload.filename,
        },
      });
    } catch (error) {
      throw new BadRequestException(
        `Failed to delete upload: ${error.message}`,
      );
    }
  }

  /**
   * Make upload public
   */
  async makePublic(
    id: string,
    companyId: string,
    userId: string,
  ): Promise<UploadDocument> {
    const upload = await this.findOne(id, companyId);
    upload.isPublic = true;
    const updated = await upload.save();

    // Audit log
    await this.auditService.createLog({
      action: AuditAction.UPDATE,
      resource: AuditResource.TASK,
      resourceId: id,
      userId,
      companyId,
    });

    return updated;
  }

  /**
   * Generate signed upload URL (for direct client-side uploads)
   */
  async generateSignedUploadUrl(
    companyId: string,
    folder?: string,
    expiresIn?: number,
  ): Promise<{
    url: string;
    signature: string;
    timestamp: number;
    publicId: string;
  }> {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const publicId = `companies/${companyId}/uploads/${Date.now()}`;
    const uploadFolder = folder || `companies/${companyId}/uploads`;

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder: uploadFolder,
      },
      this.configService.get<string>('CLOUDINARY_API_SECRET') || '',
    );

    return {
      url: `https://api.cloudinary.com/v1_1/${this.configService.get<string>('CLOUDINARY_CLOUD_NAME')}/auto/upload`,
      signature,
      timestamp,
      publicId,
    };
  }

  /**
   * Cleanup expired uploads (called by worker)
   */
  async cleanupExpiredUploads(): Promise<number> {
    const now = new Date();
    const expiredUploads = await this.uploadModel
      .find({
        expiresAt: { $lte: now },
        isActive: true,
      })
      .exec();

    let deletedCount = 0;

    for (const upload of expiredUploads) {
      try {
        if (upload.publicId) {
          await cloudinary.uploader.destroy(upload.publicId);
        }
        await this.uploadModel.deleteOne({ _id: upload._id }).exec();
        deletedCount++;
      } catch (error) {
        console.error(`Failed to cleanup upload ${upload._id}:`, error);
      }
    }

    return deletedCount;
  }
}
