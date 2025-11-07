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
    
    // Buscar notificações do usuário ou todas se for admin
    const user = await db.get('SELECT role FROM users WHERE id = ?', userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    let notifications;
    if (user.role === 'admin') {
      // Admin vê todas as notificações
      notifications = await db.all(`
        SELECT n.*, u.username as created_by_username
        FROM notifications n
        LEFT JOIN users u ON n.created_by = u.id
        ORDER BY n.created_at DESC
        LIMIT 50
      `);
    } else {
      // Usuário vê apenas suas notificações
      notifications = await db.all(`
        SELECT n.*, u.username as created_by_username
        FROM notifications n
        LEFT JOIN users u ON n.created_by = u.id
        WHERE (n.target_audience = 'all' OR (n.target_audience = 'user' AND n.target_user_id = ?))
        ORDER BY n.created_at DESC
        LIMIT 50
      `, userId);
    }

    return NextResponse.json(notifications, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json({ message: 'Failed to fetch notifications', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await openDb().then(db => db.get('SELECT role FROM users WHERE id = ?', userId));
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { title, message, type, target_audience, target_user_id } = await request.json();

    if (!title || !message) {
      return NextResponse.json({ message: 'Title and message are required' }, { status: 400 });
    }

    const db = await openDb();
    const result = await db.run(
      'INSERT INTO notifications (title, message, type, target_audience, target_user_id, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      title,
      message,
      type || 'info',
      target_audience || 'all',
      target_user_id || null,
      userId
    );

    return NextResponse.json({ message: 'Notification created successfully', id: result.lastID }, { status: 201 });
  } catch (error) {
    console.error('Failed to create notification:', error);
    return NextResponse.json({ message: 'Failed to create notification', error: (error as Error).message }, { status: 500 });
  }
}

