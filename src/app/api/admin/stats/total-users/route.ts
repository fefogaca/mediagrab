import { NextResponse } from 'next/server';
import connectDB from '@backend/lib/mongodb';
import User from '@models/User';

export async function GET() {
  try {
    await connectDB();
    
    const total = await User.countDocuments();
    const admins = await User.countDocuments({ role: 'admin' });
    const users = await User.countDocuments({ role: 'user' });
    const activeToday = await User.countDocuments({
      lastLoginAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    return NextResponse.json({ 
      total, 
      admins,
      users,
      activeToday
    }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch total users:', error);
    return NextResponse.json({ message: 'Erro ao buscar estatísticas', error: (error as Error).message }, { status: 500 });
  }
}
