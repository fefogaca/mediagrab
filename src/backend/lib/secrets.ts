import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Verifica se está rodando no Docker
 */
function isDocker(): boolean {
  // Verificar se o arquivo /.dockerenv existe (presente em containers Docker)
  if (fs.existsSync('/.dockerenv')) {
    return true;
  }
  
  // Verificar se está em produção e não tem permissão de escrita (típico de containers)
  if (process.env.NODE_ENV === 'production') {
    try {
      const testPath = path.join(process.cwd(), '.env.test');
      fs.writeFileSync(testPath, 'test');
      fs.unlinkSync(testPath);
      return false; // Tem permissão de escrita, provavelmente não é Docker
    } catch {
      return true; // Sem permissão de escrita, provavelmente é Docker
    }
  }
  
  return false;
}

/**
 * Gera um secret seguro de 32 bytes em base64
 */
function generateSecret(): string {
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Obtém ou gera JWT_SECRET automaticamente
 * Se não existir no .env, tenta ler do .env primeiro, depois gera e salva
 * No Docker, apenas usa variáveis de ambiente (não tenta escrever no .env)
 */
export function getJWTSecret(): string {
  let secret = process.env.JWT_SECRET;
  
  if (!secret) {
    const dockerMode = isDocker();
    
    // Tentar ler do .env primeiro (apenas se não estiver no Docker)
    if (!dockerMode) {
      try {
        const envPath = path.join(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf-8');
          const jwtMatch = envContent.match(/^JWT_SECRET=(.+)$/m);
          if (jwtMatch && jwtMatch[1]) {
            secret = jwtMatch[1].trim();
            process.env.JWT_SECRET = secret;
            return secret;
          }
        }
      } catch (error) {
        console.warn('⚠️ Erro ao ler JWT_SECRET do .env:', error);
      }
    }
    
    // Se ainda não encontrou, gerar secret automaticamente
    secret = generateSecret();
    
    // Tentar salvar no .env apenas se não estiver no Docker
    if (!dockerMode) {
      try {
        const envPath = path.join(process.cwd(), '.env');
        const envContent = fs.existsSync(envPath) 
          ? fs.readFileSync(envPath, 'utf-8')
          : '';
        
        if (!envContent.includes('JWT_SECRET=')) {
          const newContent = envContent + (envContent ? '\n' : '') + `JWT_SECRET=${secret}\n`;
          fs.writeFileSync(envPath, newContent, 'utf-8');
          console.log('✅ JWT_SECRET gerado automaticamente e salvo em .env');
        }
      } catch (error) {
        // Não crítico se falhar, apenas logar
        console.warn('⚠️ Não foi possível salvar JWT_SECRET no .env:', error);
      }
    } else {
      console.log('✅ JWT_SECRET gerado automaticamente (Docker mode - usando env var)');
    }
    
    // Definir no process.env para esta sessão
    process.env.JWT_SECRET = secret;
  }
  
  return secret;
}

/**
 * Obtém ou gera NEXTAUTH_SECRET automaticamente
 * Se não existir no .env, tenta ler do .env primeiro, depois gera e salva
 * No Docker, apenas usa variáveis de ambiente (não tenta escrever no .env)
 */
export function getNextAuthSecret(): string {
  let secret = process.env.NEXTAUTH_SECRET;
  
  if (!secret) {
    const dockerMode = isDocker();
    
    // Tentar ler do .env primeiro (apenas se não estiver no Docker)
    if (!dockerMode) {
      try {
        const envPath = path.join(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf-8');
          const nextAuthMatch = envContent.match(/^NEXTAUTH_SECRET=(.+)$/m);
          if (nextAuthMatch && nextAuthMatch[1]) {
            secret = nextAuthMatch[1].trim();
            process.env.NEXTAUTH_SECRET = secret;
            return secret;
          }
        }
      } catch (error) {
        console.warn('⚠️ Erro ao ler NEXTAUTH_SECRET do .env:', error);
      }
    }
    
    // Se ainda não encontrou, gerar secret automaticamente
    secret = generateSecret();
    
    // Tentar salvar no .env apenas se não estiver no Docker
    if (!dockerMode) {
      try {
        const envPath = path.join(process.cwd(), '.env');
        const envContent = fs.existsSync(envPath) 
          ? fs.readFileSync(envPath, 'utf-8')
          : '';
        
        if (!envContent.includes('NEXTAUTH_SECRET=')) {
          const newContent = envContent + (envContent ? '\n' : '') + `NEXTAUTH_SECRET=${secret}\n`;
          fs.writeFileSync(envPath, newContent, 'utf-8');
          console.log('✅ NEXTAUTH_SECRET gerado automaticamente e salvo em .env');
        }
      } catch (error) {
        // Não crítico se falhar, apenas logar
        console.warn('⚠️ Não foi possível salvar NEXTAUTH_SECRET no .env:', error);
      }
    } else {
      console.log('✅ NEXTAUTH_SECRET gerado automaticamente (Docker mode - usando env var)');
    }
    
    // Definir no process.env para esta sessão
    process.env.NEXTAUTH_SECRET = secret;
  }
  
  return secret;
}