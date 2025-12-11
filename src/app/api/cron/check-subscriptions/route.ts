import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/backend/lib/database';
import prisma from '@/backend/lib/database';
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
    const expiringUsers = await prisma.user.findMany({
      where: {
        plan: { not: 'free' },
        planExpiresAt: {
          gte: now,
          lte: threeDaysFromNow,
        },
      },
    });

    // Criar notificações para planos prestes a expirar
    for (const user of expiringUsers) {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const existingNotification = await prisma.notification.findFirst({
        where: {
          targetUserId: user.id,
          type: 'warning',
          createdAt: { gte: yesterday },
        },
      });

      if (!existingNotification) {
        await Notification.create({
          targetUserId: user.id,
          targetAudience: 'specific',
          title: 'Seu plano está prestes a expirar',
          message: `Seu plano ${user.plan} expira em breve. Renove agora para não perder seus recursos.`,
          type: 'warning',
          priority: 'high',
        });
      }
    }

    // 2. Buscar usuários com plano expirado
    const expiredUsers = await prisma.user.findMany({
      where: {
        plan: { not: 'free' },
        planExpiresAt: { lt: now },
      },
    });

    // Fazer downgrade para free e notificar usando Prisma diretamente
    for (const user of expiredUsers) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan: 'free',
          usageLimit: 5, // Limite do plano free
        }
      });

      await Notification.create({
        targetUserId: user.id,
        targetAudience: 'specific',
        title: 'Seu plano expirou',
        message: `Seu plano ${user.plan} expirou. Você foi movido para o plano Free. Renove para recuperar seus recursos.`,
        type: 'error',
        priority: 'high',
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

