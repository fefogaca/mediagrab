import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@backend/lib/database';
import Payment from '@models/Payment';

// Importação condicional do Stripe
let Stripe: any = null;
try {
  Stripe = require('stripe').default;
} catch {
  // Stripe não instalado
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'session_id é obrigatório' },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    // Verificar no banco de dados primeiro
    const payment = await Payment.findOne({ stripeSessionId: sessionId });
    if (payment) {
      return NextResponse.json({
        status: payment.status.toUpperCase(),
        plan: payment.planPurchased || null,
        expiresAt: payment.expiresAt,
        message: payment.status === 'paid' 
          ? 'Pagamento confirmado!' 
          : payment.status === 'pending'
          ? 'Aguardando pagamento'
          : payment.status === 'failed'
          ? 'Pagamento falhou'
          : 'Status desconhecido'
      });
    }

    // Se não encontrou no banco, verificar no Stripe
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (Stripe && stripeSecretKey) {
      try {
        const stripe = new Stripe(stripeSecretKey, {
          apiVersion: '2023-10-16',
        });

        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        return NextResponse.json({
          status: session.payment_status === 'paid' ? 'PAID' : 'PENDING',
          plan: session.metadata?.planId || null,
          message: session.payment_status === 'paid' 
            ? 'Pagamento confirmado!' 
            : 'Aguardando pagamento'
        });
      } catch (error: any) {
        // Se for erro de API key, não logar
        if (!error.message?.includes('Invalid API Key') && !error.message?.includes('No API key')) {
          console.error('Erro ao verificar sessão Stripe:', error);
        }
      }
    }

    return NextResponse.json({
      status: 'PENDING',
      message: 'Verificando status do pagamento...'
    });

  } catch (error: any) {
    // Não logar erro se for relacionado a Stripe não configurado
    if (!error.message?.includes('Invalid API Key') && !error.message?.includes('No API key')) {
      console.error('Erro ao verificar status:', error);
    }
    
    return NextResponse.json(
      { 
        status: 'PENDING',
        message: 'Verificando status do pagamento...'
      }
    );
  }
}

