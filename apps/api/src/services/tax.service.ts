import type { FastifyInstance } from 'fastify';
import { calculateTaxes, formatPln, TAX_CONSTANTS } from '@finera/shared';
import type { TaxCalculationInput } from '@finera/shared';
import QRCode from 'qrcode';

export class TaxService {
  constructor(private readonly fastify: FastifyInstance) {}

  async calculateAndSaveReserve(userId: string, month: number, year: number) {
    const { prisma } = this.fastify;

    const profile = await prisma.jDGProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw Object.assign(new Error('Profil JDG nie skonfigurowany'), { statusCode: 422 });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const [incomes, costs] = await Promise.all([
      prisma.invoice.aggregate({
        where: { userId, type: 'INCOME', issueDate: { gte: startDate, lte: endDate } },
        _sum: { grossAmount: true },
      }),
      prisma.invoice.aggregate({
        where: { userId, type: 'COST', issueDate: { gte: startDate, lte: endDate } },
        _sum: { grossAmount: true },
      }),
    ]);

    const revenue = Number(incomes._sum.grossAmount ?? 0);
    const costsTotal = Number(costs._sum.grossAmount ?? 0);

    const input: TaxCalculationInput = {
      revenue,
      costs: costsTotal,
      taxForm: profile.taxForm,
      lumpSumRate: profile.lumpSumRate ?? undefined,
      isVatPayer: profile.isVatPayer,
      vatRate: profile.vatRate,
      month,
      year,
    };

    const calc = calculateTaxes(input);

    const reserve = await prisma.taxReserve.upsert({
      where: { userId_month_year: { userId, month, year } },
      update: {
        revenue,
        costs: costsTotal,
        vatOwed: calc.vatOwed,
        pitOwed: calc.pitAmount,
        zusHealthOwed: calc.zusHealth,
        zusSocialOwed: calc.zusSocial,
        totalOwed: calc.totalTaxBurden,
        updatedAt: new Date(),
      },
      create: {
        userId,
        month,
        year,
        revenue,
        costs: costsTotal,
        vatOwed: calc.vatOwed,
        pitOwed: calc.pitAmount,
        zusHealthOwed: calc.zusHealth,
        zusSocialOwed: calc.zusSocial,
        totalOwed: calc.totalTaxBurden,
        reservedAmount: 0,
      },
    });

    return { reserve, calculation: calc };
  }

  async generatePaymentQr(
    accountNumber: string,
    amount: number,
    recipient: string,
    title: string
  ): Promise<string> {
    // Polish payment QR standard (KIR BLIK)
    const qrData = [
      'PL',
      '1',
      '0',
      accountNumber.replace(/\s/g, ''),
      String(Math.round(amount * 100)),
      '',
      '',
      recipient.substring(0, 20),
      title.substring(0, 32),
      '',
    ].join('|');

    return QRCode.toDataURL(qrData, { errorCorrectionLevel: 'M', width: 300 });
  }

  async getUpcomingPayments(userId: string) {
    const { prisma } = this.fastify;

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const reserve = await prisma.taxReserve.findUnique({
      where: { userId_month_year: { userId, month, year } },
    });

    const profile = await prisma.jDGProfile.findUnique({ where: { userId } });

    const payments = [];
    const nextMonthStart = new Date(year, month, 1);
    const day20 = new Date(year, month, TAX_CONSTANTS.ZUS_DEADLINE_DAY);
    const day25 = new Date(year, month, TAX_CONSTANTS.VAT_DECLARATION_DEADLINE_DAY);

    if (reserve) {
      if (reserve.vatOwed > 0 && profile?.isVatPayer) {
        payments.push({
          type: 'VAT-7',
          amount: Number(reserve.vatOwed),
          dueDate: day25,
          label: `VAT-7 za ${month}/${year}`,
          recipient: 'Urząd Skarbowy',
          microaccountType: 'VAT',
        });
      }

      payments.push({
        type: 'PIT',
        amount: Number(reserve.pitOwed),
        dueDate: day20,
        label: `Zaliczka PIT za ${month}/${year}`,
        recipient: 'Urząd Skarbowy',
        microaccountType: 'PIT',
      });

      payments.push({
        type: 'ZUS',
        amount: Number(reserve.zusSocialOwed) + Number(reserve.zusHealthOwed),
        dueDate: day20,
        label: `ZUS za ${month}/${year}`,
        recipient: 'ZUS',
        microaccountType: 'ZUS',
      });
    }

    return payments;
  }
}
