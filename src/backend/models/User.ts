import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface para endereço
export interface IAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Interface para 2FA
export interface ITwoFactor {
  enabled: boolean;
  secret?: string;
  backupCodes?: string[];
  verifiedAt?: Date;
}

// Interface principal do usuário
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password?: string;
  name: string;
  image?: string;
  
  // Dados pessoais para AbacatePay
  fullName: string;
  taxId: string; // CPF (Brasil) ou NIF (Portugal)
  taxIdType: 'CPF' | 'NIF' | 'OTHER';
  phone: string;
  address: IAddress;
  
  // Autenticação
  emailVerified?: Date;
  provider?: string; // google, github, credentials, etc.
  providerId?: string;
  
  // 2FA
  twoFactor: ITwoFactor;
  
  // Perfil e permissões
  role: 'admin' | 'user' | 'guest';
  plan: 'free' | 'developer' | 'startup' | 'enterprise';
  planExpiresAt?: Date;
  
  // Metadados
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // AbacatePay Customer ID
  abacatePayCustomerId?: string;
}

const AddressSchema = new Schema<IAddress>({
  street: { type: String, default: '' },
  number: { type: String, default: '' },
  complement: { type: String },
  neighborhood: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  zipCode: { type: String, default: '' },
  country: { type: String, default: 'Brasil' },
}, { _id: false });

const TwoFactorSchema = new Schema<ITwoFactor>({
  enabled: { type: Boolean, default: false },
  secret: { type: String },
  backupCodes: [{ type: String }],
  verifiedAt: { type: Date },
}, { _id: false });

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido'],
  },
  password: {
    type: String,
    minlength: [8, 'A senha deve ter pelo menos 8 caracteres'],
  },
  name: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
  },
  image: String,
  
  // Dados pessoais
  fullName: {
    type: String,
    trim: true,
    default: '',
  },
  taxId: {
    type: String,
    trim: true,
    default: '',
  },
  taxIdType: {
    type: String,
    enum: ['CPF', 'NIF', 'OTHER'],
    default: 'CPF',
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  address: {
    type: AddressSchema,
    default: () => ({}),
  },
  
  // Autenticação
  emailVerified: Date,
  provider: {
    type: String,
    default: 'credentials',
  },
  providerId: String,
  
  // 2FA
  twoFactor: {
    type: TwoFactorSchema,
    default: () => ({ enabled: false }),
  },
  
  // Perfil e permissões
  role: {
    type: String,
    enum: ['admin', 'user', 'guest'],
    default: 'user',
  },
  plan: {
    type: String,
    enum: ['free', 'developer', 'startup', 'enterprise'],
    default: 'free',
  },
  planExpiresAt: Date,
  
  // Metadados
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLoginAt: Date,
  
  // AbacatePay
  abacatePayCustomerId: String,
}, {
  timestamps: true,
});

// Índices
UserSchema.index({ email: 1 });
UserSchema.index({ provider: 1, providerId: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ plan: 1 });
UserSchema.index({ createdAt: -1 });

// Método para ocultar campos sensíveis
UserSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.twoFactor?.secret;
  delete user.twoFactor?.backupCodes;
  return user;
};

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;

