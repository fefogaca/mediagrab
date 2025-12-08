import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/backend/lib/mongodb';
import User from '@/backend/models/User';
import Payment from '@/backend/models/Payment';
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
    const { plan, billingId, sessionId } = body;

    if (!plan || !PLANS[plan]) {
      return NextResponse.json(
        { error: 'Plano inválido' },
        { status: 400 }
      );
    }

    await connectDB();

    // Buscar usuário
    const user = await User.findById(userData.id);
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const planConfig = PLANS[plan];

    // Atualizar plano do usuário
    const planExpiresAt = new Date();
    planExpiresAt.setMonth(planExpiresAt.getMonth() + 1); // Plano válido por 1 mês

    await User.findByIdAndUpdate(userData.id, {
      plan: plan,
      planExpiresAt,
      usageLimit: planConfig.limits.requests === -1 ? 999999 : planConfig.limits.requests,
      usageCount: 0, // Resetar uso ao fazer upgrade
    });

    // Registrar pagamento
    await Payment.create({
      userId: userData.id,
      abacatePayBillingId: billingId || sessionId || `stripe_${Date.now()}`,
      abacatePayUrl: billingId ? undefined : undefined, // URL do AbacatePay se disponível
      amount: Math.round(planConfig.price.brl * 100), // Converter para centavos
      currency: 'BRL',
      method: 'CREDIT_CARD', // Método padrão, pode ser ajustado conforme necessário
      products: [{
        externalId: plan,
        name: planConfig.name,
        quantity: 1,
        price: Math.round(planConfig.price.brl * 100), // Em centavos
      }],
      planPurchased: plan as 'developer' | 'startup' | 'enterprise',
      planDuration: 1, // 1 mês
      status: 'paid',
      paidAt: new Date(),
      metadata: {
        planName: planConfig.name,
        expiresAt: planExpiresAt,
        provider: billingId ? 'abacatepay' : 'stripe',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Plano ativado com sucesso!',
      plan: planConfig.name,
      expiresAt: planExpiresAt,
    });

  } catch (error) {
    console.error('Erro ao completar compra:', error);
    return NextResponse.json(
      { error: 'Erro ao processar pagamento' },
      { status: 500 }
    );
  }
}

