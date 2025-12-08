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
    
    // Buscar notificações do usuário
    const notifications = await db.all(`
      SELECT n.*, u.username as created_by_username
      FROM notifications n
      LEFT JOIN users u ON n.created_by = u.id
      WHERE (n.target_audience = 'all' OR (n.target_audience = 'user' AND n.target_user_id = ?))
      ORDER BY n.created_at DESC
      LIMIT 50
    `, userId);

    return NextResponse.json(notifications, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json({ message: 'Failed to fetch notifications', error: (error as Error).message }, { status: 500 });
  }
}

