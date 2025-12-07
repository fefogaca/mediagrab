/**
 * Serviço de integração com AbacatePay
 * Documentação: https://docs.abacatepay.com
 */

const ABACATEPAY_API_KEY = process.env.ABACATEPAY_API_KEY || 'abc_dev_nueuEF336WKCRuYtMuPHPA6k';
const ABACATEPAY_BASE_URL = 'https://api.abacatepay.com/v1';

// Tipos
export interface AbacateCustomer {
  email: string;
  name: string;
  cellphone?: string;
  taxId?: string; // CPF/CNPJ
}

export interface AbacateProduct {
  externalId: string;
  name: string;
  description?: string;
  quantity: number;
  price: number; // em centavos
}

export interface AbacateBillingRequest {
  frequency: 'ONE_TIME' | 'MULTIPLE';
  methods: ('PIX')[];
  products: AbacateProduct[];
  customer?: AbacateCustomer;
  returnUrl: string;
  completionUrl: string;
  customerId?: string;
}

export interface AbacateBillingResponse {
  id: string;
  url: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'REFUNDED';
  devMode: boolean;
  methods: string[];
  products: AbacateProduct[];
  frequency: string;
  createdAt: string;
  updatedAt: string;
}

export interface AbacateCustomerResponse {
  id: string;
  email: string;
  name: string;
  cellphone?: string;
  taxId?: {
    type: string;
    value: string;
  };
  metadata?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface AbacatePixQRCode {
  qrcode: string;
  qrcodeBase64: string;
  expiresAt: string;
}

// Classe principal do serviço
class AbacatePayService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = ABACATEPAY_API_KEY;
    this.baseUrl = ABACATEPAY_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `AbacatePay API Error: ${response.status} - ${JSON.stringify(errorData)}`
        );
      }

      return response.json();
    } catch (error) {
      console.error('AbacatePay request failed:', error);
      throw error;
    }
  }

  /**
   * Cria um novo cliente
   */
  async createCustomer(customer: AbacateCustomer): Promise<AbacateCustomerResponse> {
    const response = await this.request<{ data: AbacateCustomerResponse }>(
      '/customer/create',
      'POST',
      customer
    );
    return response.data;
  }

  /**
   * Lista clientes
   */
  async listCustomers(): Promise<AbacateCustomerResponse[]> {
    const response = await this.request<{ data: AbacateCustomerResponse[] }>('/customer/list');
    return response.data;
  }

  /**
   * Cria uma cobrança (billing)
   */
  async createBilling(billing: AbacateBillingRequest): Promise<AbacateBillingResponse> {
    const response = await this.request<{ data: AbacateBillingResponse }>(
      '/billing/create',
      'POST',
      billing
    );
    return response.data;
  }

  /**
   * Lista cobranças
   */
  async listBillings(): Promise<AbacateBillingResponse[]> {
    const response = await this.request<{ data: AbacateBillingResponse[] }>('/billing/list');
    return response.data;
  }

  /**
   * Obtém detalhes de uma cobrança
   */
  async getBilling(billingId: string): Promise<AbacateBillingResponse> {
    const response = await this.request<{ data: AbacateBillingResponse }>(
      `/billing/${billingId}`
    );
    return response.data;
  }

  /**
   * Cria cobrança para um plano específico
   */
  async createPlanPayment(
    plan: 'developer' | 'startup' | 'enterprise',
    customer: AbacateCustomer,
    returnUrl: string,
    completionUrl: string,
    yearly: boolean = false
  ): Promise<AbacateBillingResponse> {
    const plans = {
      developer: {
        name: 'Plano Developer',
        price: yearly ? 29000 : 2900, // R$ 290,00 ou R$ 29,00
        externalId: yearly ? 'plan_developer_yearly' : 'plan_developer_monthly',
      },
      startup: {
        name: 'Plano Startup',
        price: yearly ? 99000 : 9900, // R$ 990,00 ou R$ 99,00
        externalId: yearly ? 'plan_startup_yearly' : 'plan_startup_monthly',
      },
      enterprise: {
        name: 'Plano Enterprise',
        price: yearly ? 299000 : 29900, // R$ 2.990,00 ou R$ 299,00
        externalId: yearly ? 'plan_enterprise_yearly' : 'plan_enterprise_monthly',
      },
    };

    const selectedPlan = plans[plan];

    const billing = await this.createBilling({
      frequency: 'ONE_TIME',
      methods: ['PIX'],
      products: [
        {
          externalId: selectedPlan.externalId,
          name: selectedPlan.name,
          description: yearly ? 'Assinatura anual' : 'Assinatura mensal',
          quantity: 1,
          price: selectedPlan.price,
        },
      ],
      customer,
      returnUrl,
      completionUrl,
    });

    return billing;
  }
}

// Instância singleton
export const abacatePay = new AbacatePayService();

// Helpers para webhook
export interface AbacateWebhookPayload {
  event: 'billing.paid' | 'billing.expired' | 'billing.refunded';
  data: {
    billing: AbacateBillingResponse;
  };
}

/**
 * Verifica se o payload do webhook é válido
 */
export function isValidWebhookPayload(payload: unknown): payload is AbacateWebhookPayload {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as Record<string, unknown>;
  return (
    typeof p.event === 'string' &&
    ['billing.paid', 'billing.expired', 'billing.refunded'].includes(p.event) &&
    typeof p.data === 'object' &&
    p.data !== null
  );
}

export default abacatePay;

