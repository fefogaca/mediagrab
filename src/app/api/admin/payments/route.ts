import { NextResponse } from 'next/server';
import connectDB from '@backend/lib/mongodb';
import Payment from '@models/Payment';

export async function GET() {
  try {
    await connectDB();
    
    const payments = await Payment.find({})
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    const formattedPayments = payments.map(p => ({
      id: p._id.toString(),
      abacatePayBillingId: p.abacatePayBillingId,
      userId: p.userId?._id?.toString(),
      userName: (p.userId as { name?: string })?.name || 'Usuário',
      userEmail: (p.userId as { email?: string })?.email || '',
      amount: p.amount / 100, // converter de centavos para reais
      currency: p.currency,
      method: p.method,
      status: p.status,
      plan: p.planPurchased,
      createdAt: p.createdAt,
      paidAt: p.paidAt,
    }));

    // Estatísticas
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const stats = {
      totalPayments: payments.length,
      totalRevenue: (totalRevenue[0]?.total || 0) / 100,
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

