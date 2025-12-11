import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@backend/lib/database';
import prisma from '@backend/lib/database';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    // Validações
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: 'A senha deve ter pelo menos 8 caracteres' },
        { status: 400 }
      );
    }

    // Conectar ao banco de dados
    await connectDB();

    // Verificar se usuário já existe usando Prisma diretamente
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    if (existingUser) {
      return NextResponse.json(
        { message: 'Este email já está em uso' },
        { status: 409 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar usuário usando Prisma diretamente
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'user',
        plan: 'free',
        isActive: true,
        provider: 'credentials',
      },
      select: {
        id: true,
        name: true,
        email: true,
      }
    });

    return NextResponse.json(
      {
        message: 'Conta criada com sucesso',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar conta:', error);
    return NextResponse.json(
      { message: 'Erro ao criar conta', error: (error as Error).message },
      { status: 500 }
    );
  }
}
