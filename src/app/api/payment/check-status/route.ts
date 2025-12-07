import { NextRequest, NextResponse } from 'next/server';

const ABACATEPAY_API_URL = 'https://api.abacatepay.com/v1';
const ABACATEPAY_API_KEY = process.env.ABACATEPAY_API_KEY || '';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const billingId = searchParams.get('billing_id');

  if (!billingId) {
    return NextResponse.json(
      { error: 'billing_id é obrigatório' },
      { status: 400 }
    );
  }

  try {
    // Verificar status do pagamento no AbacatePay
    const response = await fetch(`${ABACATEPAY_API_URL}/pixQrCode/check?id=${billingId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ABACATEPAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erro AbacatePay:', errorData);
      return NextResponse.json(
        { 
          status: 'PENDING',
          message: 'Aguardando confirmação do pagamento'
        }
      );
    }

    const data = await response.json();
    
    // Mapear status do AbacatePay
    let status = 'PENDING';
    if (data.data?.status) {
      status = data.data.status.toUpperCase();
    }

    // Se PAID, identificar o plano baseado no valor ou metadata
    let plan = null;
    if (status === 'PAID') {
      // Tentar identificar o plano pelo billingId
      if (billingId.includes('mj4gYGKxSUJhWAxUrdWs5BGJ')) {
        plan = 'developer';
      } else if (billingId.includes('SSsaFnMcCC4YEJsr4cqrwBMC')) {
        plan = 'startup';
      } else if (billingId.includes('tz0LjSeAC3YKpukqNUg3utDe')) {
        plan = 'enterprise';
      }
    }

    return NextResponse.json({
      status,
      plan,
      expiresAt: data.data?.expiresAt,
      message: status === 'PAID' 
        ? 'Pagamento confirmado!' 
        : status === 'PENDING'
        ? 'Aguardando pagamento'
        : status === 'EXPIRED'
        ? 'Pagamento expirado'
        : 'Status desconhecido'
    });

  } catch (error) {
    console.error('Erro ao verificar status:', error);
    return NextResponse.json(
      { 
        status: 'PENDING',
        message: 'Verificando status do pagamento...'
      }
    );
  }
}

