import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlanFeature {
  name: string;
  description?: string;
  included: boolean;
  limit?: number;
}

export interface IPlan extends Document {
  _id: mongoose.Types.ObjectId;
  
  // Identificação
  slug: 'free' | 'developer' | 'startup' | 'enterprise';
  name: string;
  description: string;
  
  // Preço
  price: number; // em centavos por mês
  priceYearly?: number; // em centavos por ano (desconto)
  currency: string;
  
  // Limites
  apiKeyLimit: number;
  monthlyDownloadLimit: number;
  rateLimit: number; // requests per minute
  
  // Features
  features: IPlanFeature[];
  
  // Metadados
  isPopular?: boolean;
  isActive: boolean;
  displayOrder: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const PlanFeatureSchema = new Schema<IPlanFeature>({
  name: { type: String, required: true },
  description: String,
  included: { type: Boolean, default: true },
  limit: Number,
}, { _id: false });

const PlanSchema = new Schema<IPlan>({
  slug: {
    type: String,
    required: true,
    unique: true,
    enum: ['free', 'developer', 'startup', 'enterprise'],
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  
  // Preço
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  priceYearly: Number,
  currency: {
    type: String,
    default: 'BRL',
  },
  
  // Limites
  apiKeyLimit: {
    type: Number,
    required: true,
    min: 0,
  },
  monthlyDownloadLimit: {
    type: Number,
    required: true,
    min: 0,
  },
  rateLimit: {
    type: Number,
    required: true,
    min: 1,
  },
  
  // Features
  features: [PlanFeatureSchema],
  
  // Metadados
  isPopular: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  displayOrder: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Método estático para criar planos padrão
PlanSchema.statics.seedDefaultPlans = async function() {
  const defaultPlans = [
    {
      slug: 'free',
      name: 'Free',
      description: 'Perfeito para testar a API',
      price: 0,
      apiKeyLimit: 1,
      monthlyDownloadLimit: 100,
      rateLimit: 10,
      displayOrder: 0,
      features: [
        { name: '100 downloads/mês', included: true },
        { name: '1 API Key', included: true },
        { name: 'Suporte por email', included: true },
        { name: 'Todas as plataformas', included: true },
        { name: 'Rate limit: 10/min', included: true },
        { name: 'Suporte prioritário', included: false },
        { name: 'Webhook notifications', included: false },
      ],
    },
    {
      slug: 'developer',
      name: 'Developer',
      description: 'Para desenvolvedores individuais',
      price: 2900, // R$ 29,00
      priceYearly: 29000, // R$ 290,00
      apiKeyLimit: 3,
      monthlyDownloadLimit: 1000,
      rateLimit: 60,
      displayOrder: 1,
      features: [
        { name: '1.000 downloads/mês', included: true },
        { name: '3 API Keys', included: true },
        { name: 'Suporte por email', included: true },
        { name: 'Todas as plataformas', included: true },
        { name: 'Rate limit: 60/min', included: true },
        { name: 'Webhook notifications', included: true },
        { name: 'Suporte prioritário', included: false },
      ],
    },
    {
      slug: 'startup',
      name: 'Startup',
      description: 'Para startups em crescimento',
      price: 9900, // R$ 99,00
      priceYearly: 99000, // R$ 990,00
      apiKeyLimit: 10,
      monthlyDownloadLimit: 10000,
      rateLimit: 120,
      displayOrder: 2,
      isPopular: true,
      features: [
        { name: '10.000 downloads/mês', included: true },
        { name: '10 API Keys', included: true },
        { name: 'Suporte prioritário', included: true },
        { name: 'Todas as plataformas', included: true },
        { name: 'Rate limit: 120/min', included: true },
        { name: 'Webhook notifications', included: true },
        { name: 'Analytics avançados', included: true },
      ],
    },
    {
      slug: 'enterprise',
      name: 'Enterprise',
      description: 'Para grandes empresas',
      price: 29900, // R$ 299,00
      priceYearly: 299000, // R$ 2.990,00
      apiKeyLimit: -1, // ilimitado
      monthlyDownloadLimit: -1, // ilimitado
      rateLimit: 1000,
      displayOrder: 3,
      features: [
        { name: 'Downloads ilimitados', included: true },
        { name: 'API Keys ilimitadas', included: true },
        { name: 'Suporte 24/7', included: true },
        { name: 'Todas as plataformas', included: true },
        { name: 'Rate limit: 1000/min', included: true },
        { name: 'Webhook notifications', included: true },
        { name: 'Analytics avançados', included: true },
        { name: 'SLA garantido', included: true },
      ],
    },
  ];

  for (const plan of defaultPlans) {
    await this.findOneAndUpdate(
      { slug: plan.slug },
      plan,
      { upsert: true, new: true }
    );
  }
};

const Plan: Model<IPlan> = mongoose.models.Plan || mongoose.model<IPlan>('Plan', PlanSchema);

export default Plan;

