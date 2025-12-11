# Docker Deployment Guide

Complete guide for deploying MediaGrab using Docker.

## Index

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Docker Commands](#docker-commands)
- [Advanced Configuration](#advanced-configuration)
- [Platform Deployment](#platform-deployment)
- [Troubleshooting](#troubleshooting)
- [Monitoring](#monitoring)
- [Security](#security)

## Prerequisites

Before starting, make sure you have:

- Docker 20.10+ installed
- Docker Compose 2.0+ installed
- Supabase account with created project
- Supabase `DATABASE_URL`

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/fefogaca/mediagrab.git
cd mediagrab
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
```

> **Note:** `JWT_SECRET` and `NEXTAUTH_SECRET` will be automatically generated if not defined.

### 3. Build and run

```bash
docker-compose up -d --build
```

### 4. Check logs

```bash
docker-compose logs -f
```

### 5. Access the application

Open: **http://localhost:3000**

## Docker Commands

### Build

```bash
# Build the image
docker-compose build

# Build without cache
docker-compose build --no-cache
```

### Execution

```bash
# Start in background
docker-compose up -d

# Start with logs
docker-compose up

# Stop containers
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Logs and Debug

```bash
# View logs
docker-compose logs -f

# View logs from last minute
docker-compose logs --since 1m

# View logs from specific service
docker-compose logs -f mediagrab

# Enter container
docker-compose exec mediagrab sh
```

### Update

```bash
# Rebuild after changes
docker-compose up -d --build

# Update and restart
docker-compose pull && docker-compose up -d --build
```

## Advanced Configuration

### Environment Variables

All variables can be configured in `docker-compose.yml` or via `.env` file:

```yaml
environment:
  - DATABASE_URL=${DATABASE_URL}
  - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
  - NEXTAUTH_URL=${NEXTAUTH_URL}
```

### Health Check

The container includes an automatic health check:

```bash
# Check status
docker-compose ps

# Manual health check
curl http://localhost:3000/api/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2025-01-XX...",
  "database": "connected"
}
```

### Dockerfile Only (without Compose)

If you prefer to use only the Dockerfile:

```bash
# Build image
docker build -t mediagrab:latest .

# Run container
docker run -d \
  --name mediagrab \
  -p 3000:3000 \
  -e DATABASE_URL="your-supabase-url" \
  -e NEXT_PUBLIC_APP_URL="http://localhost:3000" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  mediagrab:latest
```

## Platform Deployment

### Coolify

#### Option 1: Docker Image (Recommended)

1. **Build and push the image (multi-architecture):**
   ```bash
   # Build for both amd64 and arm64 (supports servers and MacBooks)
   docker buildx build --platform linux/amd64,linux/arm64 -t your-username/mediagrab:latest --push .
   
   # Or build only for amd64 (servers)
   docker buildx build --platform linux/amd64 -t your-username/mediagrab:latest --push .
   ```
   
   > **Note:** The image supports both `linux/amd64` (x86_64 servers) and `linux/arm64` (Apple Silicon MacBooks, ARM servers). Docker will automatically select the correct architecture.

2. **In Coolify dashboard:**
   - Select "Docker Image" deployment type
   - Enter image name: `your-username/mediagrab:latest`
   - Set "Port Exposes" to `3000` (important!)
   - Configure environment variables (see below)
   - Deploy

#### Option 2: Git Repository

1. Connect your Git repository
2. Coolify will automatically detect the `Dockerfile`
3. Configure environment variables
4. Set "Port Exposes" to `3000`
5. Automatic deployment on each push

#### Environment Variables for Coolify

**Required:**
```env
DATABASE_URL=postgresql://postgres.PROJECT_ID:PASSWORD@aws-1-eu-central-1.pooler.supabase.com:5432/postgres
NEXT_PUBLIC_APP_URL=https://your-coolify-domain.com
NEXTAUTH_URL=https://your-coolify-domain.com
PORT=3000
```

**Important Notes:**
- Use Supabase **Session Pooler** URL (not direct connection)
- URL-encode special characters in password:
  - `#` → `%23`
  - `!` → `%21`
  - `@` → `%40`
  - `%` → `%25`
- Get the Session Pooler URL from Supabase Dashboard → Settings → Database → Connection Pooling
- Ensure "Port Exposes" is set to `3000` in Coolify (not `80`)

### Portainer

1. Go to **Stacks** → **Add Stack**
2. Paste the `docker-compose.yml` content
3. Configure environment variables
4. Click **Deploy**

### Railway

1. Connect the repository
2. Configure `DATABASE_URL` and other variables
3. Railway will automatically detect the Dockerfile
4. Automatic deployment

### Render

1. Connect the repository
2. Select "Docker" as environment
3. Configure environment variables
4. Automatic deployment

## Troubleshooting

### Container won't start

```bash
# View detailed logs
docker-compose logs mediagrab

# Check if DATABASE_URL is correct
docker-compose exec mediagrab env | grep DATABASE_URL
```

### Prisma migration error

```bash
# Run migrations manually
docker-compose exec mediagrab npx prisma migrate deploy

# Check database status
docker-compose exec mediagrab npx prisma db pull
```

### Permission issues

```bash
# Check container user
docker-compose exec mediagrab whoami

# Adjust permissions (if necessary)
docker-compose exec mediagrab chown -R nextjs:nodejs /app
```

### Complete rebuild

```bash
# Clean everything and rebuild
docker-compose down -v
docker system prune -a
docker-compose build --no-cache
docker-compose up -d
```

## Monitoring

### Container Status

```bash
docker-compose ps
```

### Resource Usage

```bash
docker stats mediagrab-app
```

### Health Check

The health check is available at `/api/health` and verifies:
- Application status
- Database connection
- Check timestamp

## Security

### Secrets

- Never commit the `.env` file
- Use Docker Compose secrets in production
- Configure sensitive variables via environment

### Non-root user

The container runs as user `nextjs` (non-root) for security.

### Network

The container uses an isolated network (`mediagrab-network`).

## Notes

- The container automatically installs `yt-dlp` and `ffmpeg`
- Prisma migrations are automatically executed on startup
- Secrets (`JWT_SECRET`, `NEXTAUTH_SECRET`) are automatically generated
- Health check is available at `/api/health`
- The build uses multi-stage to optimize the final image size
- **Multi-architecture support**: The image supports both `linux/amd64` (x86_64) and `linux/arm64` (Apple Silicon, ARM servers)
- All integrations (Stripe, SendGrid, OAuth) can be configured via admin panel after deployment
- No need to set OAuth, Stripe, or SendGrid credentials in environment variables - configure them in `/admin/settings`

## Support

For problems or questions:
- Open an issue on GitHub
- Consult the project documentation
- Check logs: `docker-compose logs -f`
