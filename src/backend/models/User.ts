// Wrapper para compatibilidade com código existente
// Agora usando Prisma ao invés de Mongoose
import prisma from '../lib/database';
import type { User as PrismaUser, Prisma } from '@prisma/client';

export type IUser = PrismaUser;

// Helper functions para manter compatibilidade
export const User = {
  // Find operations

  findById: async (id: string) => {
    const result = await prisma.user.findUnique({ where: { id } });
    if (!result) return null;
    return {
      ...result,
      select: (selectObj: any) => {
        return prisma.user.findUnique({ where: { id }, select: selectObj });
      },
    };
  },

  findByIdAndUpdate: async (id: string, data: Prisma.UserUpdateInput) => {
    return await prisma.user.update({ where: { id }, data });
  },

  create: async (data: Prisma.UserCreateInput) => {
    return await prisma.user.create({ data });
  },

  find: async (query?: Prisma.UserWhereInput) => {
    const result = await prisma.user.findMany({ where: query });
    // Adicionar métodos chain para compatibilidade
    return {
      ...result,
      select: (selectObj: any) => {
        return prisma.user.findMany({ 
          where: query,
          select: selectObj 
        });
      },
      sort: (sortObj: any) => {
        const orderBy: Prisma.UserOrderByWithRelationInput = {};
        for (const [key, value] of Object.entries(sortObj)) {
          orderBy[key as keyof Prisma.UserOrderByWithRelationInput] = value === -1 ? 'desc' : 'asc';
        }
        return prisma.user.findMany({ where: query, orderBy });
      },
      lean: () => result,
    };
  },
  
  findOne: async (query: { email?: string; _id?: string; id?: string; role?: string }) => {
    // Se for busca por email ou id, usar findUnique
    if (query.email) {
      const result = await prisma.user.findUnique({ 
        where: { email: query.email }
      });
      if (!result) return null;
      return {
        ...result,
        select: (selectObj: any) => {
          return prisma.user.findUnique({ 
            where: { email: query.email! },
            select: selectObj 
          });
        },
      };
    }
    
    if (query._id || query.id) {
      const result = await prisma.user.findUnique({ 
        where: { id: query._id || query.id || '' }
      });
      if (!result) return null;
      return {
        ...result,
        select: (selectObj: any) => {
          return prisma.user.findUnique({ 
            where: { id: query._id || query.id || '' },
            select: selectObj 
          });
        },
      };
    }
    
    // Se for busca por role ou outros campos, usar findFirst
    if (query.role) {
      const result = await prisma.user.findFirst({ 
        where: { role: query.role }
      });
      if (!result) return null;
      return {
        ...result,
        select: (selectObj: any) => {
          return prisma.user.findFirst({ 
            where: { role: query.role! },
            select: selectObj 
          });
        },
      };
    }
    
    return null;
  },

  count: async (query?: Prisma.UserWhereInput) => {
    return await prisma.user.count({ where: query });
  },
  
  countDocuments: async (query?: Prisma.UserWhereInput) => {
    return await prisma.user.count({ where: query });
  },

  // Aggregation
  aggregate: async (args: Prisma.UserAggregateArgs) => {
    return await prisma.user.aggregate(args);
  },
};

export default User;
