import { NextResponse } from 'next/server';
import connectDB from '@backend/lib/mongodb';
import ApiKey from '@backend/models/ApiKey';

export async function GET() {
  try {
    await connectDB();
    
    const apiKeyUsage = await ApiKey.find()
      .select('key name usageCount userId')
      .populate('userId', 'name email')
      .sort({ usageCount: -1 })
      .limit(5)
      .lean();
    
    const formattedUsage = apiKeyUsage.map(key => ({
      key: key.key.substring(0, 8) + '...',
      name: key.name,
      download_count: key.usageCount,
      user: key.userId
    }));
    
    return NextResponse.json(formattedUsage, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch API key usage:', error);
    return NextResponse.json({ message: 'Failed to fetch API key usage', error: (error as Error).message }, { status: 500 });
  }
}
