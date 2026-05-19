import { Queue, Worker, type Job } from 'bullmq';
import type { FastifyInstance } from 'fastify';
import { KSeFAdapter } from '../integrations/ksef.adapter.js';
import type { KSeFEnvironment } from '@finera/shared';

const QUEUE_NAME = 'ksef-sync';

interface KSeFSyncJobData {
  userId: string;
  environment: KSeFEnvironment;
  dateFrom?: string;
  dateTo?: string;
}

export function createKSeFQueue(redis: { host?: string; port?: number; url?: string }) {
  return new Queue<KSeFSyncJobData>(QUEUE_NAME, {
    connection: redis as ConstructorParameters<typeof Queue>[1]['connection'],
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  });
}

export function createKSeFWorker(fastify: FastifyInstance, redisConfig: { url?: string }) {
  const worker = new Worker<KSeFSyncJobData>(
    QUEUE_NAME,
    async (job: Job<KSeFSyncJobData>) => {
      const { userId, environment, dateFrom, dateTo } = job.data;
      const { prisma } = fastify;

      const ksefToken = await prisma.kSeFToken.findUnique({ where: { userId } });
      if (!ksefToken || ksefToken.status !== 'ACTIVE') {
        throw new Error('No active KSeF token for user');
      }

      const syncJob = await prisma.kSeFSyncJob.create({
        data: { userId, status: 'RUNNING', environment },
      });

      const adapter = new KSeFAdapter(environment);
      let sessionToken: string | null = null;
      let invoicesFetched = 0;
      let invoicesNew = 0;

      try {
        sessionToken = await adapter.initSession(ksefToken.token);

        const queryFrom = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 24 * 60 * 60 * 1000);
        const queryTo = dateTo ? new Date(dateTo) : new Date();

        for (const subjectType of ['subject1', 'subject2'] as const) {
          let pageOffset = 0;
          const pageSize = 100;
          let hasMore = true;

          while (hasMore) {
            const result = await adapter.queryInvoices(sessionToken, {
              dateFrom: queryFrom,
              dateTo: queryTo,
              subjectType,
              pageOffset,
              pageSize,
            });

            invoicesFetched += result.invoiceHeaderList.length;

            for (const inv of result.invoiceHeaderList) {
              const exists = await prisma.invoice.findUnique({
                where: { ksefId: inv.ksefReferenceNumber },
              });

              if (!exists) {
                const header = inv.invoiceHeader;
                const grossAmount = parseFloat(header.invoiceBody.grossValue);

                await prisma.invoice.create({
                  data: {
                    userId,
                    type: subjectType === 'subject1' ? 'INCOME' : 'COST',
                    source: 'KSEF',
                    status: 'SENT',
                    invoiceNumber: header.invoiceReferenceNumber,
                    issueDate: new Date(header.issueDateUtc),
                    dueDate: new Date(header.issueDateUtc),
                    sellerName: header.subjectBy.issuedToName.fullName,
                    sellerNip: header.subjectBy.issuedToIdentifier.identifier,
                    buyerName: header.subjectTo.issuedToName.fullName,
                    buyerNip: header.subjectTo.issuedToIdentifier.identifier,
                    netAmount: grossAmount / 1.23,
                    vatAmount: grossAmount - grossAmount / 1.23,
                    grossAmount,
                    currency: header.invoiceBody.currency ?? 'PLN',
                    ksefId: inv.ksefReferenceNumber,
                    ksefNumber: inv.ksefReferenceNumber,
                  },
                });
                invoicesNew++;
              }
            }

            hasMore =
              result.invoiceHeaderList.length === pageSize &&
              pageOffset + pageSize < result.numberOfElements;
            pageOffset += pageSize;
          }
        }

        await prisma.kSeFSyncJob.update({
          where: { id: syncJob.id },
          data: { status: 'COMPLETED', invoicesFetched, invoicesNew, completedAt: new Date() },
        });

        await prisma.kSeFToken.update({
          where: { userId },
          data: { lastSyncAt: new Date() },
        });

        fastify.log.info({ userId, invoicesFetched, invoicesNew }, 'KSeF sync completed');
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        await prisma.kSeFSyncJob.update({
          where: { id: syncJob.id },
          data: { status: 'FAILED', errorMessage: errMsg, completedAt: new Date() },
        });
        throw error;
      } finally {
        if (sessionToken) {
          await adapter.terminateSession(sessionToken);
        }
      }
    },
    {
      connection: redisConfig as ConstructorParameters<typeof Worker>[2]['connection'],
      concurrency: 5,
    }
  );

  worker.on('failed', (job, err) => {
    fastify.log.error({ jobId: job?.id, err }, 'KSeF sync job failed');
  });

  return worker;
}
