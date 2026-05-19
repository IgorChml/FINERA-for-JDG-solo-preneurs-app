import type { FastifyInstance } from 'fastify';
import type { CreateInvoiceInput, InvoiceListParamsInput } from '@finera/shared';
import type { Prisma } from '@prisma/client';

export class InvoiceService {
  constructor(private readonly fastify: FastifyInstance) {}

  async createInvoice(userId: string, input: CreateInvoiceInput) {
    const { prisma } = this.fastify;

    const profile = await prisma.jDGProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw Object.assign(new Error('Uzupełnij profil JDG przed wystawieniem faktury'), {
        statusCode: 422,
      });
    }

    const { items, ...invoiceData } = input;

    const { netAmount, vatAmount, grossAmount, itemsWithCalc } = this.calculateAmounts(items);

    const invoiceNumber = await this.generateInvoiceNumber(userId, invoiceData.type);

    const invoice = await prisma.invoice.create({
      data: {
        userId,
        type: invoiceData.type,
        source: 'MANUAL',
        status: 'DRAFT',
        invoiceNumber,
        issueDate: invoiceData.issueDate,
        dueDate: invoiceData.dueDate,
        sellerName: profile.companyName,
        sellerNip: profile.nip,
        sellerAddress: `${profile.street} ${profile.houseNumber}, ${profile.postalCode} ${profile.city}`,
        buyerName: invoiceData.buyerName,
        buyerNip: invoiceData.buyerNip,
        buyerAddress: invoiceData.buyerAddress,
        netAmount,
        vatAmount,
        grossAmount,
        currency: invoiceData.currency ?? 'PLN',
        notes: invoiceData.notes,
        items: {
          create: itemsWithCalc,
        },
      },
      include: { items: true },
    });

    return invoice;
  }

  async getInvoices(userId: string, params: InvoiceListParamsInput) {
    const { prisma } = this.fastify;

    const where: Prisma.InvoiceWhereInput = {
      userId,
      ...(params.type && { type: params.type }),
      ...(params.status && { status: params.status }),
      ...(params.dateFrom || params.dateTo
        ? {
            issueDate: {
              ...(params.dateFrom && { gte: params.dateFrom }),
              ...(params.dateTo && { lte: params.dateTo }),
            },
          }
        : {}),
      ...(params.search && {
        OR: [
          { buyerName: { contains: params.search, mode: 'insensitive' as const } },
          { invoiceNumber: { contains: params.search, mode: 'insensitive' as const } },
          { buyerNip: { contains: params.search } },
        ],
      }),
    };

    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    const [data, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: { items: true },
        orderBy: { issueDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getInvoiceById(userId: string, invoiceId: string) {
    const { prisma } = this.fastify;

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
      include: { items: true },
    });

    if (!invoice) {
      throw Object.assign(new Error('Faktura nie znaleziona'), { statusCode: 404 });
    }

    return invoice;
  }

  async updateInvoiceStatus(
    userId: string,
    invoiceId: string,
    status: string,
    paymentDate?: Date
  ) {
    const { prisma } = this.fastify;

    const existing = await prisma.invoice.findFirst({ where: { id: invoiceId, userId } });
    if (!existing) {
      throw Object.assign(new Error('Faktura nie znaleziona'), { statusCode: 404 });
    }

    return prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: status as 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED',
        ...(paymentDate && { paymentDate }),
      },
    });
  }

  async getDashboardSummary(userId: string, month: number, year: number) {
    const { prisma } = this.fastify;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const [incomes, costs] = await Promise.all([
      prisma.invoice.aggregate({
        where: { userId, type: 'INCOME', issueDate: { gte: startDate, lte: endDate } },
        _sum: { grossAmount: true, netAmount: true },
        _count: true,
      }),
      prisma.invoice.aggregate({
        where: { userId, type: 'COST', issueDate: { gte: startDate, lte: endDate } },
        _sum: { grossAmount: true, netAmount: true },
        _count: true,
      }),
    ]);

    return {
      month,
      year,
      income: {
        gross: Number(incomes._sum.grossAmount ?? 0),
        net: Number(incomes._sum.netAmount ?? 0),
        count: incomes._count,
      },
      costs: {
        gross: Number(costs._sum.grossAmount ?? 0),
        net: Number(costs._sum.netAmount ?? 0),
        count: costs._count,
      },
    };
  }

  private calculateAmounts(items: CreateInvoiceInput['items']) {
    const itemsWithCalc = items.map((item) => {
      const netAmount = item.quantity * item.unitPrice;
      const vatAmount = netAmount * (item.vatRate / 100);
      const grossAmount = netAmount + vatAmount;

      return {
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        unit: item.unit ?? 'szt',
        netAmount,
        vatAmount,
        grossAmount,
      };
    });

    const netAmount = itemsWithCalc.reduce((s, i) => s + Number(i.netAmount), 0);
    const vatAmount = itemsWithCalc.reduce((s, i) => s + Number(i.vatAmount), 0);
    const grossAmount = itemsWithCalc.reduce((s, i) => s + Number(i.grossAmount), 0);

    return { netAmount, vatAmount, grossAmount, itemsWithCalc };
  }

  private async generateInvoiceNumber(userId: string, type: string): Promise<string> {
    const { prisma } = this.fastify;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = type === 'INCOME' ? 'FV' : 'FK';

    const count = await prisma.invoice.count({
      where: {
        userId,
        type: type as 'INCOME' | 'COST',
        issueDate: {
          gte: new Date(year, now.getMonth(), 1),
          lt: new Date(year, now.getMonth() + 1, 1),
        },
      },
    });

    return `${prefix}/${year}/${month}/${String(count + 1).padStart(4, '0')}`;
  }
}
