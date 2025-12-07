import { NextResponse } from 'next/server';
import connectDB from '@backend/lib/mongodb';
import ApiKey from '@models/ApiKey';

export async function GET() {
  try {
    await connectDB();
    
    const total = await ApiKey.countDocuments();
    const active = await ApiKey.countDocuments({ isActive: true });
    const expired = await ApiKey.countDocuments({ 
      $or: [
        { isActive: false },
        { expiresAt: { $lt: new Date() } }
      ]
    });

    // Total de requests
    const usageStats = await ApiKey.aggregate([
      { $group: { _id: null, totalUsage: { $sum: '$usageCount' } } }
    ]);
    const totalRequests = usageStats[0]?.totalUsage || 0;

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
