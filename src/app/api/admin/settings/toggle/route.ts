import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getJWTSecret } from '@backend/lib/secrets';

const JWT_SECRET = getJWTSecret();;

// Importar configurações globais (em produção seria do banco)
const globalSettings: Record<string, boolean | string | number> = {
  maintenanceMode: false,
  allowRegistration: true,
  emailVerification: true,
  twoFactorRequired: false,
};

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

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
  }

  try {
    const { key, value } = await request.json();
    
    if (!key) {
      return NextResponse.json({ error: 'Chave nao informada' }, { status: 400 });
    }

    // Atualizar configuracao
    globalSettings[key] = value;

    // Log de acao importante
    console.log(`[ADMIN] Configuracao alterada: ${key} = ${value}`);

    return NextResponse.json({ 
      success: true,
      key,
      value,
      message: `Configuracao ${key} atualizada`
    });

  } catch (error) {
    console.error('Erro ao alternar configuracao:', error);
    return NextResponse.json(
      { error: 'Erro ao alternar configuracao' },
      { status: 500 }
    );
  }
}

