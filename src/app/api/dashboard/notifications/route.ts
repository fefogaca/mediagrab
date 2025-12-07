import { NextResponse } from 'next/server';
import connectDB from '@backend/lib/mongodb';
import Notification from '@backend/models/Notification';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET: string = process.env.JWT_SECRET as string;

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
    
    // Buscar notificações do usuário (all ou específicas para ele)
    const notifications = await Notification.find({
      $or: [
        { targetAudience: 'all' },
        { targetAudience: 'user', targetUserId: userId }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

    return NextResponse.json({ notifications }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json({ message: 'Failed to fetch notifications', error: (error as Error).message }, { status: 500 });
  }
}
