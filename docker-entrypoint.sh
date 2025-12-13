#!/bin/sh
set -e

echo "🚀 Starting MediaGrab..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set!"
  exit 1
fi

# Add pgbouncer=true to DATABASE_URL if not present (for Supabase Session Pooler)
DB_URL="$DATABASE_URL"
if echo "$DB_URL" | grep -vq "pgbouncer=true"; then
  if echo "$DB_URL" | grep -q "?"; then
    DB_URL="${DB_URL}&pgbouncer=true"
  else
    DB_URL="${DB_URL}?pgbouncer=true"
  fi
  echo "📝 Added pgbouncer=true to DATABASE_URL for Session Pooler compatibility"
fi

# Wait for database to be ready (test connection)
echo "📊 Waiting for database to be ready..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
  # Test database connection using Node.js with the correct URL
  if DATABASE_URL="$DB_URL" node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
    prisma.\$connect()
      .then(() => { 
        console.log('OK'); 
        prisma.\$disconnect();
        process.exit(0); 
      })
      .catch((err) => { 
        console.error(err.message); 
        process.exit(1); 
      });
  " 2>/dev/null; then
    echo "✅ Database is ready!"
    break
  fi
  
  attempt=$((attempt + 1))
  if [ $attempt -lt $max_attempts ]; then
    echo "⏳ Waiting for database... (attempt $attempt/$max_attempts)"
    sleep 7
  else
    echo "⚠️ Could not connect to database after $max_attempts attempts"
    echo "⚠️ Please check:"
    echo "   1. Supabase firewall settings (Network Restrictions)"
    echo "   2. DATABASE_URL is correct"
    echo "   3. Server IP is whitelisted in Supabase"
    echo "   4. Using Session Pooler URL (port 5432 or 6543) with pgbouncer=true"
    echo "⚠️ Continuing anyway - application will retry connection..."
  fi
done

# Run Prisma migrations (will retry automatically if needed)
echo "🔄 Running database migrations..."
DATABASE_URL="$DB_URL" npx prisma migrate deploy || echo "⚠️ Migration failed or already applied - continuing..."

# Generate Prisma Client (if needed)
echo "🔧 Generating Prisma Client..."
npx prisma generate || echo "⚠️ Prisma generate failed - continuing..."

echo "✅ Setup complete! Starting application..."

# Start the application
exec "$@"