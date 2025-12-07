import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICoupon extends Document {
  _id: mongoose.Types.ObjectId;
  
  // Identificação
  code: string;
  name: string;
  description?: string;
  
  // Desconto
  discountType: 'percentage' | 'fixed';
  discountValue: number; // percentual ou valor em centavos
  
  // Limites
  maxUses?: number;
  usedCount: number;
  maxUsesPerUser?: number;
  
  // Validade
  validFrom?: Date;
  validUntil?: Date;
  
  // Restrições
  minimumAmount?: number;
  applicablePlans?: ('developer' | 'startup' | 'enterprise')[];
  
  // Status
  isActive: boolean;
  
  // Usuários que utilizaram
  usedBy: {
    userId: mongoose.Types.ObjectId;
    usedAt: Date;
    paymentId: mongoose.Types.ObjectId;
  }[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: String,
  
  // Desconto
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0,
  },
  
  // Limites
  maxUses: Number,
  usedCount: {
    type: Number,
    default: 0,
  },
  maxUsesPerUser: {
    type: Number,
    default: 1,
  },
  
  // Validade
  validFrom: Date,
  validUntil: Date,
  
  // Restrições
  minimumAmount: Number,
  applicablePlans: [{
    type: String,
    enum: ['developer', 'startup', 'enterprise'],
  }],
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // Uso
  usedBy: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    usedAt: {
      type: Date,
      default: Date.now,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
    },
  }],
}, {
  timestamps: true,
});

// Método para verificar validade
CouponSchema.methods.isValid = function(): boolean {
  const now = new Date();
  
  if (!this.isActive) return false;
  if (this.maxUses && this.usedCount >= this.maxUses) return false;
  if (this.validFrom && now < this.validFrom) return false;
  if (this.validUntil && now > this.validUntil) return false;
  
  return true;
};

// Método para calcular desconto
CouponSchema.methods.calculateDiscount = function(amount: number): number {
  if (this.discountType === 'percentage') {
    return Math.round(amount * (this.discountValue / 100));
  }
  return Math.min(this.discountValue, amount);
};

const Coupon: Model<ICoupon> = mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);

export default Coupon;

