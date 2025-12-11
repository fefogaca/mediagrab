import { NextResponse } from 'next/server';
import { connectDB } from '@backend/lib/database';
import prisma from '@backend/lib/database';
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
    
    const downloads = await prisma.downloadLog.findMany({
      where: { userId },
      take: 20,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ downloads }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch recent downloads:', error);
    return NextResponse.json({ message: 'Failed to fetch recent downloads', error: (error as Error).message }, { status: 500 });
  }
}
