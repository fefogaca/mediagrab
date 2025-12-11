import { NextResponse } from 'next/server';
import { connectDB } from '@backend/lib/database';
import prisma from '@backend/lib/database';

export async function GET() {
  try {
    await connectDB();
    
    const total = await prisma.apiKey.count();
    const active = await prisma.apiKey.count({ where: { isActive: true } });
    const now = new Date();
    const expired = await prisma.apiKey.count({ 
      where: {
        OR: [
          { isActive: false },
          { expiresAt: { lt: now } }
        ]
      }
    });

    // Total de requests usando aggregate do Prisma
    const usageStats = await prisma.apiKey.aggregate({
      _sum: {
        usageCount: true
      }
    });
    const totalRequests = usageStats._sum.usageCount || 0;

    return NextResponse.json({ 
      total,
      active,
      expired,
      totalRequests
    }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch API key stats:', error);
    return NextResponse.json({ message: 'Erro ao buscar estatísticas', error: (error as Error).message }, { status: 500 });
  }
}
