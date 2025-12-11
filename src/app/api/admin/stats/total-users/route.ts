import { NextResponse } from 'next/server';
import { connectDB } from '@backend/lib/database';
import prisma from '@backend/lib/database';

export async function GET() {
  try {
    await connectDB();
    
    const total = await prisma.user.count();
    const admins = await prisma.user.count({ where: { role: 'admin' } });
    const users = await prisma.user.count({ where: { role: 'user' } });
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeToday = await prisma.user.count({
      where: {
        lastLoginAt: { gte: yesterday }
      }
    });

    return NextResponse.json({ 
      total, 
      admins,
      users,
      activeToday
    }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch total users:', error);
    return NextResponse.json({ message: 'Erro ao buscar estatísticas', error: (error as Error).message }, { status: 500 });
  }
}
