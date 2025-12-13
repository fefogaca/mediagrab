import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/backend/lib/database';
import { getJWTSecret } from '@/backend/lib/secrets';
import Settings from '@/backend/models/Settings';
import { getCookiesFilePath } from '@/backend/lib/cookies';
import YTDlpWrap from 'yt-dlp-wrap';

const JWT_SECRET = getJWTSecret();
const ytDlpWrap = new YTDlpWrap();

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

// POST - Testar cookies
export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    await connectDB();
    const body = await request.json();
    const { platform } = body; // 'instagram' ou 'youtube'

    if (!platform || (platform !== 'instagram' && platform !== 'youtube')) {
      return NextResponse.json({ 
        error: 'Plataforma inválida. Use "instagram" ou "youtube"' 
      }, { status: 400 });
    }

    // Obter cookies
    const cookiesPath = await getCookiesFilePath(platform as 'instagram' | 'youtube');
    
    if (!cookiesPath) {
      return NextResponse.json({
        success: false,
        message: `Nenhum cookie configurado para ${platform}`,
        error: 'NO_COOKIES'
      }, { status: 200 });
    }

    // URLs de teste (usar URLs reais e públicas)
    const testUrls: Record<'instagram' | 'youtube', string> = {
      instagram: 'https://www.instagram.com/reel/DRj9POGDsUI/', // Reel público conhecido
      youtube: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' // Vídeo público conhecido (Rick Roll)
    };

    const testUrl = testUrls[platform as 'instagram' | 'youtube'];

    try {
      // Tentar obter informações do vídeo usando cookies
      const args: string[] = [testUrl, '--dump-json', '--no-playlist', '--quiet'];
      args.push('--cookies', cookiesPath);

      // Timeout de 15 segundos
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 15000)
      );

      const videoInfoPromise = ytDlpWrap.execPromise(args);
      
      const output = await Promise.race([videoInfoPromise, timeoutPromise]) as string;
      const videoInfo = JSON.parse(output);

      // Se chegou aqui, os cookies funcionaram
      return NextResponse.json({
        success: true,
        message: `Cookies do ${platform} estão funcionando corretamente!`,
        testResult: {
          platform,
          title: videoInfo.title || 'Título não disponível',
          url: testUrl,
          cookiesUsed: true
        }
      });

    } catch (testError: any) {
      // Verificar se é erro de autenticação/rate limit
      const errorMessage = testError?.message || String(testError);
      const isAuthError = errorMessage.includes('login required') || 
                         errorMessage.includes('rate-limit') ||
                         errorMessage.includes('private') ||
                         errorMessage.includes('unavailable');

      if (isAuthError) {
        return NextResponse.json({
          success: false,
          message: `Cookies do ${platform} podem estar expirados ou inválidos`,
          error: 'COOKIES_INVALID',
          details: errorMessage
        }, { status: 200 });
      }

      // Outros erros (timeout, rede, etc)
      return NextResponse.json({
        success: false,
        message: `Erro ao testar cookies do ${platform}`,
        error: 'TEST_ERROR',
        details: errorMessage
      }, { status: 200 });
    }

  } catch (error: any) {
    console.error('Erro ao testar cookies:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao testar cookies', 
        message: error?.message || 'Erro desconhecido' 
      },
      { status: 500 }
    );
  }
}

