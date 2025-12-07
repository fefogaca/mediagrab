import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import connectDB from '@/backend/lib/mongodb';
import User from '@/backend/models/User';

const JWT_SECRET = process.env.JWT_SECRET || '';

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

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: 'Senha atual e nova senha são obrigatórias' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ message: 'A nova senha deve ter pelo menos 8 caracteres' }, { status: 400 });
    }

    await connectDB();
    
    const user = await User.findById(userData.id).select('+password');
    
    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar senha atual
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Senha atual incorreta' }, { status: 400 });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Atualizar senha
    user.password = hashedPassword;
    await user.save();

    return NextResponse.json({ 
      message: 'Senha alterada com sucesso!'
    }, { status: 200 });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return NextResponse.json({ message: 'Erro ao alterar senha' }, { status: 500 });
  }
}
