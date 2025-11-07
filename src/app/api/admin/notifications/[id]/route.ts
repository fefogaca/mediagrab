import { NextRequest, NextResponse } from 'next/server';
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = await openDb();
    
    // Marcar notificação como lida
    await db.run(
      'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = ?',
      id
    );

    return NextResponse.json({ message: 'Notification marked as read' }, { status: 200 });
  } catch (error) {
    console.error('Failed to update notification:', error);
    return NextResponse.json({ message: 'Failed to update notification', error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await openDb().then(db => db.get('SELECT role FROM users WHERE id = ?', userId));
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const db = await openDb();
    await db.run('DELETE FROM notifications WHERE id = ?', id);

    return NextResponse.json({ message: 'Notification deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete notification:', error);
    return NextResponse.json({ message: 'Failed to delete notification', error: (error as Error).message }, { status: 500 });
  }
}

