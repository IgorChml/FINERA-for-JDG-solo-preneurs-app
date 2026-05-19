import { z } from 'zod';

const TaxFormFilterEnum = z.enum(['SKALA', 'LINIOWY', 'RYCZALT', 'ALL']);

export const LessonSummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  categorySlug: z.string(),
  categoryName: z.string(),
  readTimeMinutes: z.number(),
  isCompleted: z.boolean(),
  taxForms: z.array(TaxFormFilterEnum),
});

export const LessonDetailSchema = LessonSummarySchema.extend({
  contentMdx: z.string(),
  legalSource: z.string().nullable(),
  updatedAt: z.string().datetime(),
  quizQuestions: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      answers: z.array(
        z.object({
          text: z.string(),
          isCorrect: z.boolean(),
        })
      ),
      explanation: z.string(),
    })
  ),
});

export const QuizAnswersSchema = z.object({
  quizAnswers: z.array(
    z.object({
      questionId: z.string(),
      answerIndex: z.number().int().min(0),
    })
  ),
});

export const LessonQuerySchema = z.object({
  categorySlug: z.string().optional(),
  taxForm: TaxFormFilterEnum.optional(),
  search: z.string().optional(),
  completed: z.coerce.boolean().optional(),
});

export type LessonSummary = z.infer<typeof LessonSummarySchema>;
export type LessonDetail = z.infer<typeof LessonDetailSchema>;
export type QuizAnswersInput = z.infer<typeof QuizAnswersSchema>;
export type LessonQueryInput = z.infer<typeof LessonQuerySchema>;
