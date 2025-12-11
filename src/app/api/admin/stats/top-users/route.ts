import { NextResponse } from 'next/server';
import { connectDB } from '@backend/lib/database';
import prisma from '@backend/lib/database';

export async function GET() {
  try {
    await connectDB();
    
    // Usar SQL raw do PostgreSQL para agrupar downloads por usuário
    const topUsers = await prisma.$queryRaw<Array<{
      user_id: string;
      username: string;
      email: string;
      download_count: bigint;
    }>>`
      SELECT 
        dl.user_id,
        u.name as username,
        u.email,
        COUNT(*)::int as download_count
      FROM download_logs dl
      INNER JOIN users u ON dl.user_id = u.id
      WHERE dl.user_id IS NOT NULL
      GROUP BY dl.user_id, u.name, u.email
      ORDER BY download_count DESC
      LIMIT 5
    `;
    
    const formattedUsers = topUsers.map(user => ({
      username: user.username,
      email: user.email,
      download_count: Number(user.download_count) // Converter bigint para number
    }));
    
    return NextResponse.json(formattedUsers, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch top users:', error);
    return NextResponse.json({ 
      message: 'Failed to fetch top users', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}
