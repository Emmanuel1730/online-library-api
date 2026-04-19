import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from './request.entity';
import { createClient } from '@supabase/supabase-js';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationType } from 'src/notification/notification.entity';
import { CreateRequestDto } from './create-request.dto';

@Injectable()
export class RequestService {
  private supabase;

  constructor(
    @InjectRepository(Request)
    private requestRepository: Repository<Request>,
    private notificationService: NotificationService,
  ) {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }

  async findAll() {
    return await this.requestRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(createRequestDto: CreateRequestDto, userId: number) {
    const newRequest = this.requestRepository.create({
      requestName: createRequestDto.requestName,
      fromUser:    createRequestDto.fromUser,
      type:        createRequestDto.type,
      description: createRequestDto.description ?? '',
      user:        { id: userId },
    });

    const saved = await this.requestRepository.save(newRequest);

    await this.notificationService.create(
      `New ${createRequestDto.type} Request`,
      `"${createRequestDto.requestName}" submitted by ${createRequestDto.fromUser}`,
      NotificationType.REQUEST_CREATED,
      undefined,
      { requestId: saved.id, type: createRequestDto.type },
    );

    return saved;
  }

  async updateStatus(id: number, status: string) {
    const allowedStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
    const upper = status.toUpperCase();

    if (!allowedStatuses.includes(upper)) {
      throw new BadRequestException('Invalid status update');
    }

    const request = await this.requestRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!request) throw new NotFoundException('Request not found');

    request.status = upper;
    const saved = await this.requestRepository.save(request);

    if (upper === 'APPROVED' && request.type === 'DELETE_RESOURCE') {
      await this.executeApprovedDeletion(request);
    }

    const notifType =
      upper === 'APPROVED'
        ? NotificationType.REQUEST_APPROVED
        : NotificationType.REQUEST_REJECTED;

    if (request.user?.id) {
      await this.notificationService.create(
        `Request ${upper}`,
        `Your request "${request.requestName}" has been ${upper.toLowerCase()}.`,
        notifType,
        request.user.id,
        { requestId: id },
      );
    }

    return saved;
  }

  private async executeApprovedDeletion(request: Request) {
    try {
      if (!request.description) {
        console.warn('[executeApprovedDeletion] No description on request');
        return;
      }

      let parsed: { resourceId?: string; filePath?: string; bucket?: string };
      try {
        parsed = JSON.parse(request.description);
      } catch {
        console.warn('[executeApprovedDeletion] description is not JSON — legacy request, skipping');
        return;
      }

      const { resourceId, filePath, bucket } = parsed;

      // ── Delete from Supabase storage ────────────────────────────────────────
      if (filePath && bucket) {
        // filePath may be a full URL like:
        // https://xxx.supabase.co/storage/v1/object/public/online-library/filename.pdf
        // We only need the path AFTER the bucket name
        let storagePath = filePath;
        const bucketMarker = `/object/public/${bucket}/`;
        if (filePath.includes(bucketMarker)) {
          storagePath = filePath.split(bucketMarker)[1];
        } else if (filePath.includes(`/${bucket}/`)) {
          storagePath = filePath.split(`/${bucket}/`)[1];
        }

        const { error } = await this.supabase.storage
          .from(bucket)
          .remove([storagePath]);

        if (error) {
          console.error('[executeApprovedDeletion] Supabase delete error:', error.message);
        } else {
          console.log('[executeApprovedDeletion] Supabase file deleted:', storagePath);
        }
      }

      // ── Delete from database ─────────────────────────────────────────────────
      if (resourceId) {
        // Delete related uploads first (FK constraint), then the resource
        await this.requestRepository.manager.query(
          `DELETE FROM upload WHERE "resourceId" = $1`,
          [resourceId],
        );
        await this.requestRepository.manager.query(
          `DELETE FROM resource WHERE id = $1`,
          [resourceId],
        );
        console.log('[executeApprovedDeletion] Resource deleted from DB:', resourceId);
      }
    } catch (err) {
      console.error('[executeApprovedDeletion] Unexpected error:', err.message);
    }
  }

  async remove(id: number): Promise<void> {
    await this.requestRepository.delete(id);
  }
}