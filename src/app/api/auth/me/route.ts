import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@backend/lib/database';
import prisma from '@backend/lib/database';
import { cookies } from 'next/headers';
import { getJWTSecret } from '@backend/lib/secrets';

const JWT_SECRET = getJWTSecret();

// Type guard para verificar se twoFactor é um objeto com enabled
function isTwoFactorObject(twoFactor: unknown): twoFactor is { enabled: boolean } {
  return (
    typeof twoFactor === 'object' &&
    twoFactor !== null &&
    'enabled' in twoFactor &&
    typeof (twoFactor as { enabled: unknown }).enabled === 'boolean'
  );
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
    }

    // Verificar token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    
    // Conectar ao banco de dados
    await connectDB();
    
    // Buscar usuário usando Prisma diretamente
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        fullName: true,
        role: true,
        plan: true,
        planExpiresAt: true,
        image: true,
        twoFactor: true,
        createdAt: true,
      }
    });

    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar e extrair twoFactor de forma segura
    const twoFactorEnabled = isTwoFactorObject(user.twoFactor) 
      ? user.twoFactor.enabled 
      : false;

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        fullName: user.fullName,
        role: user.role,
        plan: user.plan,
        planExpiresAt: user.planExpiresAt,
        image: user.image,
        twoFactorEnabled,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
  }
}

