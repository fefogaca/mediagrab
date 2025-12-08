import { NextResponse } from 'next/server';
import { openDb } from '@/lib/database';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/utils';

interface DecodedToken {
  id: number;
  username: string;
  role: string;
}

function getUserIdFromRequest(request: Request): number | null {
  try {
    const jwtSecret = getJwtSecret();
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      // Tentar pegar do cookie
      const cookies = request.headers.get('cookie');
      if (cookies) {
        const tokenMatch = cookies.match(/token=([^;]+)/);
        if (tokenMatch) {
          const decoded = jwt.verify(tokenMatch[1], jwtSecret);
          if (typeof decoded !== 'string' && 'id' in decoded) {
            return (decoded as DecodedToken).id;
          }
        }
      }
      return null;
    }
    const decoded = jwt.verify(token, jwtSecret);
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
    const { totalDownloads } = await db.get('SELECT COUNT(*) as totalDownloads FROM download_logs WHERE user_id = ?', userId);
    const { totalApiKeys } = await db.get('SELECT COUNT(*) as totalApiKeys FROM api_keys WHERE user_id = ?', userId);

    return NextResponse.json({ totalDownloads, totalApiKeys }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch user stats:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Failed to fetch user stats', error: (error as Error).message }, { status: 500 });
  }
}
