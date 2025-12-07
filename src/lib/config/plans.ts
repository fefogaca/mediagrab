// Configuração centralizada de planos e preços
// Novos preços: Developer R$10, Startup R$30, Enterprise R$50

export interface PlanConfig {
  id: string;
  name: string;
  price: {
    brl: number; // Preço em BRL (AbacatePay)
    usd: number; // Preço em USD (Stripe)
  };
  limits: {
    requests: number;
    apiKeys: number;
    quality: string;
    rateLimit: string;
  };
  // AbacatePay IDs (Brasil - PIX)
  abacatepay: {
    productId: string;
    billingId: string;
    paymentLink: string;
  } | null;
  // Stripe IDs (Internacional - Cartão)
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
      brl: 0,
      usd: 0,
    },
    limits: {
      requests: 5,
      apiKeys: 1,
      quality: '480p',
      rateLimit: '5/min',
    },
    abacatepay: null,
    stripe: null,
  },
  developer: {
    id: 'developer',
    name: 'Developer',
    price: {
      brl: 10.00, // R$10,00
      usd: 2.00,  // $2.00 (aprox.)
    },
    limits: {
      requests: 1000,
      apiKeys: 5,
      quality: '1080p',
      rateLimit: '60/min',
    },
    abacatepay: {
      productId: 'prod_Z5cCmRpa3nyhyuZSDkHh4wUx',
      billingId: 'bill_mj4gYGKxSUJhWAxUrdWs5BGJ',
      paymentLink: 'https://www.abacatepay.com/pay/bill_mj4gYGKxSUJhWAxUrdWs5BGJ',
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
      brl: 30.00, // R$30,00
      usd: 6.00,  // $6.00 (aprox.)
    },
    limits: {
      requests: 10000,
      apiKeys: 20,
      quality: '4K',
      rateLimit: '200/min',
    },
    abacatepay: {
      productId: 'prod_bYHXUuXcmY6GsCEjnPBG23yA',
      billingId: 'bill_SSsaFnMcCC4YEJsr4cqrwBMC',
      paymentLink: 'https://www.abacatepay.com/pay/bill_SSsaFnMcCC4YEJsr4cqrwBMC',
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
      brl: 50.00, // R$50,00
      usd: 10.00, // $10.00 (aprox.)
    },
    limits: {
      requests: -1, // Ilimitado
      apiKeys: -1,  // Ilimitado
      quality: '8K',
      rateLimit: 'unlimited',
    },
    abacatepay: {
      productId: 'prod_6GSPhnqJ5MkJMMMcDAHM03zW',
      billingId: 'bill_tz0LjSeAC3YKpukqNUg3utDe',
      paymentLink: 'https://www.abacatepay.com/pay/bill_tz0LjSeAC3YKpukqNUg3utDe',
    },
    stripe: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID || '',
      productId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRODUCT_ID || '',
    },
  },
};

// Função para formatar preço
export function formatPrice(amount: number, currency: 'BRL' | 'USD'): string {
  if (amount === 0) return currency === 'BRL' ? 'Grátis' : 'Free';
  
  if (currency === 'BRL') {
    return `R$${amount.toFixed(2).replace('.', ',')}`;
  }
  return `$${amount.toFixed(2)}`;
}

// Função para obter plano por ID
export function getPlanById(planId: string): PlanConfig | null {
  return PLANS[planId] || null;
}

// Função para obter URL de pagamento
export function getPaymentUrl(planId: string, isBrazilian: boolean): string | null {
  const plan = getPlanById(planId);
  if (!plan || planId === 'free') return null;

  if (isBrazilian && plan.abacatepay) {
    return plan.abacatepay.paymentLink;
  }
  
  // Para Stripe, retornamos null aqui pois usaremos checkout server-side
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

