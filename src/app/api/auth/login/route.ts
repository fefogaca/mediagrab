import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB } from '@backend/lib/database';
import prisma from '@backend/lib/database';
import { getJWTSecret } from '@backend/lib/secrets';

const JWT_SECRET = getJWTSecret();

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ message: 'Email e senha são obrigatórios' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ message: 'Credenciais inválidas' }, { status: 401 });
  }

  try {
    // Conectar ao banco de dados
    await connectDB();
    
    // Buscar usuário por email usando Prisma diretamente
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        plan: true,
        image: true,
        isActive: true,
      }
    });

    if (!user) {
      return NextResponse.json({ message: 'Credenciais inválidas' }, { status: 401 });
    }

    if (!user.password) {
      return NextResponse.json({ message: 'Este usuário usa login social. Use Google ou GitHub.' }, { status: 401 });
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Credenciais inválidas' }, { status: 401 });
    }

    // Verificar se usuário está ativo
    if (!user.isActive) {
      return NextResponse.json({ message: 'Conta desativada. Entre em contato com o suporte.' }, { status: 403 });
    }

    // Atualizar último login usando Prisma diretamente
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Criar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        role: user.role,
        plan: user.plan
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({ 
      message: 'Login realizado com sucesso', 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan,
        image: user.image
      }
    }, { status: 200 });

    // Definir cookie com token
    // Verificar se está em HTTPS através de variável de ambiente ou header
    const isSecure = process.env.NODE_ENV === 'production' && 
                     (process.env.NEXT_PUBLIC_USE_HTTPS === 'true' || 
                      request.headers.get('x-forwarded-proto') === 'https');

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: isSecure, // Só usar secure se realmente estiver em HTTPS
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    return response;
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json({ message: 'Erro ao fazer login', error: (error as Error).message }, { status: 500 });
  }
}
