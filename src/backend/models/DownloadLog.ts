// Wrapper para compatibilidade com código existente
import prisma from '../lib/database';
import type { DownloadLog as PrismaDownloadLog, Prisma } from '@prisma/client';

export type IDownloadLog = PrismaDownloadLog;

export const DownloadLog = {
  findOne: async (query: { _id?: string; id?: string }) => {
    if (query._id || query.id) {
      return await prisma.downloadLog.findUnique({ where: { id: query._id || query.id } });
    }
    return null;
  },

  findById: async (id: string) => {
    return await prisma.downloadLog.findUnique({ where: { id } });
  },

  findByIdAndUpdate: async (id: string, data: Prisma.DownloadLogUpdateInput) => {
    return await prisma.downloadLog.update({ where: { id }, data });
  },

  create: async (data: Prisma.DownloadLogCreateInput) => {
    return await prisma.downloadLog.create({ data });
  },

  find: async (query?: Prisma.DownloadLogWhereInput, options?: { limit?: number; skip?: number; orderBy?: Prisma.DownloadLogOrderByWithRelationInput }) => {
    const result = await prisma.downloadLog.findMany({ 
      where: query,
      ...(options?.limit && { take: options.limit }),
      ...(options?.skip && { skip: options.skip }),
      ...(options?.orderBy && { orderBy: options.orderBy }),
    });
    return {
      ...result,
      sort: (sortObj: any) => {
        const orderBy: Prisma.DownloadLogOrderByWithRelationInput = {};
        for (const [key, value] of Object.entries(sortObj)) {
          orderBy[key as keyof Prisma.DownloadLogOrderByWithRelationInput] = value === -1 ? 'desc' : 'asc';
        }
        return prisma.downloadLog.findMany({ 
          where: query,
          orderBy,
          ...(options?.limit && { take: options.limit }),
          ...(options?.skip && { skip: options.skip }),
        });
      },
      lean: () => result,
    };
  },
  
  countDocuments: async (query?: Prisma.DownloadLogWhereInput) => {
    return await prisma.downloadLog.count({ where: query });
  },

  count: async (query?: Prisma.DownloadLogWhereInput) => {
    return await prisma.downloadLog.count({ where: query });
  },

  aggregate: async (args: Prisma.DownloadLogAggregateArgs) => {
    return await prisma.downloadLog.aggregate(args);
  },
};

export default DownloadLog;
