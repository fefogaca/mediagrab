import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@backend/lib/mongodb';
import User from '@models/User';

export async function GET() {
  try {
    await connectDB();
    
    const users = await User.find({})
      .select('_id email name role plan isActive createdAt lastLoginAt')
      .sort({ createdAt: -1 });

    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      username: user.name, // compatibilidade
      role: user.role,
      plan: user.plan,
      isActive: user.isActive,
      created_at: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    }));

    return NextResponse.json({ users: formattedUsers }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ message: 'Failed to fetch users', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, email, password, role, plan } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Nome, email e senha são obrigatórios' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ message: 'A senha deve ter pelo menos 8 caracteres' }, { status: 400 });
    }

    await connectDB();

    // Verificar se usuário já existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ message: 'Este email já está em uso' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'user',
      plan: plan || 'free',
      isActive: true,
      provider: 'credentials',
    });

    return NextResponse.json({ 
      message: 'Usuário criado com sucesso', 
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json({ message: 'Erro ao criar usuário', error: (error as Error).message }, { status: 500 });
  }
}
