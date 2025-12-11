import { NextResponse } from 'next/server';
import { connectDB } from '@backend/lib/database';
import prisma from '@backend/lib/database';

export async function GET() {
  try {
    await connectDB();
    
    const total = await prisma.downloadLog.count();
    
    // Downloads hoje
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const today = await prisma.downloadLog.count({
      where: {
        createdAt: { gte: startOfToday }
      }
    });

    // Downloads nos últimos 7 dias
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const last7Days = await prisma.downloadLog.count({
      where: {
        createdAt: { gte: sevenDaysAgo }
      }
    });

    // Downloads por plataforma usando groupBy do Prisma
    const byPlatformRaw = await prisma.downloadLog.groupBy({
      by: ['provider'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    const byPlatform = byPlatformRaw.map(item => ({
      _id: item.provider,
      count: item._count.id
    }));

    return NextResponse.json({ 
      total,
      today,
      last7Days,
      byPlatform
    }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch download stats:', error);
    return NextResponse.json({ message: 'Erro ao buscar estatísticas', error: (error as Error).message }, { status: 500 });
  }
}
