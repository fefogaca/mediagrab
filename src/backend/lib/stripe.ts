import Settings from '../models/Settings';

// Importação condicional do Stripe
let Stripe: any = null;
try {
  Stripe = require('stripe').default;
} catch {
  // Stripe não instalado
}

interface StripeConfig {
  enabled: boolean;
  secretKey: string;
  publishableKey: string;
  webhookSecret: string;
  developerPriceId: string;
  developerProductId: string;
  startupPriceId: string;
  startupProductId: string;
  enterprisePriceId: string;
  enterpriseProductId: string;
}

/**
 * Obtém configurações do Stripe do banco de dados
 */
export async function getStripeConfig(): Promise<StripeConfig | null> {
  try {
    const settings = await Settings.getSettings();
    const stripeConfig = typeof settings.stripe === 'string' 
      ? JSON.parse(settings.stripe) 
      : settings.stripe;

    if (!stripeConfig || !stripeConfig.enabled || !stripeConfig.secretKey) {
      return null;
    }

    return stripeConfig as StripeConfig;
  } catch (error) {
    console.error('Erro ao buscar configurações do Stripe:', error);
    return null;
  }
}

/**
 * Obtém instância do Stripe configurada
 */
export async function getStripeInstance() {
  if (!Stripe) {
    return null;
  }

  const config = await getStripeConfig();
  if (!config) {
    return null;
  }

  return new Stripe(config.secretKey, {
    apiVersion: '2023-10-16',
  });
}

/**
 * Verifica se Stripe está configurado e habilitado
 */
export async function isStripeEnabled(): Promise<boolean> {
  const config = await getStripeConfig();
  return config !== null && config.enabled === true;
}

/**
 * Obtém o webhook secret do Stripe
 */
export async function getStripeWebhookSecret(): Promise<string | null> {
  const config = await getStripeConfig();
  return config?.webhookSecret || null;
}

/**
 * Obtém o price ID de um plano
 */
export async function getPlanPriceId(planId: 'developer' | 'startup' | 'enterprise'): Promise<string | null> {
  const config = await getStripeConfig();
  if (!config) return null;

  switch (planId) {
    case 'developer':
      return config.developerPriceId || null;
    case 'startup':
      return config.startupPriceId || null;
    case 'enterprise':
      return config.enterprisePriceId || null;
    default:
      return null;
  }
}

