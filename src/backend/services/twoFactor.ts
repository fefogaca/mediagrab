import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';

const APP_NAME = 'MediaGrab';

/**
 * Gera um segredo para 2FA
 */
export function generateSecret(email: string) {
  const secret = speakeasy.generateSecret({
    name: `${APP_NAME}:${email}`,
    issuer: APP_NAME,
    length: 32,
  });

  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url!,
  };
}

/**
 * Gera QR Code em base64
 */
export async function generateQRCode(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl);
}

/**
 * Verifica código TOTP
 */
export function verifyToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1, // Permite 1 intervalo de tolerância (30 segundos antes/depois)
  });
}

/**
 * Gera códigos de backup
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    // Formato: XXXX-XXXX
    codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
  }
  return codes;
}

/**
 * Hash dos códigos de backup para armazenamento
 */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  const bcrypt = await import('bcryptjs');
  return Promise.all(codes.map((code) => bcrypt.hash(code, 10)));
}

/**
 * Verifica código de backup
 */
export async function verifyBackupCode(code: string, hashedCodes: string[]): Promise<number> {
  const bcrypt = await import('bcryptjs');
  for (let i = 0; i < hashedCodes.length; i++) {
    if (await bcrypt.compare(code.toUpperCase(), hashedCodes[i])) {
      return i; // Retorna índice do código usado
    }
  }
  return -1; // Não encontrado
}

/**
 * Interface para setup 2FA
 */
export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

/**
 * Configura 2FA completo para um usuário
 */
export async function setupTwoFactor(email: string): Promise<TwoFactorSetup> {
  const { secret, otpauthUrl } = generateSecret(email);
  const qrCode = await generateQRCode(otpauthUrl);
  const backupCodes = generateBackupCodes(10);

  return {
    secret,
    qrCode,
    backupCodes,
  };
}

