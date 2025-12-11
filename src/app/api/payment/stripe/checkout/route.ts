import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { PLANS, PAYMENT_URLS } from '@/lib/config/plans';
import { getJWTSecret } from '@backend/lib/secrets';

// Importação condicional do Stripe
let Stripe: any = null;
try {
  Stripe = require('stripe').default;
} catch {
  // Stripe não instalado
}

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
  // Verificar se Stripe está configurado
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!Stripe || !stripeSecretKey) {
    return NextResponse.json(
      { 
        error: "coming_soon",
        message: "Stripe payment is coming soon" 
      },
      { status: 503 }
    );
  }

  try {
    const userData = await getUserFromRequest();
    if (!userData) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 401 }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const body = await request.json();
    const { planId } = body;

    if (!planId || !PLANS[planId]) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    const plan = PLANS[planId];
    
    if (!plan.stripe?.priceId) {
      return NextResponse.json(
        { 
          error: "coming_soon",
          message: "Stripe payment is coming soon" 
        },
        { status: 503 }
      );
    }

    // Criar sessão de checkout do Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `MediaGrab ${plan.name} Plan`,
              description: `Monthly subscription - ${plan.limits.requests === -1 ? 'Unlimited' : plan.limits.requests} requests/month`,
            },
            unit_amount: Math.round(plan.price.usd * 100), // Stripe usa centavos
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${PAYMENT_URLS.completionUrl}?plan=${planId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: PAYMENT_URLS.cancelUrl,
      customer_email: userData.email,
      metadata: {
        userId: userData.id,
        planId: planId,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error: any) {
    // Não logar erro se for relacionado a Stripe não configurado
    if (!error.message?.includes('Invalid API Key') && !error.message?.includes('No API key')) {
      console.error('Stripe checkout error:', error);
    }
    
    // Se for erro de API key inválida, retornar coming soon
    if (error.message?.includes('Invalid API Key') || error.message?.includes('No API key')) {
      return NextResponse.json(
        { 
          error: "coming_soon",
          message: "Stripe payment is coming soon" 
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

