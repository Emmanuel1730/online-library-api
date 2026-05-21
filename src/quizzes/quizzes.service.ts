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

  // FIX 1: exclude 'ai-saved' quizzes so they don't appear in teacher's quiz list
  async findMyQuizzes(userId: number) {
    return this.repo
      .createQueryBuilder('quiz')
      .where('quiz.createdById = :userId', { userId })
      .andWhere('quiz.status != :aiStatus', { aiStatus: 'ai-saved' })
      .orderBy('quiz.createdAt', 'DESC')
      .getMany();
  }

  // Students: see public quizzes + private quizzes from their school
  // Also excludes 'ai-saved' quizzes from student browse
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
    const aiCount      = all.filter((a) => a.source === QuizSource.AI).length;
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

  // ── Save AI Quiz to DB ────────────────────────────────────────────────────
  // FIX 2: use status 'ai-saved' so it never bleeds into teacher quiz lists
  async saveAIQuiz(dto: any, userId: number) {
    const quiz = this.repo.create({
      title:       dto.topic ?? 'AI Quiz',
      subject:     dto.subject,
      form:        dto.level,
      duration:    '30 min',
      description: `AI-generated quiz on ${dto.topic}`,
      mode:        'online',
      visibility:  QuizVisibility.PUBLIC,
      questions:   (dto.questions ?? []).map((q: any, i: number) => ({
        id:      `${i}`,
        text:    q.question ?? q.text,
        options: q.options,
        answer:  q.correct ?? q.answer ?? 0,
      })),
      status:      'ai-saved',   // ← was 'published', now 'ai-saved'
      createdById: userId,
    });
    return this.repo.save(quiz);
  }

  // ── Get saved AI quizzes for a student ───────────────────────────────────
  // Matches both 'ai-saved' (new) and old records saved as 'published' by the
  // same student that have an AI-style description, using an OR query.
  async getSavedAIQuizzes(userId: number) {
    return this.repo
      .createQueryBuilder('quiz')
      .where('quiz.createdById = :userId', { userId })
      .andWhere(
        "(quiz.status = 'ai-saved' OR (quiz.status = 'published' AND quiz.description LIKE :prefix))",
        { prefix: 'AI-generated quiz on%' }
      )
      .orderBy('quiz.createdAt', 'DESC')
      .getMany();
  }

  // ── Teacher dashboard stats ───────────────────────────────────────────────
  async getTeacherStats(teacherId: number) {
    const myQuizzes = await this.repo.find({
      where: { createdById: teacherId },
      select: ['id'],
    });
    const myQuizIds = myQuizzes.map(q => q.id);

    let attempts: QuizAttempt[] = [];
    if (myQuizIds.length > 0) {
      attempts = await this.attemptRepo
        .createQueryBuilder('a')
        .leftJoinAndSelect('a.student', 'student')
        .where('a.quizId IN (:...ids)', { ids: myQuizIds })
        .getMany();
    }

    const uniqueStudents = new Set(attempts.map(a => a.studentId));
    const avgScore = attempts.length > 0
      ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length)
      : 0;

    return {
      totalStudents: uniqueStudents.size,
      avgScore,
      totalAttempts: attempts.length,
    };
  }

  // ── Teacher: attempts for their quizzes + AI attempts from same-school students ──
  // FIX 4: also include AI attempts (quizId = null) from students at the teacher's school
  async getTeacherQuizAttempts(teacherId: number) {
    // Step 1: get teacher's own quiz IDs
    const myQuizzes = await this.repo.find({
      where: { createdById: teacherId },
      select: ['id'],
    });
    const myQuizIds = myQuizzes.map(q => q.id);

    // Step 2: get teacher's schoolId from their profile
    // We can derive this by looking at their own attempts or from a Profile join.
    // Simplest: pull it from the student relation on any of their quiz attempts.
    // But teachers may not have attempts — so query the Profile table directly.
    const teacherProfile = await this.attemptRepo.manager
      .getRepository('Profile')
      .findOne({ where: { id: teacherId }, relations: ['school'] })
      .catch(() => null);

    const teacherSchoolId: string | null = teacherProfile?.school?.id ?? teacherProfile?.schoolId ?? null;

    // Step 3: build the query
    // Include: (a) attempts on teacher's quizzes OR (b) AI attempts from same-school students
    const qb = this.attemptRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.student', 'student')
      .leftJoinAndSelect('student.school', 'school')
      .orderBy('a.completedAt', 'DESC')
      .take(500);

    if (myQuizIds.length > 0 && teacherSchoolId) {
      qb.where(
        '(a.quizId IN (:...ids)) OR (a.source = :aiSource AND student.schoolId = :schoolId)',
        { ids: myQuizIds, aiSource: QuizSource.AI, schoolId: teacherSchoolId }
      );
    } else if (myQuizIds.length > 0) {
      qb.where('a.quizId IN (:...ids)', { ids: myQuizIds });
    } else if (teacherSchoolId) {
      qb.where('a.source = :aiSource AND student.schoolId = :schoolId',
        { aiSource: QuizSource.AI, schoolId: teacherSchoolId }
      );
    } else {
      // Nothing to scope to — return empty
      return [];
    }

    return qb.getMany();
  }
}