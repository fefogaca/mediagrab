#!/bin/sh
set -e

echo "🚀 Starting MediaGrab..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set!"
  exit 1
fi

# Wait for database to be ready (simple check)
echo "📊 Checking database connection..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
  # Try to connect using Prisma
  if npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1 || \
     node -e "require('@prisma/client').PrismaClient.prototype.\$connect().then(() => process.exit(0)).catch(() => process.exit(1))" 2>/dev/null; then
    echo "✅ Database is ready!"
    break
  fi
  
  attempt=$((attempt + 1))
  if [ $attempt -lt $max_attempts ]; then
    echo "⏳ Waiting for database... (attempt $attempt/$max_attempts)"
    sleep 2
  else
    echo "⚠️ Could not verify database connection - continuing anyway..."
  fi
done

# Run Prisma migrations
echo "🔄 Running database migrations..."
if command -v prisma > /dev/null 2>&1; then
  prisma migrate deploy || echo "⚠️ Migration failed or already applied - continuing..."
else
  npx prisma migrate deploy || echo "⚠️ Migration failed or already applied - continuing..."
fi

# Generate Prisma Client (if needed)
echo "🔧 Generating Prisma Client..."
if command -v prisma > /dev/null 2>&1; then
  prisma generate || echo "⚠️ Prisma generate failed - continuing..."
else
  npx prisma generate || echo "⚠️ Prisma generate failed - continuing..."
fi

echo "✅ Setup complete! Starting application..."

# Start the application
exec "$@"

