
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
      // Tentar pegar do cookie
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
    const apiKeys = await db.all('SELECT id, key, user_id, created_at, expires_at, usage_count, usage_limit FROM api_keys WHERE user_id = ?', userId);

    return NextResponse.json(apiKeys, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch API keys:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Failed to fetch API keys', error: (error as Error).message }, { status: 500 });
  }
}
