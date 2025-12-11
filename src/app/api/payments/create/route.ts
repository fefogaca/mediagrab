import { NextRequest, NextResponse } from "next/server";
import { auth } from "@backend/lib/auth";
import { connectDB } from "@backend/lib/database";
import prisma from "@backend/lib/database";
import { PLANS, PAYMENT_URLS } from "@/lib/config/plans";

// Importação condicional do Stripe
let Stripe: any = null;
try {
  Stripe = require('stripe').default;
} catch {
  // Stripe não instalado
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
    // Verificar autenticação
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { plan } = body;

    // Validar plano
    if (!["developer", "startup", "enterprise"].includes(plan)) {
      return NextResponse.json(
        { error: "Plano inválido" },
        { status: 400 }
      );
    }

    await connectDB();

    // Buscar usuário usando Prisma diretamente
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        plan: true,
        planExpiresAt: true,
      }
    });
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se já tem plano pago
    if (user.plan !== "free" && user.planExpiresAt && new Date() < user.planExpiresAt) {
      return NextResponse.json(
        { error: "Você já possui um plano ativo. Cancele o atual primeiro." },
        { status: 400 }
      );
    }

    const planConfig = PLANS[plan];
    
    if (!planConfig.stripe?.priceId) {
      return NextResponse.json(
        { 
          error: "coming_soon",
          message: "Stripe payment is coming soon" 
        },
        { status: 503 }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Criar sessão de checkout do Stripe
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: planConfig.stripe.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${PAYMENT_URLS.completionUrl}?plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: PAYMENT_URLS.cancelUrl,
      customer_email: user.email,
      metadata: {
        userId: session.user.id,
        planId: plan,
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error: any) {
    // Não logar erro se for relacionado a Stripe não configurado
    if (!error.message?.includes('Invalid API Key') && !error.message?.includes('No API key')) {
      console.error("Erro ao criar pagamento:", error);
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
      { error: "Erro ao criar pagamento" },
      { status: 500 }
    );
  }
}

