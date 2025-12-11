import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import { getGoogleOAuthConfig, getGitHubOAuthConfig } from './oauth';

// Cache para providers OAuth
let cachedOAuthProviders: any[] | null = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 60000; // 1 minuto

/**
 * Obtém os providers OAuth do banco de dados ou env vars
 * Usa cache para evitar múltiplas consultas ao banco
 */
export async function getOAuthProviders(): Promise<any[]> {
  const now = Date.now();
  
  // Retornar cache se ainda válido
  if (cachedOAuthProviders && (now - lastCacheUpdate) < CACHE_TTL) {
    return cachedOAuthProviders;
  }
  
  const providers: any[] = [];
  
  // Google OAuth
  try {
    const googleConfig = await getGoogleOAuthConfig();
    if (googleConfig.enabled && googleConfig.clientId && googleConfig.clientSecret) {
      providers.push(
        Google({
          clientId: googleConfig.clientId,
          clientSecret: googleConfig.clientSecret,
          authorization: {
            params: {
              prompt: 'consent',
              access_type: 'offline',
              response_type: 'code',
            },
          },
        })
      );
    }
  } catch (error) {
    // Fallback para env vars
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      providers.push(
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          authorization: {
            params: {
              prompt: 'consent',
              access_type: 'offline',
              response_type: 'code',
            },
          },
        })
      );
    }
  }
  
  // GitHub OAuth
  try {
    const githubConfig = await getGitHubOAuthConfig();
    if (githubConfig.enabled && githubConfig.clientId && githubConfig.clientSecret) {
      providers.push(
        GitHub({
          clientId: githubConfig.clientId,
          clientSecret: githubConfig.clientSecret,
        })
      );
    }
  } catch (error) {
    // Fallback para env vars
    if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
      providers.push(
        GitHub({
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
        })
      );
    }
  }
  
  // Atualizar cache
  cachedOAuthProviders = providers;
  lastCacheUpdate = now;
  
  return providers;
}

/**
 * Limpa o cache de providers (útil quando configurações são atualizadas)
 */
export function clearOAuthProvidersCache() {
  cachedOAuthProviders = null;
  lastCacheUpdate = 0;
}

