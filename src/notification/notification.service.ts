import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private repo: Repository<Notification>,
  ) {}

  async create(
    title: string,
    message: string,
    type: NotificationType,
    recipientId?: number,
    meta?: Record<string, any>,
  ): Promise<Notification> {
    const notif = this.repo.create({
      title,
      message,
      type,
      recipientId: recipientId ?? null, // ✅ ensure nullable matches entity
      meta: meta ?? null,               // ✅ same here
    });

    return await this.repo.save(notif); // ✅ always await
  }

  async findForAdmin(adminId: number): Promise<Notification[]> {
    return this.repo
      .createQueryBuilder('n')
      .where('n.recipientId = :id OR n.recipientId IS NULL', { id: adminId })
      .orderBy('n.createdAt', 'DESC')
      .take(50)
      .getMany();
  }

  async countUnread(adminId: number): Promise<number> {
    return this.repo
      .createQueryBuilder('n')
      .where('(n.recipientId = :id OR n.recipientId IS NULL)', { id: adminId })
      .andWhere('n.isRead = false')
      .getCount();
  }

  async markRead(id: string, adminId: number): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true })
      .where('id = :id AND (recipientId = :adminId OR recipientId IS NULL)', {
        id,
        adminId,
      })
      .execute();
  }

  async markAllRead(adminId: number): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true })
      .where(
        '(recipientId = :adminId OR recipientId IS NULL) AND isRead = false',
        { adminId },
      )
      .execute();
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}