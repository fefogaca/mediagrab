// Export Prisma client and models
export { default as prisma } from '../lib/database';
export { connectDB } from '../lib/database';

// Re-export Prisma types
export type {
  User,
  ApiKey,
  Payment,
  DownloadLog,
  Notification,
  Coupon,
  Plan,
  Account,
  Session,
  VerificationToken,
} from '@prisma/client';
