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

    const { newEmail, verificationCode } = await request.json();

    if (!newEmail || !newEmail.includes('@')) {
      return NextResponse.json({ message: 'Email inválido' }, { status: 400 });
    }

    // TODO: Quando SendGrid estiver configurado, verificar o código real
    // Por enquanto, aceitar código temporário para desenvolvimento
    const validCode = verificationCode === '123456';
    
    if (!validCode) {
      return NextResponse.json({ message: 'Código de verificação inválido' }, { status: 400 });
    }

    await connectDB();
    
    // Verificar se o email já está em uso
    const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
    if (existingUser && existingUser._id.toString() !== userData.id) {
      return NextResponse.json({ message: 'Este email já está em uso' }, { status: 400 });
    }
    
    const user = await User.findByIdAndUpdate(
      userData.id,
      { 
        email: newEmail.toLowerCase(),
        emailVerified: false // Precisa verificar o novo email
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    // Gerar novo token com o email atualizado
    const newToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Atualizar cookie
    const response = NextResponse.json({ 
      message: 'Email alterado com sucesso!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      }
    }, { status: 200 });

    response.cookies.set('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    return response;
  } catch (error) {
    console.error('Erro ao alterar email:', error);
    return NextResponse.json({ message: 'Erro ao alterar email' }, { status: 500 });
  }
}
