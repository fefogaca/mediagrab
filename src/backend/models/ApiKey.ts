import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IApiKey extends Document {
  _id: mongoose.Types.ObjectId;
  key: string;
  name: string;
  userId: mongoose.Types.ObjectId;
  
  // Limites e uso
  usageCount: number;
  usageLimit: number;
  
  // Datas
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  lastUsedAt?: Date;
  
  // Status
  isActive: boolean;
  revokedAt?: Date;
  revokedReason?: string;
  
  // Permissões
  permissions: string[];
  allowedOrigins?: string[];
  
  // Rate limiting
  rateLimit: number; // requests per minute
  rateLimitWindow: number; // in seconds
}

const ApiKeySchema = new Schema<IApiKey>({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Nome da API Key é obrigatório'],
    trim: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  
  // Limites e uso
  usageCount: {
    type: Number,
    default: 0,
  },
  usageLimit: {
    type: Number,
    default: 100, // Plano gratuito
  },
  
  // Datas
  expiresAt: Date,
  lastUsedAt: Date,
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
  },
  revokedAt: Date,
  revokedReason: String,
  
  // Permissões
  permissions: {
    type: [String],
    default: ['download:read'],
  },
  allowedOrigins: [String],
  
  // Rate limiting
  rateLimit: {
    type: Number,
    default: 60, // 60 requests per minute
  },
  rateLimitWindow: {
    type: Number,
    default: 60, // 60 seconds
  },
}, {
  timestamps: true,
});

// Índices compostos
ApiKeySchema.index({ userId: 1, isActive: 1 });
ApiKeySchema.index({ key: 1, isActive: 1 });
ApiKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual para verificar se expirou
ApiKeySchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Virtual para verificar limite de uso
ApiKeySchema.virtual('hasReachedLimit').get(function() {
  return this.usageCount >= this.usageLimit;
});

// Método estático para gerar nova key
ApiKeySchema.statics.generateKey = function(): string {
  const prefix = 'mg_';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = prefix;
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
};

const ApiKey: Model<IApiKey> = mongoose.models.ApiKey || mongoose.model<IApiKey>('ApiKey', ApiKeySchema);

export default ApiKey;

