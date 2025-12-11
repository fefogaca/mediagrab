// Wrapper para compatibilidade com código existente
import prisma from '../lib/database';
import type { ApiKey as PrismaApiKey, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';

export type IApiKey = PrismaApiKey;

// Método estático para gerar nova key
const generateKey = (): string => {
  const prefix = 'mg_';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = prefix;
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
};

export const ApiKey = {
  findOne: async (query: { key?: string; _id?: string; id?: string; userId?: string; isActive?: boolean }) => {
    if (query.key) {
      return await prisma.apiKey.findFirst({ 
        where: { 
          key: query.key,
          ...(query.isActive !== undefined && { isActive: query.isActive })
        } 
      });
    }
    if (query._id || query.id) {
      return await prisma.apiKey.findUnique({ where: { id: query._id || query.id } });
    }
    if (query.userId) {
      return await prisma.apiKey.findFirst({ 
        where: { 
          userId: query.userId,
          ...(query.isActive !== undefined && { isActive: query.isActive })
        } 
      });
    }
    return null;
  },

  findById: async (id: string) => {
    return await prisma.apiKey.findUnique({ where: { id } });
  },

  findByIdAndUpdate: async (id: string, data: Prisma.ApiKeyUpdateInput | { usageCount?: number; lastUsedAt?: Date }) => {
    return await prisma.apiKey.update({ where: { id }, data: data as Prisma.ApiKeyUpdateInput });
  },

  create: async (data: Prisma.ApiKeyCreateInput) => {
    return await prisma.apiKey.create({ data });
  },

  find: async (query?: Prisma.ApiKeyWhereInput) => {
    const result = await prisma.apiKey.findMany({ where: query });
    // Criar um array que também tem métodos chain para compatibilidade
    const arrayWithMethods = result as any;
    
    // Adicionar métodos chain mantendo a funcionalidade de array
    arrayWithMethods.sort = (sortObj: any) => {
      const orderBy: Prisma.ApiKeyOrderByWithRelationInput = {};
      for (const [key, value] of Object.entries(sortObj)) {
        orderBy[key as keyof Prisma.ApiKeyOrderByWithRelationInput] = value === -1 ? 'desc' : 'asc';
      }
      return prisma.apiKey.findMany({ where: query, orderBy });
    };
    
    arrayWithMethods.lean = () => result;
    
    return arrayWithMethods;
  },

  deleteOne: async (query: { _id?: string; id?: string }) => {
    if (query._id || query.id) {
      return await prisma.apiKey.delete({ where: { id: query._id || query.id } });
    }
    return null;
  },

  deleteMany: async (query: Prisma.ApiKeyWhereInput) => {
    return await prisma.apiKey.deleteMany({ where: query });
  },

  count: async (query?: Prisma.ApiKeyWhereInput) => {
    return await prisma.apiKey.count({ where: query });
  },
  
  countDocuments: async (query?: Prisma.ApiKeyWhereInput) => {
    return await prisma.apiKey.count({ where: query });
  },

  // Static method
  generateKey,
};

export default ApiKey;
