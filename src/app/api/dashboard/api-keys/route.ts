import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { connectDB } from '@/backend/lib/database';
import User from '@/backend/models/User';
import ApiKey from '@/backend/models/ApiKey';
import { getJWTSecret } from '@backend/lib/secrets';

const JWT_SECRET = getJWTSecret();;

interface DecodedToken {
  id: string;
  email: string;
  role: string;
}

// Limites de API Keys e requests por plano
const PLAN_LIMITS = {
  free: { maxKeys: 1, requestLimit: 5 },
  developer: { maxKeys: 5, requestLimit: 1000 },
  startup: { maxKeys: 20, requestLimit: 10000 },
  enterprise: { maxKeys: -1, requestLimit: -1 }, // Ilimitado
};

async function getUserFromRequest(): Promise<DecodedToken | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) return null;
    
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    return decoded;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const userData = await getUserFromRequest();
    if (!userData) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();
    
    const apiKeys = await ApiKey.find({ userId: userData.id });

    return NextResponse.json({ apiKeys }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar API keys:', error);
    return NextResponse.json({ message: 'Erro ao buscar API keys' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const userData = await getUserFromRequest();
    if (!userData) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();
    
    // Buscar usuário para verificar plano e email verificado
    const user = await User.findById(userData.id);
    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar se email está verificado (preparado para SendGrid)
    // Por enquanto, permitir criação mesmo sem verificação
    const requireEmailVerification = false; // Mudar para true quando SendGrid estiver configurado
    if (requireEmailVerification && !user.emailVerified) {
      return NextResponse.json({ 
        message: 'Você precisa verificar seu email antes de criar uma API Key',
        requiresEmailVerification: true 
      }, { status: 403 });
    }

    // Verificar limites do plano
    const plan = user.plan || 'free';
    const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
    
    // Contar keys existentes
    const existingKeysCount = await ApiKey.count({ userId: user.id, isActive: true });
    
    if (limits.maxKeys !== -1 && existingKeysCount >= limits.maxKeys) {
      return NextResponse.json({ 
        message: `Você atingiu o limite de ${limits.maxKeys} API Key(s) do plano ${plan}. Faça upgrade para criar mais.` 
      }, { status: 403 });
    }

    // Criar nova API Key
    const apiKeyValue = `mg_${uuidv4().replace(/-/g, '')}`;
    const keyNumber = existingKeysCount + 1;
    
    // Determinar usageLimit (não pode ser -1 no Prisma, usar um valor alto para ilimitado)
    const usageLimit = limits.requestLimit === -1 ? 999999999 : limits.requestLimit;
    
    console.log('Criando API Key com dados:', {
      key: apiKeyValue.substring(0, 10) + '...',
      name: `API Key ${keyNumber}`,
      userId: user.id,
      usageLimit,
      plan
    });
    
    const apiKey = await ApiKey.create({
      key: apiKeyValue,
      name: `API Key ${keyNumber}`,
      user: { connect: { id: user.id } },  // ✅ Correto - usar relação
      usageLimit: usageLimit,
      usageCount: 0,
      isActive: true,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    if (!apiKey) {
      throw new Error('Falha ao criar API Key - retorno nulo');
    }

    console.log('API Key criada com sucesso:', apiKey.id);

    return NextResponse.json({ 
      message: 'API Key criada com sucesso!',
      apiKey: {
        id: apiKey.id,
        key: apiKey.key,
        created_at: apiKey.createdAt,
        expires_at: apiKey.expiresAt,
        usage_count: apiKey.usageCount,
        usage_limit: apiKey.usageLimit,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar API key:', error);
    console.error('Stack trace:', (error as Error).stack);
    return NextResponse.json({ 
      message: 'Erro ao criar API key', 
      error: (error as Error).message,
      details: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    }, { status: 500 });
  }
}
