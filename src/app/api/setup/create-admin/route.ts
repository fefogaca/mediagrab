import { NextResponse } from 'next/server';
import { connectDB } from '@backend/lib/database';
import prisma from '@backend/lib/database';
import User from '@backend/models/User';
import bcrypt from 'bcryptjs';

// POST - Cria o primeiro administrador (só funciona se não houver nenhum admin)
export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    // Validações
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 8 caracteres' },
        { status: 400 }
      );
    }

    if (!email.includes('@')) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verificar se já existe um admin (segurança) usando Prisma diretamente
    const adminCount = await prisma.user.count({
      where: { role: 'admin' }
    });
    if (adminCount > 0) {
      return NextResponse.json(
        { error: 'Já existe um administrador configurado. Use o login normal.' },
        { status: 403 }
      );
    }

    // Verificar se o email já está em uso
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está em uso' },
        { status: 400 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar o administrador
    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      plan: 'enterprise',
      emailVerified: new Date(), // Deve ser Date, não boolean
      isActive: true,
    });

    // Também criar um usuário guest para API keys públicas
    const guestExists = await User.findOne({ email: 'guest@mediagrab.local' });
    if (!guestExists) {
      await User.create({
        name: 'Guest User',
        email: 'guest@mediagrab.local',
        password: await bcrypt.hash('guest-no-login-allowed', 12),
        role: 'user',
        plan: 'free',
        emailVerified: new Date(), // Deve ser Date, não boolean
        isActive: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Administrador criado com sucesso!',
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      }
    });
  } catch (error) {
    console.error('Erro ao criar admin:', error);
    return NextResponse.json(
      { error: 'Erro ao criar administrador' },
      { status: 500 }
    );
  }
}
