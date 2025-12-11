import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/backend/lib/database';
import prisma from '@/backend/lib/database';
import { PLANS } from '@/lib/config/plans';
import { getJWTSecret } from '@backend/lib/secrets';

const JWT_SECRET = getJWTSecret();;

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
    const { plan, sessionId } = body;

    if (!plan || !PLANS[plan]) {
      return NextResponse.json(
        { error: 'Plano inválido' },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID é obrigatório' },
        { status: 400 }
      );
    }

    await connectDB();

    // Buscar usuário usando Prisma diretamente
    const user = await prisma.user.findUnique({
      where: { id: userData.id },
      select: {
        id: true,
        email: true,
        plan: true,
        planExpiresAt: true,
      }
    });
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const planConfig = PLANS[plan];

    // Verificar se o pagamento já foi processado pelo webhook usando Prisma diretamente
    const existingPayment = await prisma.payment.findFirst({
      where: { stripeSessionId: sessionId }
    });
    if (existingPayment && existingPayment.status === 'paid') {
      return NextResponse.json({
        success: true,
        message: 'Plano já foi ativado!',
        plan: planConfig.name,
        expiresAt: user.planExpiresAt,
      });
    }

    // Se não foi processado ainda, o webhook vai processar em breve
    // Por enquanto, apenas retornar sucesso
    return NextResponse.json({
      success: true,
      message: 'Pagamento em processamento. Seu plano será ativado em breve.',
      plan: planConfig.name,
    });

  } catch (error) {
    console.error('Erro ao completar compra:', error);
    return NextResponse.json(
      { error: 'Erro ao processar pagamento' },
      { status: 500 }
    );
  }
}

