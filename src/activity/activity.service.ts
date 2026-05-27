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
      const all = await this.repo.find({ where: { userId } });

      const downloads    = all.filter((a) => a.action === ActivityAction.DOWNLOAD).length;
      const quizzes      = all.filter((a) => a.action === ActivityAction.QUIZ_COMPLETED);
      const quizzesCount = quizzes.length;
      const pastPapers   = all.filter((a) => a.action === ActivityAction.RESOURCE_VIEWED).length;

      const averageScore =
        quizzesCount > 0
          ? Math.round(
              quizzes.reduce((sum, q) => sum + (q.metadata?.percentage ?? 0), 0) /
                quizzesCount,
            )
          : 0;

      return { downloads, quizzesCount, pastPapers, averageScore };
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