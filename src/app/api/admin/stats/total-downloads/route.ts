import { NextResponse } from 'next/server';
import connectDB from '@backend/lib/mongodb';
import DownloadLog from '@models/DownloadLog';

export async function GET() {
  try {
    await connectDB();
    
    const total = await DownloadLog.countDocuments();
    
    // Downloads hoje
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const today = await DownloadLog.countDocuments({
      createdAt: { $gte: startOfToday }
    });

    // Downloads nos últimos 7 dias
    const last7Days = await DownloadLog.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    // Downloads por plataforma
    const byPlatform = await DownloadLog.aggregate([
      {
        $group: {
          _id: '$platform',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

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
