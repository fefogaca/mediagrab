/**
 * Endpoint para verificar status de validação dos cookies
 * GET /api/admin/settings/cookies-status
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/backend/lib/database';
import { getJWTSecret } from '@/backend/lib/secrets';
import { cookieManager } from '@/backend/services/cookies/cookieManager';

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
    
    if (!token) {
      return false;
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
      return decoded.role === 'admin';
    } catch {
      return false;
    }
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validar todos os cookies
    const status = await cookieManager.validateAllCookies();

    return NextResponse.json({
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao verificar status dos cookies:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao verificar cookies',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
