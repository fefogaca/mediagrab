import { NextResponse } from 'next/server';
import { connectDB } from '@backend/lib/database';
import prisma from '@backend/lib/database';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getJWTSecret } from '@backend/lib/secrets';

const JWT_SECRET = getJWTSecret();

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    
    // Só permitir se já for admin ou se for o primeiro usuário
    await connectDB();
    
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id }
    });
    if (!currentUser) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ message: 'Email é obrigatório' }, { status: 400 });
    }

    // Buscar usuário pelo email usando Prisma diretamente
    const targetUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!targetUser) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    // Atualizar usuário para admin usando Prisma diretamente
    const user = await prisma.user.update({
      where: { id: targetUser.id },
      data: { role: 'admin' },
      select: {
        id: true,
        email: true,
        role: true,
      }
    });

    return NextResponse.json({ 
      message: 'Usuário atualizado para admin com sucesso',
      user: {
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erro ao tornar usuário admin:', error);
    return NextResponse.json({ 
      message: 'Erro ao atualizar usuário', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}

