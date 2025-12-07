import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@backend/lib/mongodb';
import User from '@models/User';
import { cookies } from 'next/headers';

const JWT_SECRET: string = process.env.JWT_SECRET as string;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
    }

    // Verificar token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    
    // Conectar ao MongoDB
    await connectDB();
    
    // Buscar usuário
    const user = await User.findById(decoded.id);

    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        fullName: user.fullName,
        role: user.role,
        plan: user.plan,
        planExpiresAt: user.planExpiresAt,
        image: user.image,
        twoFactorEnabled: user.twoFactor?.enabled || false,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
  }
}

