import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/backend/lib/database';
import prisma from '@/backend/lib/database';
import { getJWTSecret } from '@backend/lib/secrets';

const JWT_SECRET = getJWTSecret();

interface DecodedToken {
  id: string;
  email: string;
  role: string;
}

async function verifyAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) return false;
    
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    return decoded.role === 'admin';
  } catch {
    return false;
  }
}

export async function GET() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    // Conectar ao banco
    await connectDB();

    // Verificar status da conexão testando uma query simples
    try {
      await prisma.$queryRaw`SELECT 1`;
      
      // Obter contagem de tabelas principais
      const userCount = await prisma.user.count();
      const apiKeyCount = await prisma.apiKey.count();
      const paymentCount = await prisma.payment.count();
      const downloadLogCount = await prisma.downloadLog.count();
      
      const tableNames = ['users', 'api_keys', 'payments', 'download_logs', 'notifications', 'coupons', 'plans', 'accounts', 'sessions', 'verification_tokens'];

      return NextResponse.json({
        connected: true,
        type: 'PostgreSQL (Supabase)',
        tables: tableNames.length,
        tableNames,
        stats: {
          users: userCount,
          apiKeys: apiKeyCount,
          payments: paymentCount,
          downloadLogs: downloadLogCount,
        },
      });
    } catch (dbError) {
      return NextResponse.json({
        connected: false,
        type: 'PostgreSQL (Supabase)',
        tables: 0,
        tableNames: [],
        error: dbError instanceof Error ? dbError.message : 'Erro ao conectar',
      });
    }

  } catch (error) {
    console.error('Erro ao verificar banco:', error);
    return NextResponse.json({
      connected: false,
      type: 'PostgreSQL (Supabase)',
      tables: 0,
      tableNames: [],
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
}

