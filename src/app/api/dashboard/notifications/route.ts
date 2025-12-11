import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectDB } from '@backend/lib/database';
import prisma from '@backend/lib/database';
import { getJWTSecret } from '@backend/lib/secrets';

const JWT_SECRET = getJWTSecret();

interface DecodedToken {
  id: string;
  email: string;
  role: string;
}

async function getUserFromRequest(): Promise<DecodedToken | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) return null;
    
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    return decoded;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const userData = await getUserFromRequest();
    if (!userData) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    // Buscar usuário para obter o plano
    const user = await prisma.user.findUnique({
      where: { id: userData.id },
      select: { id: true, plan: true }
    });

    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    // Buscar notificações que se aplicam ao usuário:
    // 1. targetAudience = 'all' (para todos)
    // 2. targetAudience = plano do usuário (ex: 'free', 'developer', etc)
    // 3. targetUserId = id do usuário (notificações específicas)
    // E que não estejam expiradas
    const userPlan = user.plan || 'free';
    const now = new Date();
    
    const notifications = await prisma.notification.findMany({
      where: {
        AND: [
          {
            OR: [
              { targetAudience: 'all' },
              { targetAudience: userPlan },
              { targetUserId: user.id },
            ],
          },
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: now } },
            ],
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Verificar quais notificações foram lidas
    const formattedNotifications = notifications.map(n => {
      const readBy = typeof n.readBy === 'string' 
        ? JSON.parse(n.readBy) 
        : Array.isArray(n.readBy) 
          ? n.readBy 
          : [];
      
      const isRead = Array.isArray(readBy) && readBy.includes(user.id);

      return {
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        target_audience: n.targetAudience,
        created_at: n.createdAt,
        isRead,
        link: n.link,
        icon: n.icon,
        priority: n.priority,
      };
    });

    return NextResponse.json({ notifications: formattedNotifications }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json({ 
      message: 'Erro ao buscar notificações', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userData = await getUserFromRequest();
    if (!userData) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    const { notificationId, markAsRead } = await request.json();

    if (!notificationId) {
      return NextResponse.json({ message: 'ID da notificação é obrigatório' }, { status: 400 });
    }

    await connectDB();

    // Buscar notificação atual
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return NextResponse.json({ message: 'Notificação não encontrada' }, { status: 404 });
    }

    // Atualizar readBy
    const readBy = typeof notification.readBy === 'string' 
      ? JSON.parse(notification.readBy) 
      : Array.isArray(notification.readBy) 
        ? notification.readBy 
        : [];

    let updatedReadBy: string[];
    if (markAsRead) {
      // Adicionar usuário à lista de lidos
      if (!readBy.includes(userData.id)) {
        updatedReadBy = [...readBy, userData.id];
      } else {
        updatedReadBy = readBy;
      }
    } else {
      // Remover usuário da lista de lidos
      updatedReadBy = readBy.filter((id: string) => id !== userData.id);
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { readBy: updatedReadBy }
    });

    return NextResponse.json({ 
      success: true,
      message: markAsRead ? 'Notificação marcada como lida' : 'Notificação marcada como não lida'
    }, { status: 200 });
  } catch (error) {
    console.error('Failed to update notification:', error);
    return NextResponse.json({ 
      message: 'Erro ao atualizar notificação', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}
