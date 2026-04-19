import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz, QuizVisibility } from './quizzes.entity';
import { QuizAttempt, QuizSource } from './quizzes-attempt.entity';
import Groq from 'groq-sdk';

@Injectable()
export class QuizzesService {
  private groq: Groq;

  constructor(
    @InjectRepository(Quiz)
    private repo: Repository<Quiz>,
    @InjectRepository(QuizAttempt)
    private attemptRepo: Repository<QuizAttempt>,
  ) {
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }

  // ── AI Generation ─────────────────────────────────────────────────────────
  async generateQuiz(subject: string, level: string, topic: string) {
    if (!subject || !level || !topic)
      throw new BadRequestException('subject, level, and topic are required');

    const prompt = `Generate exactly 10 multiple choice quiz questions for a ${level} student in Malawi studying ${subject}, specifically on the topic: "${topic}".

Respond ONLY with a valid JSON array. No explanation, no markdown, no extra text — just the raw JSON array.

Format:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0
  }
]

Rules:
- Each question must have exactly 4 options
- "correct" is the zero-based index of the correct option
- Questions must be appropriate for ${level} level
- All 10 questions must be on the topic: ${topic}
- Return exactly 10 questions`;

    try {
      const completion = await this.groq.chat.completions.create({
        model: 'qwen/qwen3-32b',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_completion_tokens: 4096,
        top_p: 0.95,
        stream: false,
        stop: null,
      });

      const raw   = completion.choices[0]?.message?.content ?? '';
      const start = raw.indexOf('[');
      const end   = raw.lastIndexOf(']');
      if (start === -1 || end === -1 || end < start)
        throw new BadRequestException('Failed to parse quiz questions from AI response');

      let questions;
      try { questions = JSON.parse(raw.slice(start, end + 1).trim()); }
      catch { throw new BadRequestException('Failed to parse quiz questions from AI response'); }

      if (!Array.isArray(questions) || questions.length === 0)
        throw new BadRequestException('Invalid quiz format returned from AI');

      return { questions, subject, level, topic };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(`Groq API error: ${err.message}`);
    }
  }

  // ── Teacher Quiz CRUD ─────────────────────────────────────────────────────
  async create(dto: any, userId: number) {
    const quiz = this.repo.create({
      title:       dto.title,
      subject:     dto.subject,
      form:        dto.form,
      duration:    dto.duration,
      description: dto.description,
      mode:        dto.mode ?? 'online',
      visibility:  dto.visibility ?? QuizVisibility.PUBLIC,
      schoolId:    dto.visibility === QuizVisibility.PRIVATE ? dto.schoolId : null,
      questions:   dto.questions ?? [],
      status:      dto.status ?? 'published',
      createdById: userId,
    });
    return this.repo.save(quiz);
  }

  async findMyQuizzes(userId: number) {
    return this.repo.find({
      where: { createdById: userId },
      order: { createdAt: 'DESC' },
    });
  }

  // Students: see public quizzes + private quizzes from their school
  async findForStudent(schoolId: string | null) {
    const qb = this.repo.createQueryBuilder('quiz')
      .where('quiz.status = :status', { status: 'published' })
      .andWhere('quiz.mode = :mode', { mode: 'online' })
      .orderBy('quiz.createdAt', 'DESC');

    if (schoolId) {
      qb.andWhere(
        '(quiz.visibility = :pub OR (quiz.visibility = :priv AND quiz.schoolId = :schoolId))',
        { pub: QuizVisibility.PUBLIC, priv: QuizVisibility.PRIVATE, schoolId }
      );
    } else {
      qb.andWhere('quiz.visibility = :pub', { pub: QuizVisibility.PUBLIC });
    }

    return qb.getMany();
  }

  // All published quizzes (for offline download — any visibility)
  async findOfflineForStudent(schoolId: string | null) {
    const qb = this.repo.createQueryBuilder('quiz')
      .where('quiz.status = :status', { status: 'published' })
      .andWhere('quiz.mode = :mode', { mode: 'offline' })
      .orderBy('quiz.createdAt', 'DESC');

    if (schoolId) {
      qb.andWhere(
        '(quiz.visibility = :pub OR (quiz.visibility = :priv AND quiz.schoolId = :schoolId))',
        { pub: QuizVisibility.PUBLIC, priv: QuizVisibility.PRIVATE, schoolId }
      );
    } else {
      qb.andWhere('quiz.visibility = :pub', { pub: QuizVisibility.PUBLIC });
    }

    return qb.getMany();
  }

  async findOne(id: string) {
    const quiz = await this.repo.findOne({ where: { id } });
    if (!quiz) throw new NotFoundException('Quiz not found');
    return quiz;
  }

  async update(id: string, dto: any, userId: number) {
    const quiz = await this.repo.findOne({ where: { id, createdById: userId } });
    if (!quiz) throw new NotFoundException('Quiz not found');
    Object.assign(quiz, dto);
    return this.repo.save(quiz);
  }

  async remove(id: string, userId: number) {
    const quiz = await this.repo.findOne({ where: { id, createdById: userId } });
    if (!quiz) throw new NotFoundException('Quiz not found');
    await this.repo.remove(quiz);
    return { message: 'Quiz deleted', id };
  }

  // ── Quiz Attempts ─────────────────────────────────────────────────────────
  async saveAttempt(dto: any, studentId: number) {
    const attempt = this.attemptRepo.create({
      studentId,
      source:     dto.source ?? QuizSource.AI,
      quizId:     dto.quizId ?? null,
      subject:    dto.subject,
      topic:      dto.topic,
      level:      dto.level,
      score:      dto.score,
      total:      dto.total,
      percentage: dto.percentage,
      answers:    dto.answers,
      questions:  dto.questions,
    });
    return this.attemptRepo.save(attempt);
  }

  async getMyAttempts(studentId: number) {
    return this.attemptRepo.find({
      where: { studentId },
      order: { completedAt: 'DESC' },
      take: 50,
    });
  }

  async getAttemptStats(studentId: number) {
    const all = await this.attemptRepo.find({ where: { studentId } });
    const total    = all.length;
    const avgScore = total > 0
      ? Math.round(all.reduce((s, a) => s + a.percentage, 0) / total)
      : 0;
    const aiCount  = all.filter((a) => a.source === QuizSource.AI).length;
    const teacherCount = all.filter((a) => a.source === QuizSource.TEACHER).length;
    return { total, avgScore, aiCount, teacherCount };
  }

  async findAll() {
  return this.repo.find({
    relations: ['createdBy'],
    order: { createdAt: 'DESC' },
  });
}
 
/** Admin: get all AI + teacher quiz attempts */
async getAllAttempts() {
  return this.attemptRepo.find({
    relations: ['student'],
    order: { completedAt: 'DESC' },
    take: 200,
  });
}
 
/** Admin: hard-delete any quiz */
async adminRemove(id: string) {
  const quiz = await this.repo.findOne({ where: { id } });
  if (!quiz) throw new NotFoundException('Quiz not found');
  await this.repo.remove(quiz);
  return { message: 'Quiz deleted', id };
}
}