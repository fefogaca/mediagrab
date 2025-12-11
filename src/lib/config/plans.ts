// Configuração centralizada de planos e preços
// Novos preços: Developer R$10, Startup R$30, Enterprise R$50

export interface PlanConfig {
  id: string;
  name: string;
  price: {
    usd: number; // Preço em USD (Stripe)
  };
  limits: {
    requests: number;
    apiKeys: number;
    quality: string;
    rateLimit: string;
  };
  // Stripe IDs
  stripe: {
    priceId: string;
    productId: string;
  } | null;
}

export const PLANS: Record<string, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    price: {
      usd: 0,
    },
    limits: {
      requests: 5,
      apiKeys: 1,
      quality: '480p',
      rateLimit: '5/min',
    },
    stripe: null,
  },
  developer: {
    id: 'developer',
    name: 'Developer',
    price: {
      usd: 2.00,
    },
    limits: {
      requests: 1000,
      apiKeys: 5,
      quality: '1080p',
      rateLimit: '60/min',
    },
    stripe: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_DEVELOPER_PRICE_ID || '',
      productId: process.env.NEXT_PUBLIC_STRIPE_DEVELOPER_PRODUCT_ID || '',
    },
  },
  startup: {
    id: 'startup',
    name: 'Startup',
    price: {
      usd: 6.00,
    },
    limits: {
      requests: 10000,
      apiKeys: 20,
      quality: '4K',
      rateLimit: '200/min',
    },
    stripe: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_STARTUP_PRICE_ID || '',
      productId: process.env.NEXT_PUBLIC_STRIPE_STARTUP_PRODUCT_ID || '',
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: {
      usd: 10.00,
    },
    limits: {
      requests: -1, // Ilimitado
      apiKeys: -1,  // Ilimitado
      quality: '8K',
      rateLimit: 'unlimited',
    },
    stripe: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID || '',
      productId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRODUCT_ID || '',
    },
  },
};

// Função para formatar preço
export function formatPrice(amount: number, currency: 'USD' = 'USD'): string {
  if (amount === 0) return 'Free';
  return `$${amount.toFixed(2)}`;
}

// Função para obter plano por ID
export function getPlanById(planId: string): PlanConfig | null {
  return PLANS[planId] || null;
}

// Função para obter URL de pagamento (deprecated - usar checkout direto)
export function getPaymentUrl(planId: string): string | null {
  // Stripe usa checkout server-side, não precisa de URL direta
  return null;
}

// URLs de callback para pagamentos
export const PAYMENT_URLS = {
  // URL de retorno após pagamento (onde o usuário é redirecionado)
  returnUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/return`,
  // URL de conclusão (webhook ou verificação final)
  completionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/complete`,
  // URL de cancelamento
  cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/cancel`,
};

