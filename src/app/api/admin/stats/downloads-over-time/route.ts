import { NextResponse } from 'next/server';
import connectDB from '@backend/lib/mongodb';
import DownloadLog from '@backend/models/DownloadLog';

export async function GET() {
  try {
    await connectDB();
    
    const logs = await DownloadLog.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);
    
    const formattedLogs = logs.map(log => ({
      date: log._id,
      count: log.count
    }));
    
    return NextResponse.json(formattedLogs, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch downloads over time:', error);
    return NextResponse.json({ message: 'Failed to fetch downloads over time', error: (error as Error).message }, { status: 500 });
  }
}
