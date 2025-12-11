// Wrapper para compatibilidade com código existente
import prisma from '../lib/database';
import type { Payment as PrismaPayment, Prisma } from '@prisma/client';

export type IPayment = PrismaPayment;

export const Payment = {
  findOne: async (query: { stripeSessionId?: string; stripeSubscriptionId?: string; _id?: string; id?: string; userId?: string; status?: string }) => {
    if (query.stripeSessionId) {
      return await prisma.payment.findFirst({ where: { stripeSessionId: query.stripeSessionId } });
    }
    if (query.stripeSubscriptionId) {
      return await prisma.payment.findFirst({ where: { stripeSubscriptionId: query.stripeSubscriptionId } });
    }
    if (query._id || query.id) {
      return await prisma.payment.findUnique({ where: { id: query._id || query.id } });
    }
    if (query.userId && query.status) {
      return await prisma.payment.findFirst({ 
        where: { userId: query.userId, status: query.status as any } 
      });
    }
    return null;
  },

  findById: async (id: string) => {
    return await prisma.payment.findUnique({ where: { id } });
  },

  findByIdAndUpdate: async (id: string, data: Prisma.PaymentUpdateInput) => {
    return await prisma.payment.update({ where: { id }, data });
  },

  create: async (data: Prisma.PaymentCreateInput) => {
    return await prisma.payment.create({ data });
  },

  find: async (query?: Prisma.PaymentWhereInput) => {
    const result = await prisma.payment.findMany({ where: query });
    return {
      ...result,
      sort: (sortObj: any) => {
        const orderBy: Prisma.PaymentOrderByWithRelationInput = {};
        for (const [key, value] of Object.entries(sortObj)) {
          orderBy[key as keyof Prisma.PaymentOrderByWithRelationInput] = value === -1 ? 'desc' : 'asc';
        }
        return prisma.payment.findMany({ where: query, orderBy });
      },
      lean: () => result,
    };
  },

  count: async (query?: Prisma.PaymentWhereInput) => {
    return await prisma.payment.count({ where: query });
  },

  aggregate: async (args: Prisma.PaymentAggregateArgs) => {
    return await prisma.payment.aggregate(args);
  },
};

export default Payment;
