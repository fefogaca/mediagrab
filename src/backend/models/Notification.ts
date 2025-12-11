// Wrapper para compatibilidade com código existente
import prisma from '../lib/database';
import type { Notification as PrismaNotification, Prisma } from '@prisma/client';

export type INotification = PrismaNotification;

export const Notification = {
  findOne: async (query: { _id?: string; id?: string }) => {
    if (query._id || query.id) {
      return await prisma.notification.findUnique({ where: { id: query._id || query.id } });
    }
    return null;
  },

  findById: async (id: string) => {
    return await prisma.notification.findUnique({ where: { id } });
  },

  findByIdAndUpdate: async (id: string, data: Prisma.NotificationUpdateInput) => {
    return await prisma.notification.update({ where: { id }, data });
  },

  findByIdAndDelete: async (id: string) => {
    return await prisma.notification.delete({ where: { id } });
  },

  create: async (data: Prisma.NotificationCreateInput) => {
    return await prisma.notification.create({ data });
  },

  find: async (query?: Prisma.NotificationWhereInput, options?: { limit?: number; skip?: number; orderBy?: Prisma.NotificationOrderByWithRelationInput }) => {
    const result = await prisma.notification.findMany({ 
      where: query,
      ...(options?.limit && { take: options.limit }),
      ...(options?.skip && { skip: options.skip }),
      ...(options?.orderBy && { orderBy: options.orderBy }),
    });
    return {
      ...result,
      sort: (sortObj: any) => {
        const orderBy: Prisma.NotificationOrderByWithRelationInput = {};
        for (const [key, value] of Object.entries(sortObj)) {
          orderBy[key as keyof Prisma.NotificationOrderByWithRelationInput] = value === -1 ? 'desc' : 'asc';
        }
        return prisma.notification.findMany({ 
          where: query,
          orderBy,
          ...(options?.limit && { take: options.limit }),
          ...(options?.skip && { skip: options.skip }),
        });
      },
      lean: () => result,
    };
  },

  count: async (query?: Prisma.NotificationWhereInput) => {
    return await prisma.notification.count({ where: query });
  },
};

export default Notification;
