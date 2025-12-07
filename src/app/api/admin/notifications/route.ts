import { NextResponse } from 'next/server';
import connectDB from '@backend/lib/mongodb';
import Notification from '@models/Notification';
import User from '@models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET: string = process.env.JWT_SECRET as string;

function getUserFromRequest(request: Request): { id: string; role: string } | null {
  try {
    const cookies = request.headers.get('cookie');
    if (cookies) {
      const tokenMatch = cookies.match(/token=([^;]+)/);
      if (tokenMatch) {
        const decoded = jwt.verify(tokenMatch[1], JWT_SECRET) as { id: string; role: string };
        return decoded;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const notifications = await Notification.find({})
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    const formattedNotifications = notifications.map(n => ({
      id: n._id.toString(),
      title: n.title,
      message: n.message,
      type: n.type,
      target_audience: n.targetAudience,
      created_at: n.createdAt,
      created_by_name: (n.createdBy as { name?: string })?.name || 'Sistema',
    }));

    return NextResponse.json({ notifications: formattedNotifications }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json({ message: 'Erro ao buscar notificações', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
    }

    const { title, message, type, target_audience } = await request.json();

    if (!title || !message) {
      return NextResponse.json({ message: 'Título e mensagem são obrigatórios' }, { status: 400 });
    }

    await connectDB();

    const notification = await Notification.create({
      title,
      message,
      type: type || 'info',
      targetAudience: target_audience || 'all',
      createdBy: user.id,
    });

    return NextResponse.json({ 
      message: 'Notificação criada com sucesso', 
      notification: {
        id: notification._id.toString(),
        title: notification.title,
        message: notification.message,
        type: notification.type,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create notification:', error);
    return NextResponse.json({ message: 'Erro ao criar notificação', error: (error as Error).message }, { status: 500 });
  }
}
