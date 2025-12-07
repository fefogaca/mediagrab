import { NextResponse } from 'next/server';
import connectDB from '@backend/lib/mongodb';
import DownloadLog from '@backend/models/DownloadLog';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET: string = process.env.JWT_SECRET as string;

interface DecodedToken {
  id: string;
  email: string;
  role: string;
}

async function getUserIdFromRequest(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) return null;
    
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    return decoded.id;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Buscar downloads dos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const downloads = await DownloadLog.aggregate([
      {
        $match: {
          userId: userId,
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const labels: string[] = [];
    const values: number[] = [];

    // Preencher os últimos 30 dias
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      labels.push(date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
      
      const download = downloads.find((d: { _id: string }) => d._id === dateStr);
      values.push(download ? download.count : 0);
    }

    return NextResponse.json({ labels, values }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch downloads over time:', error);
    return NextResponse.json({ message: 'Failed to fetch downloads over time', error: (error as Error).message }, { status: 500 });
  }
}
