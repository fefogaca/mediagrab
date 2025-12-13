import fs from 'fs';
import path from 'path';
import os from 'os';
import Settings from '../models/Settings';

interface CookiesData {
  instagram: string;
  youtube: string;
}

/**
 * Obtém os cookies do banco de dados
 */
export async function getCookies(): Promise<CookiesData> {
  try {
    const settings = await Settings.getSettings();
    const cookies = typeof settings.cookies === 'string'
      ? JSON.parse(settings.cookies)
      : settings.cookies || { instagram: "", youtube: "" };
    
    return cookies as CookiesData;
  } catch (error) {
    console.error('Erro ao obter cookies:', error);
    return { instagram: "", youtube: "" };
  }
}

/**
 * Escreve cookies em arquivo temporário e retorna o caminho
 * @param cookieContent Conteúdo do arquivo de cookies
 * @param platform Plataforma (instagram ou youtube)
 * @returns Caminho do arquivo temporário ou null se não houver conteúdo
 */
export function writeCookiesToTemp(cookieContent: string, platform: 'instagram' | 'youtube'): string | null {
  if (!cookieContent || cookieContent.trim() === '') {
    return null;
  }

  try {
    const tempDir = os.tmpdir();
    const fileName = `cookies_${platform}_${Date.now()}.txt`;
    const filePath = path.join(tempDir, fileName);

    fs.writeFileSync(filePath, cookieContent, 'utf-8');
    
    // Limpar arquivo após 5 minutos (300000ms)
    setTimeout(() => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        // Ignorar erros ao limpar
      }
    }, 300000);

    return filePath;
  } catch (error) {
    console.error(`Erro ao escrever cookies temporários para ${platform}:`, error);
    return null;
  }
}

/**
 * Obtém o caminho do arquivo de cookies para uma plataforma específica
 * @param platform Plataforma (instagram ou youtube)
 * @returns Caminho do arquivo temporário ou null se não houver cookies
 */
export async function getCookiesFilePath(platform: 'instagram' | 'youtube'): Promise<string | null> {
  const cookies = await getCookies();
  const cookieContent = platform === 'instagram' ? cookies.instagram : cookies.youtube;
  
  if (!cookieContent || cookieContent.trim() === '') {
    return null;
  }

  return writeCookiesToTemp(cookieContent, platform);
}

/**
 * Limpa arquivos de cookies temporários antigos
 */
export function cleanupTempCookies(): void {
  try {
    const tempDir = os.tmpdir();
    const files = fs.readdirSync(tempDir);
    
    files.forEach(file => {
      if (file.startsWith('cookies_') && file.endsWith('.txt')) {
        const filePath = path.join(tempDir, file);
        try {
          const stats = fs.statSync(filePath);
          // Remover arquivos mais antigos que 10 minutos
          if (Date.now() - stats.mtimeMs > 600000) {
            fs.unlinkSync(filePath);
          }
        } catch (error) {
          // Ignorar erros
        }
      }
    });
  } catch (error) {
    // Ignorar erros na limpeza
  }
}

