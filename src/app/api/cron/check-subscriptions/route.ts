import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/backend/lib/mongodb';
import User from '@/backend/models/User';
import Notification from '@/backend/models/Notification';

// Este endpoint deve ser chamado por um cron job diariamente
// Verifica planos próximos da expiração e expirados

export async function GET(request: NextRequest) {
  // Verificar token de autenticação do cron
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    // 1. Buscar usuários com plano expirando em 3 dias
    const expiringUsers = await User.find({
      plan: { $ne: 'free' },
      planExpiresAt: {
        $gte: now,
        $lte: threeDaysFromNow,
      },
    });

    // Criar notificações para planos prestes a expirar
    for (const user of expiringUsers) {
      const existingNotification = await Notification.findOne({
        userId: user._id,
        type: 'subscription_expiring',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Últimas 24h
      });

      if (!existingNotification) {
        await Notification.create({
          userId: user._id,
          title: 'Seu plano está prestes a expirar',
          message: `Seu plano ${user.plan} expira em breve. Renove agora para não perder seus recursos.`,
          type: 'subscription_expiring',
          priority: 'high',
          read: false,
          metadata: {
            plan: user.plan,
            expiresAt: user.planExpiresAt,
          },
        });
      }
    }

    // 2. Buscar usuários com plano expirado
    const expiredUsers = await User.find({
      plan: { $ne: 'free' },
      planExpiresAt: { $lt: now },
    });

    // Fazer downgrade para free e notificar
    for (const user of expiredUsers) {
      await User.findByIdAndUpdate(user._id, {
        plan: 'free',
        usageLimit: 5, // Limite do plano free
      });

      await Notification.create({
        userId: user._id,
        title: 'Seu plano expirou',
        message: `Seu plano ${user.plan} expirou. Você foi movido para o plano Free. Renove para recuperar seus recursos.`,
        type: 'subscription_expired',
        priority: 'high',
        read: false,
        metadata: {
          previousPlan: user.plan,
          expiredAt: user.planExpiresAt,
        },
      });
    }

    return NextResponse.json({
      success: true,
      expiringCount: expiringUsers.length,
      expiredCount: expiredUsers.length,
      message: `Verificação concluída. ${expiringUsers.length} avisos de expiração, ${expiredUsers.length} planos expirados.`,
    });

  } catch (error) {
    console.error('Erro ao verificar assinaturas:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar assinaturas' },
      { status: 500 }
    );
  }
}

