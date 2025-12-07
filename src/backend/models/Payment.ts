import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPaymentProduct {
  externalId: string;
  name: string;
  quantity: number;
  price: number; // em centavos
}

export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  
  // AbacatePay dados
  abacatePayBillingId: string;
  abacatePayUrl?: string;
  
  // Detalhes do pagamento
  amount: number; // em centavos
  currency: string;
  method: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
  
  // Produtos/Plano
  products: IPaymentProduct[];
  planPurchased?: 'developer' | 'startup' | 'enterprise';
  planDuration?: number; // em meses
  
  // Status
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'expired';
  paidAt?: Date;
  
  // Cupom
  couponCode?: string;
  discountAmount?: number;
  
  // Metadados
  metadata?: Record<string, unknown>;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

const PaymentProductSchema = new Schema<IPaymentProduct>({
  externalId: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
}, { _id: false });

const PaymentSchema = new Schema<IPayment>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  
  // AbacatePay
  abacatePayBillingId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  abacatePayUrl: String,
  
  // Detalhes
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: 'BRL',
  },
  method: {
    type: String,
    enum: ['PIX', 'CREDIT_CARD', 'BOLETO'],
    required: true,
  },
  
  // Produtos
  products: [PaymentProductSchema],
  planPurchased: {
    type: String,
    enum: ['developer', 'startup', 'enterprise'],
  },
  planDuration: {
    type: Number,
    default: 1,
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'expired'],
    default: 'pending',
    index: true,
  },
  paidAt: Date,
  
  // Cupom
  couponCode: String,
  discountAmount: {
    type: Number,
    default: 0,
  },
  
  // Metadados
  metadata: Schema.Types.Mixed,
  
  expiresAt: Date,
}, {
  timestamps: true,
});

// Índices
PaymentSchema.index({ userId: 1, status: 1 });
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ status: 1, createdAt: -1 });

const Payment: Model<IPayment> = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;

