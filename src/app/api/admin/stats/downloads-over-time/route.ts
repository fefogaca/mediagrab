import { NextResponse } from 'next/server';
import { connectDB } from '@backend/lib/database';
import prisma from '@backend/lib/database';

export async function GET() {
  try {
    await connectDB();
    
    // Usar SQL raw do PostgreSQL para agrupar por data formatada
    const logs = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') as date,
        COUNT(*)::int as count
      FROM download_logs
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date ASC
      LIMIT 30
    `;
    
    const formattedLogs = logs.map(log => ({
      date: log.date,
      count: Number(log.count) // Converter bigint para number
    }));
    
    return NextResponse.json(formattedLogs, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch downloads over time:', error);
    return NextResponse.json({ 
      message: 'Failed to fetch downloads over time', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}
