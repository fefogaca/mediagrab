import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDownloadLog extends Document {
  _id: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  apiKeyId?: mongoose.Types.ObjectId;
  
  // Informações do download
  url: string;
  provider: string;
  title?: string;
  format?: string;
  quality?: string;
  fileSize?: number;
  duration?: number;
  
  // Status
  status: 'pending' | 'success' | 'failed';
  errorMessage?: string;
  
  // Metadados da requisição
  ipAddress?: string;
  userAgent?: string;
  referer?: string;
  
  // Timestamps
  createdAt: Date;
  completedAt?: Date;
}

const DownloadLogSchema = new Schema<IDownloadLog>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  apiKeyId: {
    type: Schema.Types.ObjectId,
    ref: 'ApiKey',
    index: true,
  },
  
  // Informações do download
  url: {
    type: String,
    required: true,
  },
  provider: {
    type: String,
    required: true,
    index: true,
  },
  title: String,
  format: String,
  quality: String,
  fileSize: Number,
  duration: Number,
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending',
    index: true,
  },
  errorMessage: String,
  
  // Metadados
  ipAddress: String,
  userAgent: String,
  referer: String,
  
  completedAt: Date,
}, {
  timestamps: true,
});

// Índices para queries comuns
DownloadLogSchema.index({ createdAt: -1 });
DownloadLogSchema.index({ userId: 1, createdAt: -1 });
DownloadLogSchema.index({ provider: 1, createdAt: -1 });
DownloadLogSchema.index({ status: 1, createdAt: -1 });

// TTL index para limpar logs antigos (opcional - 90 dias)
// DownloadLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

const DownloadLog: Model<IDownloadLog> = mongoose.models.DownloadLog || mongoose.model<IDownloadLog>('DownloadLog', DownloadLogSchema);

export default DownloadLog;

