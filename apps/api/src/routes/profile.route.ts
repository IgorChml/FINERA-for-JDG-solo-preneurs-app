import type { FastifyPluginAsync } from 'fastify';
import { JDGProfileSchema, UpdateProfileSchema } from '@finera/shared';
import { authenticate } from '../middleware/auth.js';

const profileRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', {
    schema: { tags: ['profile'], summary: 'Pobierz profil JDG' },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const profile = await fastify.prisma.jDGProfile.findUnique({ where: { userId } });

      if (!profile) {
        reply.status(404).send({ error: 'Profil nie znaleziony' });
        return;
      }
      reply.send({ profile });
    },
  });

  fastify.post('/', {
    schema: { tags: ['profile'], summary: 'Utwórz profil JDG' },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const input = JDGProfileSchema.parse(request.body);

      const existing = await fastify.prisma.jDGProfile.findUnique({ where: { userId } });
      if (existing) {
        reply.status(409).send({ error: 'Profil już istnieje — użyj PATCH do aktualizacji' });
        return;
      }

      const profile = await fastify.prisma.jDGProfile.create({
        data: {
          userId,
          companyName: input.companyName,
          nip: input.nip,
          regon: input.regon,
          pkdCode: input.pkdCode,
          taxForm: input.taxForm,
          vatRate: input.vatRate,
          isVatPayer: input.isVatPayer,
          lumpSumRate: input.lumpSumRate,
          street: input.address.street,
          houseNumber: input.address.houseNumber,
          apartmentNumber: input.address.apartmentNumber,
          postalCode: input.address.postalCode,
          city: input.address.city,
          country: input.address.country,
          bankAccountNumber: input.bankAccountNumber,
          taxMicroaccountNumber: input.taxMicroaccountNumber,
        },
      });

      await fastify.prisma.subscription.create({
        data: {
          userId,
          plan: 'FREE',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });

      reply.status(201).send({ profile });
    },
  });

  fastify.patch('/', {
    schema: { tags: ['profile'], summary: 'Aktualizuj profil JDG' },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const input = UpdateProfileSchema.parse(request.body);

      const updateData: Record<string, unknown> = {};

      if (input.companyName !== undefined) updateData.companyName = input.companyName;
      if (input.nip !== undefined) updateData.nip = input.nip;
      if (input.regon !== undefined) updateData.regon = input.regon;
      if (input.pkdCode !== undefined) updateData.pkdCode = input.pkdCode;
      if (input.taxForm !== undefined) updateData.taxForm = input.taxForm;
      if (input.vatRate !== undefined) updateData.vatRate = input.vatRate;
      if (input.isVatPayer !== undefined) updateData.isVatPayer = input.isVatPayer;
      if (input.lumpSumRate !== undefined) updateData.lumpSumRate = input.lumpSumRate;
      if (input.bankAccountNumber !== undefined) updateData.bankAccountNumber = input.bankAccountNumber;
      if (input.taxMicroaccountNumber !== undefined) updateData.taxMicroaccountNumber = input.taxMicroaccountNumber;
      if (input.address) {
        if (input.address.street !== undefined) updateData.street = input.address.street;
        if (input.address.houseNumber !== undefined) updateData.houseNumber = input.address.houseNumber;
        if (input.address.apartmentNumber !== undefined) updateData.apartmentNumber = input.address.apartmentNumber;
        if (input.address.postalCode !== undefined) updateData.postalCode = input.address.postalCode;
        if (input.address.city !== undefined) updateData.city = input.address.city;
        if (input.address.country !== undefined) updateData.country = input.address.country;
      }

      const profile = await fastify.prisma.jDGProfile.update({
        where: { userId },
        data: updateData,
      });

      reply.send({ profile });
    },
  });
};

export default profileRoutes;
