import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    'Please define the DATABASE_URL environment variable inside .env'
  );
}

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/nextjs-best-practices
// Adicionar ?pgbouncer=true ao DATABASE_URL se não estiver presente
// Isso desabilita prepared statements para compatibilidade com Session Pooler do Supabase
const getDatabaseUrl = () => {
  if (!DATABASE_URL) return '';
  // Se já tem pgbouncer=true, retornar como está
  if (DATABASE_URL.includes('pgbouncer=true')) {
    return DATABASE_URL;
  }
  // Adicionar pgbouncer=true
  const separator = DATABASE_URL.includes('?') ? '&' : '?';
  return `${DATABASE_URL}${separator}pgbouncer=true`;
};

const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    // Desabilitar prepared statements para compatibilidade com Session Pooler do Supabase
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

async function connectDB() {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL (Supabase) connected successfully');
    return prisma;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    throw error;
  }
}

export default prisma;
export { connectDB };

