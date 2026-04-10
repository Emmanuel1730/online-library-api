import { Injectable, BadRequestException } from '@nestjs/common';
import Groq from 'groq-sdk';

@Injectable()
export class QuizzesService {
  private groq: Groq;

  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  async generateQuiz(subject: string, level: string, topic: string) {
    if (!subject || !level || !topic) {
      throw new BadRequestException('subject, level, and topic are required');
    }

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

      const raw = completion.choices[0]?.message?.content ?? '';

      // Extract JSON array robustly — find first [ and last ]
      const start = raw.indexOf('[');
      const end   = raw.lastIndexOf(']');

      if (start === -1 || end === -1 || end < start) {
        throw new BadRequestException('Failed to parse quiz questions from AI response');
      }

      const cleaned = raw.slice(start, end + 1).trim();

      let questions;
      try {
        questions = JSON.parse(cleaned);
      } catch {
        throw new BadRequestException('Failed to parse quiz questions from AI response');
      }

      if (!Array.isArray(questions) || questions.length === 0) {
        throw new BadRequestException('Invalid quiz format returned from AI');
      }

      return { questions, subject, level, topic };

    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(`Groq API error: ${err.message}`);
    }
  }
}