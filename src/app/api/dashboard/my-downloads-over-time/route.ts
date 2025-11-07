import { NextResponse } from 'next/server';
import { openDb } from '@/lib/database';
import jwt from 'jsonwebtoken';

const JWT_SECRET: string = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

interface DecodedToken {
  id: number;
  username: string;
  role: string;
}

function getUserIdFromRequest(request: Request): number | null {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      const cookies = request.headers.get('cookie');
      if (cookies) {
        const tokenMatch = cookies.match(/token=([^;]+)/);
        if (tokenMatch) {
          const decoded = jwt.verify(tokenMatch[1], JWT_SECRET);
          if (typeof decoded !== 'string' && 'id' in decoded) {
            return (decoded as DecodedToken).id;
          }
        }
      }
      return null;
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === 'string' || !('id' in decoded)) {
      return null;
    }
    return (decoded as DecodedToken).id;
  } catch (error) {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const db = await openDb();
    
    // Buscar downloads dos últimos 30 dias agrupados por dia
    const downloads = await db.all(
      `SELECT 
        DATE(downloaded_at) as date,
        COUNT(*) as count
      FROM download_logs 
      WHERE user_id = ? 
        AND downloaded_at >= datetime('now', '-30 days')
      GROUP BY DATE(downloaded_at)
      ORDER BY date ASC`,
      userId
    );

    const labels: string[] = [];
    const values: number[] = [];

    // Preencher os últimos 30 dias
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      labels.push(date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
      
      const download = downloads.find((d: any) => d.date === dateStr);
      values.push(download ? download.count : 0);
    }

    return NextResponse.json({ labels, values }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch downloads over time:', error);
    return NextResponse.json({ message: 'Failed to fetch downloads over time', error: (error as Error).message }, { status: 500 });
  }
}

