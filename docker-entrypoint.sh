#!/bin/sh
set -e

echo "🚀 Starting MediaGrab..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set!"
  exit 1
fi

# Wait for database to be ready (test connection)
echo "📊 Waiting for database to be ready..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
  # Test database connection using Node.js
  if node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    prisma.\$queryRaw\`SELECT 1\`
      .then(() => { console.log('OK'); process.exit(0); })
      .catch((err) => { console.error(err.message); process.exit(1); });
  " 2>/dev/null; then
    echo "✅ Database is ready!"
    break
  fi
  
  attempt=$((attempt + 1))
  if [ $attempt -lt $max_attempts ]; then
    echo "⏳ Waiting for database... (attempt $attempt/$max_attempts)"
    sleep 2
  else
    echo "⚠️ Could not connect to database after $max_attempts attempts"
    echo "⚠️ Please check:"
    echo "   1. Supabase firewall settings (Network Restrictions)"
    echo "   2. DATABASE_URL is correct"
    echo "   3. Server IP is whitelisted in Supabase"
    echo "⚠️ Continuing anyway - application will retry connection..."
  fi
done

# Run Prisma migrations (will retry automatically if needed)
echo "🔄 Running database migrations..."
npx prisma migrate deploy || echo "⚠️ Migration failed or already applied - continuing..."

# Generate Prisma Client (if needed)
echo "🔧 Generating Prisma Client..."
npx prisma generate || echo "⚠️ Prisma generate failed - continuing..."

echo "✅ Setup complete! Starting application..."

# Start the application
exec "$@"