import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  
  // Conteúdo
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  
  // Alvo
  targetAudience: 'all' | 'admins' | 'users' | 'specific';
  targetUserId?: mongoose.Types.ObjectId;
  
  // Criador
  createdBy?: mongoose.Types.ObjectId;
  
  // Status de leitura (por usuário)
  readBy: {
    userId: mongoose.Types.ObjectId;
    readAt: Date;
  }[];
  
  // Metadados
  link?: string;
  icon?: string;
  priority: 'low' | 'normal' | 'high';
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

const NotificationSchema = new Schema<INotification>({
  // Conteúdo
  title: {
    type: String,
    required: [true, 'Título é obrigatório'],
    trim: true,
    maxlength: 200,
  },
  message: {
    type: String,
    required: [true, 'Mensagem é obrigatória'],
    trim: true,
    maxlength: 1000,
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'error'],
    default: 'info',
  },
  
  // Alvo
  targetAudience: {
    type: String,
    enum: ['all', 'admins', 'users', 'specific'],
    default: 'all',
  },
  targetUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  
  // Criador
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  
  // Leitura
  readBy: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  }],
  
  // Metadados
  link: String,
  icon: String,
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal',
  },
  
  expiresAt: Date,
}, {
  timestamps: true,
});

// Índices
NotificationSchema.index({ targetAudience: 1, createdAt: -1 });
NotificationSchema.index({ targetUserId: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ 'readBy.userId': 1 });

// Virtual para verificar se um usuário leu
NotificationSchema.methods.isReadBy = function(userId: mongoose.Types.ObjectId): boolean {
  return this.readBy.some((r: { userId: mongoose.Types.ObjectId }) => r.userId.equals(userId));
};

const Notification: Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;

