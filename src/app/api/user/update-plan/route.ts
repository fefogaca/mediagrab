import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/backend/lib/mongodb';
import User from '@/backend/models/User';
import { PLANS } from '@/lib/config/plans';

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

export async function POST(request: NextRequest) {
  try {
    const userData = await getUserFromRequest();
    if (!userData) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { plan } = body;

    if (!plan || !PLANS[plan]) {
      return NextResponse.json(
        { error: 'Plano inválido' },
        { status: 400 }
      );
    }

    await connectDB();

    const planConfig = PLANS[plan];

    // Calcular data de expiração (1 mês a partir de agora)
    const planExpiresAt = new Date();
    planExpiresAt.setMonth(planExpiresAt.getMonth() + 1);

    // Atualizar usuário
    await User.findByIdAndUpdate(userData.id, {
      plan: plan,
      planExpiresAt,
      usageLimit: planConfig.limits.requests === -1 ? 999999 : planConfig.limits.requests,
      // Resetar uso apenas se for upgrade
    });

    return NextResponse.json({
      success: true,
      plan: plan,
      expiresAt: planExpiresAt,
    });

  } catch (error) {
    console.error('Erro ao atualizar plano:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar plano' },
      { status: 500 }
    );
  }
}

