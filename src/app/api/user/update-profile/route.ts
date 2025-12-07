import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
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

    const { name } = await request.json();

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ message: 'Nome deve ter pelo menos 2 caracteres' }, { status: 400 });
    }

    await connectDB();
    
    const user = await User.findByIdAndUpdate(
      userData.id,
      { name: name.trim() },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Perfil atualizado com sucesso!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json({ message: 'Erro ao atualizar perfil' }, { status: 500 });
  }
}
