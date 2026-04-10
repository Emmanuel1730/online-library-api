import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserActivity, ActivityAction } from './user-activity.entity';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(UserActivity)
    private repo: Repository<UserActivity>,
  ) {}

  async log(userId: number, action: ActivityAction, resourceTitle?: string, metadata?: Record<string, any>) {
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

    const downloads      = all.filter((a) => a.action === ActivityAction.DOWNLOAD).length;
    const quizzes        = all.filter((a) => a.action === ActivityAction.QUIZ_COMPLETED);
    const quizzesCount   = quizzes.length;
    const pastPapers     = all.filter((a) => a.action === ActivityAction.RESOURCE_VIEWED).length;

    const averageScore = quizzesCount > 0
      ? Math.round(
          quizzes.reduce((sum, q) => {
            const pct = q.metadata?.percentage ?? 0;
            return sum + pct;
          }, 0) / quizzesCount
        )
      : 0;

    return { downloads, quizzesCount, pastPapers, averageScore };
  }
}