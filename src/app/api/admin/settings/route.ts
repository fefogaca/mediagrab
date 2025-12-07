import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/backend/lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET || '';

// Em produção, isso seria armazenado no banco de dados
let globalSettings = {
  siteName: "MediaGrab",
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || "https://mediagrab.com",
  supportEmail: "support@mediagrab.com",
  maintenanceMode: false,
  allowRegistration: true,
  emailVerification: true,
  twoFactorRequired: false,
  maxApiKeysPerUser: 5,
  defaultDailyLimit: 100,
  rateLimitPerMinute: 60,
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

export async function GET() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  return NextResponse.json({ settings: globalSettings });
}

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Atualizar configurações
    globalSettings = {
      ...globalSettings,
      ...body,
    };

    // Em produção, salvar no banco de dados
    // await Settings.findOneAndUpdate({}, globalSettings, { upsert: true });

    return NextResponse.json({ 
      success: true,
      message: 'Configurações salvas',
      settings: globalSettings 
    });

  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar configurações' },
      { status: 500 }
    );
  }
}

// Exportar configurações para uso em outros lugares
export function getGlobalSettings() {
  return globalSettings;
}

