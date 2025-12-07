import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@backend/lib/mongodb';
import User from '@models/User';

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

    // Conectar ao MongoDB
    await connectDB();

    // Verificar se usuário já existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { message: 'Este email já está em uso' },
        { status: 409 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar usuário
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'user',
      plan: 'free',
      isActive: true,
      provider: 'credentials',
    });

    return NextResponse.json(
      {
        message: 'Conta criada com sucesso',
        user: {
          id: user._id.toString(),
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
