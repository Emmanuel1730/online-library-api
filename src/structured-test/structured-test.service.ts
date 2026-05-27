import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StructuredTest, TestSubmission, TestStatus, SubmissionStatus } from './structured-test.entity';
import Groq from 'groq-sdk';

@Injectable()
export class StructuredTestService {
  private groq: Groq;

  constructor(
    @InjectRepository(StructuredTest)
    private testRepo: Repository<StructuredTest>,
    @InjectRepository(TestSubmission)
    private subRepo: Repository<TestSubmission>,
  ) {
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }

  // ── Generate structured questions ────────────────────────────────
  async generateQuestions(subject: string, form: string, topic: string, count: number) {
    const prompt = `You are an experienced secondary school examiner in Malawi.
Generate exactly ${count} structured exam questions for ${form} students studying ${subject} on the topic: "${topic}".

Each question should require a written answer (not multiple choice). Mix short-answer (2-4 marks) and longer structured questions (5-10 marks).

Respond ONLY with a valid JSON array. No markdown, no explanation.

Format:
[
  {
    "id": "q1",
    "text": "Full question text here",
    "marks": 4,
    "type": "short",
    "markingGuidance": "Key points the answer must include: (1) ... (2) ... (3) ..."
  }
]

Types: "short" for 1-4 marks, "structured" for 5-8 marks, "long" for 9+ marks.
Total marks across all questions should sum to between 40 and 60.
Make the questions progressively harder.`;

    const completion = await this.groq.chat.completions.create({
      model: 'qwen/qwen3-32b',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_completion_tokens: 4096,
      stream: false,
    });

    const raw   = completion.choices[0]?.message?.content ?? '';
    const start = raw.indexOf('[');
    const end   = raw.lastIndexOf(']');
    if (start === -1 || end === -1) throw new BadRequestException('Failed to parse questions from AI');

    let questions;
    try { questions = JSON.parse(raw.slice(start, end + 1).trim()); }
    catch { throw new BadRequestException('Failed to parse questions from AI'); }

    return { questions, subject, form, topic };
  }

  // ── Create test ───────────────────────────────────────────────────
  async create(dto: any, user: any) {
    const totalMarks = (dto.questions ?? []).reduce((s: number, q: any) => s + (q.marks ?? 0), 0);
    const test = this.testRepo.create({
      title:        dto.title,
      subject:      dto.subject,
      form:         dto.form,
      duration:     dto.duration,
      instructions: dto.instructions,
      questions:    dto.questions ?? [],
      status:       dto.status ?? TestStatus.DRAFT,
      totalMarks,
      createdById:  user.id,
      schoolId:     user.schoolId ?? null,
    });
    return this.testRepo.save(test);
  }

  // ── Update test ───────────────────────────────────────────────────
  async update(id: string, dto: any, user: any) {
    const test = await this.testRepo.findOne({ where: { id } });
    if (!test) throw new NotFoundException('Test not found');
    if (test.createdById !== user.id && user.role !== 'ADMIN')
      throw new ForbiddenException('Not allowed');

    if (dto.questions) {
      dto.totalMarks = dto.questions.reduce((s: number, q: any) => s + (q.marks ?? 0), 0);
    }

    Object.assign(test, dto);
    return this.testRepo.save(test);
  }

  // ── Remove test ───────────────────────────────────────────────────
  async remove(id: string, user: any) {
    const test = await this.testRepo.findOne({ where: { id } });
    if (!test) throw new NotFoundException('Test not found');
    if (test.createdById !== user.id && user.role !== 'ADMIN')
      throw new ForbiddenException('Not allowed');
    await this.testRepo.delete(id);
    return { message: 'Deleted', id };
  }

  // ── Teacher: their own tests ──────────────────────────────────────
  async getMyTests(userId: number) {
    return this.testRepo.find({
      where: { createdById: userId },
      order: { createdAt: 'DESC' },
    });
  }

  // ── Student: available published tests ───────────────────────────
  async getAvailableTests(schoolId: string | null) {
    const qb = this.testRepo.createQueryBuilder('t')
      .where('t.status = :s', { s: TestStatus.PUBLISHED });
    if (schoolId) {
      qb.andWhere('(t.schoolId = :sid OR t.schoolId IS NULL)', { sid: schoolId });
    }
    return qb.orderBy('t.createdAt', 'DESC').getMany();
  }

  // ── Get one (strips markingGuidance for students) ─────────────────
  async getOne(id: string) {
    const test = await this.testRepo.findOne({ where: { id } });
    if (!test) throw new NotFoundException('Test not found');
    return test;
  }

  // ── Student: submit answers ───────────────────────────────────────
  async submit(
    testId: string,
    answers: { questionId: string; answer: string }[],
    studentId: number,
  ) {
    const test = await this.testRepo.findOne({ where: { id: testId } });
    if (!test) throw new NotFoundException('Test not found');
    if (test.status !== TestStatus.PUBLISHED)
      throw new BadRequestException('This test is not open for submission');

    const existing = await this.subRepo.findOne({ where: { testId, studentId } });
    if (existing) throw new BadRequestException('You have already submitted this test');

    const submission = this.subRepo.create({ testId, studentId, answers, status: SubmissionStatus.SUBMITTED });
    return this.subRepo.save(submission);
  }

  // ── Teacher: get submissions for a test ──────────────────────────
  async getSubmissions(testId: string) {
    return this.subRepo.find({
      where: { testId },
      relations: ['student'],
      order: { submittedAt: 'DESC' },
    });
  }

  // ── Teacher: AI mark a submission ────────────────────────────────
  async aiMarkSubmission(submissionId: string) {
    const sub = await this.subRepo.findOne({
      where: { id: submissionId },
      relations: ['test'],
    });
    if (!sub) throw new NotFoundException('Submission not found');

    const test = sub.test;
    const markingData = test.questions.map(q => {
      const studentAnswer = sub.answers.find(a => a.questionId === q.id)?.answer ?? '(no answer)';
      return { question: q, studentAnswer };
    });

    const prompt = `You are an experienced secondary school examiner in Malawi marking a ${test.subject} test (${test.form}) on ${test.title}.

For each question below, assess the student's answer and suggest a mark.

${markingData.map((d, i) => `
QUESTION ${i + 1} (${d.question.id}) — ${d.question.marks} marks
Question: ${d.question.text}
Marking guidance: ${d.question.markingGuidance ?? 'Use your judgment'}
Student answer: ${d.studentAnswer}
`).join('\n---\n')}

Respond ONLY with a valid JSON array. No markdown, no explanation.

[
  {
    "questionId": "q1",
    "suggestedMark": 3,
    "maxMark": 4,
    "feedback": "Good explanation of X, but missed Y. Could improve by Z.",
    "confidence": "high"
  }
]

confidence: "high" if answer clearly matches/doesn't match guidance, "medium" if partially matches, "low" if ambiguous.
Be fair but strict. Partial credit where warranted. Sum of suggestedMarks must not exceed total marks.`;

    const completion = await this.groq.chat.completions.create({
      model: 'qwen/qwen3-32b',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_completion_tokens: 4096,
      stream: false,
    });

    const raw   = completion.choices[0]?.message?.content ?? '';
    const start = raw.indexOf('[');
    const end   = raw.lastIndexOf(']');
    if (start === -1 || end === -1) throw new BadRequestException('AI marking failed');

    let aiMarking;
    try { aiMarking = JSON.parse(raw.slice(start, end + 1).trim()); }
    catch { throw new BadRequestException('AI marking response could not be parsed'); }

    sub.aiMarking = aiMarking;
    return this.subRepo.save(sub);
  }

  // ── Teacher: save final marks after reviewing AI suggestions ─────
  async saveFinalMarks(
    submissionId: string,
    dto: { finalMarks: { questionId: string; mark: number; feedback: string }[]; teacherComment?: string },
  ) {
    const sub = await this.subRepo.findOne({
      where: { id: submissionId },
      relations: ['test'],
    });
    if (!sub) throw new NotFoundException('Submission not found');

    const totalScore = dto.finalMarks.reduce((s, m) => s + (m.mark ?? 0), 0);
    const percentage = sub.test?.totalMarks
      ? Math.round((totalScore / sub.test.totalMarks) * 100)
      : 0;

    sub.finalMarks    = dto.finalMarks;
    sub.teacherComment = dto.teacherComment ?? null;
    sub.totalScore    = totalScore;
    sub.percentage    = percentage;
    sub.status        = SubmissionStatus.MARKED;

    return this.subRepo.save(sub);
  }

  // ── Student: view their result ────────────────────────────────────
  async getMyResult(testId: string, studentId: number) {
    const sub = await this.subRepo.findOne({
      where: { testId, studentId },
      relations: ['test'],
    });
    if (!sub) throw new NotFoundException('No submission found');
    return sub;
  }
}