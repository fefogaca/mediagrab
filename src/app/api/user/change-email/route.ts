import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/backend/lib/database';
import prisma from '@/backend/lib/database';
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

export async function PUT(request: Request) {
  try {
    const userData = await getUserFromRequest();
    if (!userData) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    const { newEmail, verificationCode } = await request.json();

    if (!newEmail || !newEmail.includes('@')) {
      return NextResponse.json({ message: 'Email inválido' }, { status: 400 });
    }

    // TODO: Quando SendGrid estiver configurado, verificar o código real
    // Por enquanto, aceitar código temporário para desenvolvimento
    const validCode = verificationCode === '123456';
    
    if (!validCode) {
      return NextResponse.json({ message: 'Código de verificação inválido' }, { status: 400 });
    }

    await connectDB();
    
    // Verificar se o email já está em uso usando Prisma diretamente
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail.toLowerCase() }
    });
    if (existingUser && existingUser.id !== userData.id) {
      return NextResponse.json({ message: 'Este email já está em uso' }, { status: 400 });
    }
    
    // Atualizar email usando Prisma diretamente
    const user = await prisma.user.update({
      where: { id: userData.id },
      data: { 
        email: newEmail.toLowerCase(),
        emailVerified: null // Precisa verificar o novo email
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    });

    // Gerar novo token com o email atualizado
    const newToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Atualizar cookie
    const response = NextResponse.json({ 
      message: 'Email alterado com sucesso!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    }, { status: 200 });

    response.cookies.set('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    return response;
  } catch (error) {
    console.error('Erro ao alterar email:', error);
    return NextResponse.json({ message: 'Erro ao alterar email' }, { status: 500 });
  }
}
