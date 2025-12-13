import { NextResponse } from 'next/server';
import { connectDB } from '@backend/lib/database';
import prisma from '@backend/lib/database';
import DownloadLog from '@backend/models/DownloadLog';
import ApiKey from '@backend/models/ApiKey';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getJWTSecret } from '@backend/lib/secrets';

const JWT_SECRET = getJWTSecret();

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
    
    // Fazer queries sequenciais para evitar problemas com Session Pooler
    let user;
    let totalDownloads = 0;
    let totalApiKeys = 0;
    
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          usageCount: true,
          usageLimit: true,
          plan: true,
        }
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      user = null;
    }
    
    // Pequeno delay entre queries
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
      totalDownloads = await DownloadLog.count({ userId });
    } catch (error) {
      console.error('Error counting downloads:', error);
      totalDownloads = 0;
    }
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
      totalApiKeys = await ApiKey.count({ userId });
    } catch (error) {
      console.error('Error counting API keys:', error);
      totalApiKeys = 0;
    }

    // Calcular usageCount e usageLimit
    const usageCount = user?.usageCount || 0;
    const usageLimit = user?.usageLimit || (user?.plan === 'free' ? 5 : 100);

    return NextResponse.json({ 
      totalDownloads, 
      totalApiKeys,
      usageCount,
      usageLimit
    }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch user stats:', error);
    return NextResponse.json({ 
      message: 'Failed to fetch user stats', 
      error: (error as Error).message,
      totalDownloads: 0,
      totalApiKeys: 0,
      usageCount: 0,
      usageLimit: 5
    }, { status: 500 });
  }
}
