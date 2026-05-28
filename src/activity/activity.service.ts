  import { Injectable } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import {
    UserActivity,
    ActivityAction,
    SupportMessage,
    ProblemReport,
  } from './user-activity.entity';

  @Injectable()
  export class ActivityService {
    constructor(
      @InjectRepository(UserActivity)
      private repo: Repository<UserActivity>,

      @InjectRepository(SupportMessage)
      private supportRepo: Repository<SupportMessage>,

      @InjectRepository(ProblemReport)
      private reportRepo: Repository<ProblemReport>,
    ) {}

    // ── Activity ──────────────────────────────────────────────────────────────

    async log(
      userId: number,
      action: ActivityAction,
      resourceTitle?: string,
      metadata?: Record<string, any>,
    ) {
      const activity = this.repo.create({ userId, action, resourceTitle, metadata });
      return this.repo.save(activity);
    }

    async getMyActivity(userId: number) {
      return this.repo.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: 20,
      });
    }

    async getMyStats(userId: number) {
      const result = await this.repo
        .createQueryBuilder('a')
        .select('a.action', 'action')
        .addSelect('COUNT(*)', 'count')
        .where('a.userId = :userId', { userId })
        .groupBy('a.action')
        .getRawMany();

      const counts = Object.fromEntries(result.map(r => [r.action, parseInt(r.count)]));

      // For average score, only fetch quiz attempts
      const quizStats = await this.repo
        .createQueryBuilder('a')
        .select('AVG((a.metadata->>\'percentage\')::numeric)', 'avg')
        .where('a.userId = :userId AND a.action = :action', {
          userId,
          action: ActivityAction.QUIZ_COMPLETED,
        })
        .getRawOne();

      return {
        downloads: counts[ActivityAction.DOWNLOAD] ?? 0,
        quizzesCount: counts[ActivityAction.QUIZ_COMPLETED] ?? 0,
        pastPapers: counts[ActivityAction.RESOURCE_VIEWED] ?? 0,
        averageScore: Math.round(Number(quizStats?.avg ?? 0)),
      };
    }

    // ── Support ───────────────────────────────────────────────────────────────

    async sendSupportMessage(
      senderId: number,
      subject: string,
      message: string,
    ) {
      const msg = this.supportRepo.create({ senderId, subject, message });
      return this.supportRepo.save(msg);
    }

    async submitProblemReport(
      reporterId: number,
      description: string,
      category: string,
    ) {
      const report = this.reportRepo.create({ reporterId, description, category });
      return this.reportRepo.save(report);
    }

    // Admin helpers (optional — useful later)
    async getAllSupportMessages() {
      return this.supportRepo.find({
        order: { createdAt: 'DESC' },
        relations: ['sender'],
      });
    }

    async getAllProblemReports() {
      return this.reportRepo.find({
        order: { createdAt: 'DESC' },
        relations: ['reporter'],
      });
    }
  }