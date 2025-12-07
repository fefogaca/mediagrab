import { NextResponse } from 'next/server';
import connectDB from '@backend/lib/mongodb';
import DownloadLog from '@backend/models/DownloadLog';

export async function GET() {
  try {
    await connectDB();
    
    const topUsers = await DownloadLog.aggregate([
      {
        $match: { userId: { $exists: true, $ne: null } }
      },
      {
        $group: {
          _id: "$userId",
          download_count: { $sum: 1 }
        }
      },
      { $sort: { download_count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          username: '$user.name',
          email: '$user.email',
          download_count: 1
        }
      }
    ]);
    
    return NextResponse.json(topUsers, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch top users:', error);
    return NextResponse.json({ message: 'Failed to fetch top users', error: (error as Error).message }, { status: 500 });
  }
}
