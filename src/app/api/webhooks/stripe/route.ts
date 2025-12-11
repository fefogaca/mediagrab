import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@backend/lib/database';
import prisma from '@backend/lib/database';
import Payment from '@models/Payment';
import { sendPaymentConfirmation } from '@services/email';
import { PLANS } from '@/lib/config/plans';

// Importação condicional do Stripe
let Stripe: any = null;
try {
  Stripe = require('stripe').default;
} catch {
  // Stripe não instalado
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

const stripe = (Stripe && stripeSecretKey) ? new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
}) : null;

export async function POST(request: NextRequest) {
  if (!stripe || !webhookSecret) {
    // Não logar erro, apenas retornar silenciosamente
    return NextResponse.json(
      { received: true },
      { status: 200 }
    );
  }

  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    let event: any;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    await connectDB();

    // Processar evento
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;

        if (!userId || !planId) {
          console.error('Missing metadata in checkout session:', session.id);
          break;
        }

        const plan = PLANS[planId];
        if (!plan) {
          console.error('Invalid plan ID:', planId);
          break;
        }

        // Buscar ou criar customer no Stripe
        let customerId = session.customer as string;
        if (!customerId && session.customer_email) {
          // Criar customer se não existir
          const customer = await stripe.customers.create({
            email: session.customer_email,
            metadata: {
              userId: userId,
            },
          });
          customerId = customer.id;
        }

        // Obter detalhes da subscription se disponível
        let subscription = null;
        let amount = Math.round(plan.price.usd * 100);
        if (session.subscription) {
          subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          if (subscription.items.data.length > 0) {
            amount = subscription.items.data[0].price.unit_amount || amount;
          }
        } else if (session.amount_total) {
          amount = session.amount_total;
        }

        // Calcular data de expiração baseada na subscription
        let planExpiresAt = new Date();
        if (subscription && subscription.current_period_end) {
          planExpiresAt = new Date(subscription.current_period_end * 1000);
        } else {
          planExpiresAt.setMonth(planExpiresAt.getMonth() + 1); // 1 mês padrão
        }

        // Atualizar plano do usuário usando Prisma diretamente
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: planId,
            planExpiresAt,
            usageLimit: plan.limits.requests === -1 ? 999999 : plan.limits.requests,
            usageCount: 0,
            stripeCustomerId: customerId,
            stripeSubscriptionId: session.subscription as string | undefined,
          }
        });

        // Registrar pagamento
        await Payment.create({
          userId,
          stripeSessionId: session.id,
          stripeSubscriptionId: session.subscription as string | undefined,
          amount: amount,
          currency: session.currency?.toUpperCase() || 'USD',
          method: 'CREDIT_CARD',
          products: [{
            externalId: planId,
            name: plan.name,
            quantity: 1,
            price: amount,
          }],
          planPurchased: planId as 'developer' | 'startup' | 'enterprise',
          planDuration: 1,
          status: 'paid',
          paidAt: new Date(),
          metadata: {
            planName: plan.name,
            expiresAt: planExpiresAt,
            provider: 'stripe',
          },
        });

        // Enviar email de confirmação usando Prisma diretamente
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            email: true,
            name: true,
          }
        });
        if (user) {
          await sendPaymentConfirmation(
            user.email,
            user.name,
            plan.name,
            amount / 100,
            'CREDIT_CARD'
          );
        }

        console.log(`✅ Plano ${planId} ativado para usuário ${userId}`);
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        // Buscar usuário pelo customer ID usando Prisma diretamente
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: subscription.customer as string }
        });
        if (!user) {
          console.error('User not found for subscription:', subscription.id);
          break;
        }

        if (event.type === 'customer.subscription.deleted' || subscription.status === 'canceled') {
          // Reverter para plano free usando Prisma diretamente
          await prisma.user.update({
            where: { id: user.id },
            data: {
              plan: 'free',
              planExpiresAt: null,
            }
          });
          console.log(`↩️ Plano revertido para free: usuário ${user.id}`);
        } else if (subscription.status === 'active') {
          // Atualizar data de expiração usando Prisma diretamente
          const expiresAt = new Date(subscription.current_period_end * 1000);
          await prisma.user.update({
            where: { id: user.id },
            data: {
              planExpiresAt: expiresAt,
            }
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId as string }
        });
        if (user) {
          console.log(`⚠️ Pagamento falhou para usuário ${user.id}`);
          // Opcional: enviar email de notificação
        }
        break;
      }

      default:
        console.log(`⚠️ Evento não tratado: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

