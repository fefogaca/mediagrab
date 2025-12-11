import Settings from '../models/Settings';
import sgMail from '@sendgrid/mail';

interface SendGridConfig {
  enabled: boolean;
  apiKey: string;
  fromEmail: string;
}

/**
 * Obtém configurações do SendGrid do banco de dados
 */
export async function getSendGridConfig(): Promise<SendGridConfig | null> {
  try {
    const settings = await Settings.getSettings();
    const sendGridConfig = typeof settings.sendGrid === 'string' 
      ? JSON.parse(settings.sendGrid) 
      : settings.sendGrid;

    if (!sendGridConfig || !sendGridConfig.enabled || !sendGridConfig.apiKey) {
      return null;
    }

    return sendGridConfig as SendGridConfig;
  } catch (error) {
    console.error('Erro ao buscar configurações do SendGrid:', error);
    return null;
  }
}

/**
 * Configura o SendGrid com as credenciais do banco
 */
export async function configureSendGrid(): Promise<boolean> {
  const config = await getSendGridConfig();
  if (!config) {
    return false;
  }

  try {
    sgMail.setApiKey(config.apiKey);
    return true;
  } catch (error) {
    console.error('Erro ao configurar SendGrid:', error);
    return false;
  }
}

/**
 * Verifica se SendGrid está configurado e habilitado
 */
export async function isSendGridEnabled(): Promise<boolean> {
  const config = await getSendGridConfig();
  return config !== null && config.enabled === true;
}

/**
 * Obtém o email remetente do SendGrid
 */
export async function getSendGridFromEmail(): Promise<string> {
  const config = await getSendGridConfig();
  return config?.fromEmail || 'noreply@mediagrab.com';
}

