// Wrapper para compatibilidade com código existente
import prisma from '../lib/database';
import type { Coupon as PrismaCoupon, Prisma } from '@prisma/client';

export type ICoupon = PrismaCoupon;

export const Coupon = {
  findOne: async (query: { code?: string; _id?: string; id?: string }) => {
    if (query.code) {
      return await prisma.coupon.findUnique({ where: { code: query.code.toUpperCase() } });
    }
    if (query._id || query.id) {
      return await prisma.coupon.findUnique({ where: { id: query._id || query.id } });
    }
    return null;
  },

  findById: async (id: string) => {
    return await prisma.coupon.findUnique({ where: { id } });
  },

  findByIdAndUpdate: async (id: string, data: Prisma.CouponUpdateInput) => {
    return await prisma.coupon.update({ where: { id }, data });
  },

  create: async (data: Prisma.CouponCreateInput) => {
    return await prisma.coupon.create({ data });
  },

  find: async (query?: Prisma.CouponWhereInput) => {
    return await prisma.coupon.findMany({ where: query });
  },

  count: async (query?: Prisma.CouponWhereInput) => {
    return await prisma.coupon.count({ where: query });
  },
};

export default Coupon;
