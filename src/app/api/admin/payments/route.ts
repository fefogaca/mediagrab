import { NextResponse } from 'next/server';
import { connectDB } from '@backend/lib/database';
import prisma from '@backend/lib/database';

export async function GET() {
  try {
    await connectDB();
    
    const payments = await prisma.payment.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const formattedPayments = payments.map(p => ({
      id: p.id,
      stripeSessionId: p.stripeSessionId,
      stripeSubscriptionId: p.stripeSubscriptionId,
      userId: p.userId,
      userName: p.user?.name || 'Usuário',
      userEmail: p.user?.email || '',
      amount: p.amount / 100, // converter de centavos para dólares
      currency: p.currency,
      method: p.method,
      status: p.status,
      plan: p.planPurchased,
      createdAt: p.createdAt,
      paidAt: p.paidAt,
    }));

    // Estatísticas
    const totalRevenueResult = await prisma.payment.aggregate({
      where: { status: 'paid' },
      _sum: { amount: true }
    });

    const stats = {
      totalPayments: payments.length,
      totalRevenue: (totalRevenueResult._sum.amount || 0) / 100,
      pendingCount: payments.filter(p => p.status === 'pending').length,
      paidCount: payments.filter(p => p.status === 'paid').length,
    };

    return NextResponse.json({ 
      payments: formattedPayments,
      stats
    }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch payments:', error);
    return NextResponse.json({ message: 'Erro ao buscar pagamentos', error: (error as Error).message }, { status: 500 });
  }
}

