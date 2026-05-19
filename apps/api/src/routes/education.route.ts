import type { FastifyPluginAsync } from 'fastify';
import { LessonQuerySchema, QuizAnswersSchema } from '@finera/shared';
import { authenticate } from '../middleware/auth.js';
import type { Prisma } from '@prisma/client';

const FREE_LESSONS_PER_CATEGORY = 2;

const educationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);

  // GET /api/education/categories
  fastify.get('/categories', {
    schema: { tags: ['education'], summary: 'Kategorie lekcji' },
    handler: async (request, reply) => {
      const userId = request.user.sub;

      const categories = await fastify.prisma.educationCategory.findMany({
        orderBy: { sortOrder: 'asc' },
        include: {
          lessons: {
            where: { publishedAt: { not: null } },
            select: {
              id: true,
              userProgress: { where: { userId }, select: { completedAt: true } },
            },
          },
        },
      });

      const result = categories.map((cat) => ({
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        icon: cat.icon,
        lessonsCount: cat.lessons.length,
        completedCount: cat.lessons.filter((l) => l.userProgress[0]?.completedAt).length,
      }));

      reply.send({ categories: result });
    },
  });

  // GET /api/education/lessons
  fastify.get('/lessons', {
    schema: { tags: ['education'], summary: 'Lista lekcji z filtrowaniem' },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const query = LessonQuerySchema.parse(request.query);

      const profile = await fastify.prisma.jDGProfile.findUnique({
        where: { userId },
        select: { taxForm: true },
      });

      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionStatus: true },
      });

      const isPremium =
        user?.subscriptionStatus === 'PREMIUM' || user?.subscriptionStatus === 'TRIAL';

      const where: Prisma.EducationLessonWhereInput = {
        publishedAt: { not: null },
        ...(query.categorySlug && {
          category: { slug: query.categorySlug },
        }),
        ...(query.search && {
          OR: [
            { title: { contains: query.search, mode: 'insensitive' } },
            { summary: { contains: query.search, mode: 'insensitive' } },
          ],
        }),
      };

      const lessons = await fastify.prisma.educationLesson.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        include: {
          category: { select: { slug: true, name: true } },
          userProgress: { where: { userId }, select: { completedAt: true } },
        },
      });

      // Filter by taxForm if user has a profile
      const userTaxForm = profile?.taxForm;
      const filtered = lessons.filter((l) => {
        if (!userTaxForm) return true;
        return l.taxFormFilter.includes('ALL') || l.taxFormFilter.includes(userTaxForm);
      });

      // For free users — limit to 2 lessons per category
      let result = filtered;
      if (!isPremium) {
        const catCountMap = new Map<string, number>();
        result = filtered.filter((l) => {
          const catId = l.categoryId;
          const count = catCountMap.get(catId) ?? 0;
          if (count < FREE_LESSONS_PER_CATEGORY) {
            catCountMap.set(catId, count + 1);
            return true;
          }
          return false;
        });
      }

      // Apply completed filter after access control
      const finalResult = query.completed !== undefined
        ? result.filter((l) =>
            query.completed ? !!l.userProgress[0]?.completedAt : !l.userProgress[0]?.completedAt
          )
        : result;

      reply.send({
        lessons: finalResult.map((l) => ({
          id: l.id,
          slug: l.slug,
          title: l.title,
          summary: l.summary,
          categorySlug: l.category.slug,
          categoryName: l.category.name,
          readTimeMinutes: l.readTimeMinutes,
          isCompleted: !!l.userProgress[0]?.completedAt,
          taxForms: l.taxFormFilter,
        })),
      });
    },
  });

  // GET /api/education/lessons/:slug
  fastify.get('/lessons/:slug', {
    schema: { tags: ['education'], summary: 'Szczegół lekcji + quiz' },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { slug } = request.params as { slug: string };

      const lesson = await fastify.prisma.educationLesson.findUnique({
        where: { slug },
        include: {
          category: { select: { slug: true, name: true } },
          quizQuestions: { orderBy: { sortOrder: 'asc' } },
          userProgress: { where: { userId } },
        },
      });

      if (!lesson || !lesson.publishedAt) {
        reply.status(404).send({ error: 'Lekcja nie znaleziona' });
        return;
      }

      // Record start if first time
      if (lesson.userProgress.length === 0) {
        await fastify.prisma.userLessonProgress.create({
          data: { userId, lessonId: lesson.id },
        });
      }

      const progress = lesson.userProgress[0];

      reply.send({
        lesson: {
          id: lesson.id,
          slug: lesson.slug,
          title: lesson.title,
          summary: lesson.summary,
          contentMdx: lesson.contentMdx,
          categorySlug: lesson.category.slug,
          categoryName: lesson.category.name,
          readTimeMinutes: lesson.readTimeMinutes,
          isCompleted: !!progress?.completedAt,
          taxForms: lesson.taxFormFilter,
          legalSource: lesson.legalSource,
          updatedAt: lesson.updatedAt.toISOString(),
          quizQuestions: lesson.quizQuestions.map((q) => ({
            id: q.id,
            question: q.question,
            answers: q.answers as Array<{ text: string; isCorrect: boolean }>,
            explanation: q.explanation,
          })),
        },
      });
    },
  });

  // POST /api/education/lessons/:slug/complete
  fastify.post('/lessons/:slug/complete', {
    schema: { tags: ['education'], summary: 'Oznacz lekcję jako ukończoną (wynik quizu)' },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { slug } = request.params as { slug: string };
      const { quizAnswers } = QuizAnswersSchema.parse(request.body);

      const lesson = await fastify.prisma.educationLesson.findUnique({
        where: { slug },
        include: { quizQuestions: true },
      });

      if (!lesson) {
        reply.status(404).send({ error: 'Lekcja nie znaleziona' });
        return;
      }

      // Grade quiz
      let correct = 0;
      const explanations: string[] = [];

      for (const answer of quizAnswers) {
        const question = lesson.quizQuestions.find((q) => q.id === answer.questionId);
        if (!question) continue;

        const answers = question.answers as Array<{ text: string; isCorrect: boolean }>;
        const isCorrect = answers[answer.answerIndex]?.isCorrect ?? false;
        if (isCorrect) correct++;
        explanations.push(question.explanation);
      }

      const totalQuestions = lesson.quizQuestions.length;
      const score = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 100;
      const passed = score >= 60;

      await fastify.prisma.userLessonProgress.upsert({
        where: { userId_lessonId: { userId, lessonId: lesson.id } },
        update: {
          completedAt: passed ? new Date() : undefined,
          quizScore: score,
        },
        create: {
          userId,
          lessonId: lesson.id,
          completedAt: passed ? new Date() : undefined,
          quizScore: score,
        },
      });

      reply.send({ score, passed, correct, total: totalQuestions, explanations });
    },
  });

  // GET /api/education/recommended
  fastify.get('/recommended', {
    schema: { tags: ['education'], summary: '3 polecane lekcje dla użytkownika' },
    handler: async (request, reply) => {
      const userId = request.user.sub;

      const profile = await fastify.prisma.jDGProfile.findUnique({
        where: { userId },
        select: { taxForm: true },
      });

      const completedIds = await fastify.prisma.userLessonProgress
        .findMany({ where: { userId, completedAt: { not: null } }, select: { lessonId: true } })
        .then((rows) => rows.map((r) => r.lessonId));

      const candidates = await fastify.prisma.educationLesson.findMany({
        where: {
          publishedAt: { not: null },
          id: { notIn: completedIds },
          ...(profile?.taxForm && {
            taxFormFilter: { hasSome: ['ALL', profile.taxForm] },
          }),
        },
        include: {
          category: { select: { slug: true, name: true } },
          userProgress: { where: { userId }, select: { completedAt: true } },
        },
        take: 10,
        orderBy: { publishedAt: 'desc' },
      });

      // Pick 3 from different categories if possible
      const seen = new Set<string>();
      const recommended = candidates.filter((l) => {
        if (seen.has(l.categoryId) || seen.size >= 3) return false;
        seen.add(l.categoryId);
        return true;
      });

      // Fill remaining slots if needed
      if (recommended.length < 3) {
        for (const l of candidates) {
          if (!recommended.includes(l) && recommended.length < 3) {
            recommended.push(l);
          }
        }
      }

      reply.send({
        lessons: recommended.map((l) => ({
          id: l.id,
          slug: l.slug,
          title: l.title,
          summary: l.summary,
          categorySlug: l.category.slug,
          categoryName: l.category.name,
          readTimeMinutes: l.readTimeMinutes,
          isCompleted: false,
          taxForms: l.taxFormFilter,
        })),
      });
    },
  });
};

export default educationRoutes;
