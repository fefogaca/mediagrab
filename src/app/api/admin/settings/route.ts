import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/backend/lib/database';
import { getJWTSecret } from '@/backend/lib/secrets';
import Settings from '@/backend/models/Settings';
import { clearOAuthProvidersCache } from '@/backend/lib/auth-providers';

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
      console.log('❌ Nenhum token encontrado');
      return false;
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
      const isAdmin = decoded.role === 'admin';
      if (!isAdmin) {
        console.log('❌ Usuário não é admin. Role:', decoded.role);
      }
      return isAdmin;
    } catch (jwtError: any) {
      console.error('❌ Erro ao verificar JWT:', jwtError?.message);
      return false;
    }
  } catch (error: any) {
    console.error('❌ Erro em verifyAdmin:', error?.message);
    return false;
  }
}

export async function GET() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    await connectDB();
    const settings = await Settings.getSettings();
    
    // Formatar resposta para compatibilidade com frontend
    // Converter JSONB para objetos JavaScript
    const formattedSettings = {
      siteName: settings.siteName,
      siteUrl: settings.siteUrl,
      supportEmail: settings.supportEmail,
      maintenanceMode: settings.maintenanceMode,
      allowRegistration: settings.allowRegistration,
      emailVerification: settings.emailVerification,
      twoFactorRequired: settings.twoFactorRequired,
      maxApiKeysPerUser: settings.maxApiKeysPerUser,
      defaultDailyLimit: settings.defaultDailyLimit,
      rateLimitPerMinute: settings.rateLimitPerMinute,
      googleOAuth: typeof settings.googleOAuth === 'string' 
        ? JSON.parse(settings.googleOAuth) 
        : settings.googleOAuth,
      githubOAuth: typeof settings.githubOAuth === 'string'
        ? JSON.parse(settings.githubOAuth)
        : settings.githubOAuth,
      sendGrid: typeof settings.sendGrid === 'string'
        ? JSON.parse(settings.sendGrid)
        : settings.sendGrid,
      stripe: typeof settings.stripe === 'string'
        ? JSON.parse(settings.stripe)
        : settings.stripe,
    };

    return NextResponse.json({ settings: formattedSettings });
  } catch (error: any) {
    console.error('Erro ao buscar configurações:', error);
    console.error('Stack:', error?.stack);
    return NextResponse.json({ 
      error: 'Erro ao buscar configurações',
      message: error?.message || 'Erro desconhecido',
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    await connectDB();
    const body = await request.json();
    
    // Atualizar configurações no banco de dados
    const updatedSettings = await Settings.updateSettings({
      siteName: body.siteName,
      siteUrl: body.siteUrl,
      supportEmail: body.supportEmail,
      maintenanceMode: body.maintenanceMode,
      allowRegistration: body.allowRegistration,
      emailVerification: body.emailVerification,
      twoFactorRequired: body.twoFactorRequired,
      maxApiKeysPerUser: body.maxApiKeysPerUser,
      defaultDailyLimit: body.defaultDailyLimit,
      rateLimitPerMinute: body.rateLimitPerMinute,
      googleOAuth: body.googleOAuth,
      githubOAuth: body.githubOAuth,
      sendGrid: body.sendGrid,
      stripe: body.stripe,
    });

    // Limpar cache de OAuth providers para recarregar com novas configurações
    if (body.googleOAuth || body.githubOAuth) {
      clearOAuthProvidersCache();
    }

    // Formatar resposta
    const formattedSettings = {
      siteName: updatedSettings.siteName,
      siteUrl: updatedSettings.siteUrl,
      supportEmail: updatedSettings.supportEmail,
      maintenanceMode: updatedSettings.maintenanceMode,
      allowRegistration: updatedSettings.allowRegistration,
      emailVerification: updatedSettings.emailVerification,
      twoFactorRequired: updatedSettings.twoFactorRequired,
      maxApiKeysPerUser: updatedSettings.maxApiKeysPerUser,
      defaultDailyLimit: updatedSettings.defaultDailyLimit,
      rateLimitPerMinute: updatedSettings.rateLimitPerMinute,
      googleOAuth: updatedSettings.googleOAuth as any,
      githubOAuth: updatedSettings.githubOAuth as any,
      sendGrid: updatedSettings.sendGrid as any,
      stripe: updatedSettings.stripe as any,
    };

    return NextResponse.json({ 
      success: true,
      message: 'Configurações salvas',
      settings: formattedSettings 
    });

  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar configurações' },
      { status: 500 }
    );
  }
}

