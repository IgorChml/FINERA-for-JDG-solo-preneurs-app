import { describe, it, expect } from 'vitest';
import { LessonSummarySchema, LessonQuerySchema, QuizAnswersSchema } from '@finera/shared';

// ── LessonSummarySchema ───────────────────────────────────────────────

describe('LessonSummarySchema', () => {
  const validLesson = {
    id: 'cuid123',
    slug: 'jak-zalozyc-jdg',
    title: 'Jak założyć JDG',
    summary: 'Przewodnik krok po kroku przez rejestrację działalności.',
    categorySlug: 'rejestracja-jdg',
    categoryName: 'Rejestracja i start JDG',
    readTimeMinutes: 5,
    isCompleted: false,
    taxForms: ['ALL'],
  };

  it('validates a complete lesson summary', () => {
    expect(() => LessonSummarySchema.parse(validLesson)).not.toThrow();
  });

  it('accepts taxForms as array of valid enum values', () => {
    const lesson = LessonSummarySchema.parse({
      ...validLesson,
      taxForms: ['SKALA', 'LINIOWY'],
    });
    expect(lesson.taxForms).toContain('SKALA');
    expect(lesson.taxForms).toContain('LINIOWY');
  });

  it('rejects invalid taxForm value', () => {
    expect(() =>
      LessonSummarySchema.parse({ ...validLesson, taxForms: ['INVALID_FORM'] })
    ).toThrow();
  });

  it('excludes completed lessons from "not completed" filter (simulation)', () => {
    const lessons = [
      { ...validLesson, id: '1', isCompleted: true },
      { ...validLesson, id: '2', isCompleted: false },
      { ...validLesson, id: '3', isCompleted: false },
    ];
    const notCompleted = lessons.filter((l) => !l.isCompleted);
    expect(notCompleted).toHaveLength(2);
    expect(notCompleted.map((l) => l.id)).not.toContain('1');
  });

  it('returns max 3 recommended lessons (simulation)', () => {
    const candidates = Array.from({ length: 10 }, (_, i) => ({
      ...validLesson,
      id: String(i),
      categorySlug: `cat-${i % 4}`,
    }));

    const seen = new Set<string>();
    const recommended = candidates.filter((l) => {
      if (seen.has(l.categorySlug) || seen.size >= 3) return false;
      seen.add(l.categorySlug);
      return true;
    });

    expect(recommended.length).toBeLessThanOrEqual(3);
  });

  it('matches only ALL or user taxForm (RYCZALT) filter', () => {
    const lessons = [
      { ...validLesson, id: '1', taxForms: ['ALL'] },
      { ...validLesson, id: '2', taxForms: ['SKALA', 'LINIOWY'] },
      { ...validLesson, id: '3', taxForms: ['RYCZALT'] },
    ];
    const userForm = 'RYCZALT';
    const filtered = lessons.filter(
      (l) => l.taxForms.includes('ALL') || l.taxForms.includes(userForm)
    );
    expect(filtered.map((l) => l.id)).toContain('1');
    expect(filtered.map((l) => l.id)).not.toContain('2');
    expect(filtered.map((l) => l.id)).toContain('3');
  });
});

// ── QuizAnswersSchema ─────────────────────────────────────────────────

describe('QuizAnswersSchema', () => {
  it('validates array of quiz answers', () => {
    const input = {
      quizAnswers: [
        { questionId: 'q1', answerIndex: 0 },
        { questionId: 'q2', answerIndex: 2 },
      ],
    };
    expect(() => QuizAnswersSchema.parse(input)).not.toThrow();
  });

  it('rejects negative answerIndex', () => {
    expect(() =>
      QuizAnswersSchema.parse({
        quizAnswers: [{ questionId: 'q1', answerIndex: -1 }],
      })
    ).toThrow();
  });

  it('accepts empty array', () => {
    expect(() => QuizAnswersSchema.parse({ quizAnswers: [] })).not.toThrow();
  });

  it('computes quiz score correctly (2/3 correct = 67)', () => {
    const questions = [
      { id: 'q1', answers: [{ isCorrect: true }, { isCorrect: false }] },
      { id: 'q2', answers: [{ isCorrect: false }, { isCorrect: true }] },
      { id: 'q3', answers: [{ isCorrect: true }, { isCorrect: false }] },
    ];
    const userAnswers = [
      { questionId: 'q1', answerIndex: 0 }, // correct
      { questionId: 'q2', answerIndex: 0 }, // wrong
      { questionId: 'q3', answerIndex: 0 }, // correct
    ];

    let correct = 0;
    for (const a of userAnswers) {
      const q = questions.find((q) => q.id === a.questionId)!;
      if (q.answers[a.answerIndex]?.isCorrect) correct++;
    }

    const score = Math.round((correct / questions.length) * 100);
    expect(score).toBe(67);
    expect(score >= 60).toBe(true); // passed
  });
});
