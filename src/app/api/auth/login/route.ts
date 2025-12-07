import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from '@backend/lib/mongodb';
import User from '@models/User';

const JWT_SECRET: string = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ message: 'Email e senha são obrigatórios' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ message: 'Credenciais inválidas' }, { status: 401 });
  }

  try {
    // Conectar ao MongoDB
    await connectDB();
    
    // Buscar usuário por email
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

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

    // Atualizar último login
    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

    // Criar token JWT
    const token = jwt.sign(
      { 
        id: user._id.toString(), 
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
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan,
        image: user.image
      }
    }, { status: 200 });

    // Definir cookie com token
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
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
