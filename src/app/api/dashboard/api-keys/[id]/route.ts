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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userData = await getUserFromRequest();
    if (!userData) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();
    
    // Verificar se a key pertence ao usuário
    const apiKey = await ApiKey.findOne({ id: id, userId: userData.id });
    
    if (!apiKey) {
      return NextResponse.json({ message: 'API Key não encontrada' }, { status: 404 });
    }

    await ApiKey.deleteOne({ id });

    return NextResponse.json({ message: 'API Key excluída com sucesso' }, { status: 200 });
  } catch (error) {
    console.error('Erro ao excluir API key:', error);
    return NextResponse.json({ message: 'Erro ao excluir API key' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userData = await getUserFromRequest();
    if (!userData) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();
    
    const apiKey = await ApiKey.findOne({ id: id, userId: userData.id });
    
    if (!apiKey) {
      return NextResponse.json({ message: 'API Key não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ 
      apiKey: {
        id: apiKey.id,
        key: apiKey.key,
        created_at: apiKey.createdAt,
        expires_at: apiKey.expiresAt,
        usage_count: apiKey.usageCount || 0,
        usage_limit: apiKey.usageLimit || 5,
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar API key:', error);
    return NextResponse.json({ message: 'Erro ao buscar API key' }, { status: 500 });
  }
}
