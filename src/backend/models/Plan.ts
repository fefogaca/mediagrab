// Wrapper para compatibilidade com código existente
import prisma from '../lib/database';
import type { Plan as PrismaPlan, Prisma } from '@prisma/client';

export type IPlan = PrismaPlan;

export const Plan = {
  findOne: async (query: { slug?: string; _id?: string; id?: string }) => {
    if (query.slug) {
      return await prisma.plan.findUnique({ where: { slug: query.slug } });
    }
    if (query._id || query.id) {
      return await prisma.plan.findUnique({ where: { id: query._id || query.id } });
    }
    return null;
  },

  findById: async (id: string) => {
    return await prisma.plan.findUnique({ where: { id } });
  },

  findOneAndUpdate: async (query: { slug: string }, data: Prisma.PlanUpdateInput, options?: { upsert?: boolean; new?: boolean }) => {
    if (options?.upsert) {
      return await prisma.plan.upsert({
        where: { slug: query.slug },
        update: data,
        create: { ...data, slug: query.slug } as Prisma.PlanCreateInput,
      });
    }
    return await prisma.plan.update({ where: { slug: query.slug }, data });
  },

  create: async (data: Prisma.PlanCreateInput) => {
    return await prisma.plan.create({ data });
  },

  find: async (query?: Prisma.PlanWhereInput) => {
    return await prisma.plan.findMany({ where: query });
  },

  count: async (query?: Prisma.PlanWhereInput) => {
    return await prisma.plan.count({ where: query });
  },
};

export default Plan;
