import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/backend/lib/database';
import ApiKey from '@/backend/models/ApiKey';
import { getJWTSecret } from '@backend/lib/secrets';

const JWT_SECRET = getJWTSecret();;

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
    
    const apiKeys = await ApiKey.find({ userId: userData.id });

    // Transformar para formato esperado pelo frontend
    const formattedKeys = apiKeys.map((key: any) => ({
      id: key.id,
      key: key.key,
      created_at: key.createdAt,
      expires_at: key.expiresAt,
      usage_count: key.usageCount || 0,
      usage_limit: key.usageLimit || 5,
      is_active: key.isActive,
    }));

    return NextResponse.json({ apiKeys: formattedKeys }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar API keys:', error);
    return NextResponse.json({ message: 'Erro ao buscar API keys', apiKeys: [] }, { status: 500 });
  }
}
