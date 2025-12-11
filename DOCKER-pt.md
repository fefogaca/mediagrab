# Docker Deployment Guide

Guia completo para deploy do MediaGrab usando Docker.

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

Antes de começar, certifique-se de ter:

- Docker 20.10+ instalado
- Docker Compose 2.0+ instalado
- Conta Supabase com projeto criado
- `DATABASE_URL` do Supabase

## Quick Start

### 1. Clone o repositório

```bash
git clone https://github.com/fefogaca/mediagrab.git
cd mediagrab
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` e configure:

```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
```

> **Nota:** `JWT_SECRET` e `NEXTAUTH_SECRET` serão gerados automaticamente se não estiverem definidos.

### 3. Build e execute

```bash
docker-compose up -d --build
```

### 4. Verifique os logs

```bash
docker-compose logs -f
```

### 5. Acesse a aplicação

Abra: **http://localhost:3000**

## Docker Commands

### Build

```bash
# Build da imagem
docker-compose build

# Build sem cache
docker-compose build --no-cache
```

### Execução

```bash
# Iniciar em background
docker-compose up -d

# Iniciar com logs
docker-compose up

# Parar containers
docker-compose down

# Parar e remover volumes
docker-compose down -v
```

### Logs e Debug

```bash
# Ver logs
docker-compose logs -f

# Ver logs do último minuto
docker-compose logs --since 1m

# Ver logs de um serviço específico
docker-compose logs -f mediagrab

# Entrar no container
docker-compose exec mediagrab sh
```

### Atualização

```bash
# Rebuild após mudanças
docker-compose up -d --build

# Atualizar e reiniciar
docker-compose pull && docker-compose up -d --build
```

## Advanced Configuration

### Variáveis de Ambiente

Todas as variáveis podem ser configuradas no `docker-compose.yml` ou via arquivo `.env`:

```yaml
environment:
  - DATABASE_URL=${DATABASE_URL}
  - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
  - NEXTAUTH_URL=${NEXTAUTH_URL}
```

### Health Check

O container inclui um health check automático:

```bash
# Verificar status
docker-compose ps

# Health check manual
curl http://localhost:3000/api/health
```

Resposta esperada:

```json
{
  "status": "healthy",
  "timestamp": "2025-01-XX...",
  "database": "connected"
}
```

### Dockerfile Only (sem Compose)

Se preferir usar apenas o Dockerfile:

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

#### Opção 1: Docker Image (Recomendado)

1. **Build e push da imagem:**
   ```bash
   docker buildx build --platform linux/amd64 -t seu-usuario/mediagrab:latest --push .
   ```

2. **No dashboard do Coolify:**
   - Selecione tipo de deploy "Docker Image"
   - Digite o nome da imagem: `seu-usuario/mediagrab:latest`
   - Defina "Port Exposes" para `3000` (importante!)
   - Configure as variáveis de ambiente (veja abaixo)
   - Faça o deploy

#### Opção 2: Repositório Git

1. Conecte seu repositório Git
2. O Coolify detectará automaticamente o `Dockerfile`
3. Configure as variáveis de ambiente
4. Defina "Port Exposes" para `3000`
5. Deploy automático a cada push

#### Variáveis de Ambiente para Coolify

**Obrigatórias:**
```env
DATABASE_URL=postgresql://postgres.PROJECT_ID:SENHA@aws-1-eu-central-1.pooler.supabase.com:5432/postgres
NEXT_PUBLIC_APP_URL=https://seu-dominio-coolify.com
NEXTAUTH_URL=https://seu-dominio-coolify.com
PORT=3000
```

**Notas Importantes:**
- Use a URL do **Session Pooler** do Supabase (não conexão direta)
- Codifique caracteres especiais na senha:
  - `#` → `%23`
  - `!` → `%21`
  - `@` → `%40`
  - `%` → `%25`
- Obtenha a URL do Session Pooler em Supabase Dashboard → Settings → Database → Connection Pooling
- Certifique-se de que "Port Exposes" está definido para `3000` no Coolify (não `80`)

### Portainer

1. Vá em **Stacks** → **Add Stack**
2. Cole o conteúdo do `docker-compose.yml`
3. Configure as variáveis de ambiente
4. Clique em **Deploy**

### Railway

1. Conecte o repositório
2. Configure `DATABASE_URL` e outras variáveis
3. Railway detectará o Dockerfile automaticamente
4. Deploy automático

### Render

1. Conecte o repositório
2. Selecione "Docker" como ambiente
3. Configure as variáveis de ambiente
4. Deploy automático

## Troubleshooting

### Container não inicia

```bash
# Ver logs detalhados
docker-compose logs mediagrab

# Verificar se o DATABASE_URL está correto
docker-compose exec mediagrab env | grep DATABASE_URL
```

### Erro de migração do Prisma

```bash
# Executar migrações manualmente
docker-compose exec mediagrab npx prisma migrate deploy

# Verificar status do banco
docker-compose exec mediagrab npx prisma db pull
```

### Problemas de permissão

```bash
# Verificar usuário do container
docker-compose exec mediagrab whoami

# Ajustar permissões (se necessário)
docker-compose exec mediagrab chown -R nextjs:nodejs /app
```

### Rebuild completo

```bash
# Limpar tudo e reconstruir
docker-compose down -v
docker system prune -a
docker-compose build --no-cache
docker-compose up -d
```

## Monitoring

### Status do Container

```bash
docker-compose ps
```

### Uso de Recursos

```bash
docker stats mediagrab-app
```

### Health Check

O health check está disponível em `/api/health` e verifica:
- Status da aplicação
- Conexão com o banco de dados
- Timestamp da verificação

## Security

### Secrets

- Nunca commite o arquivo `.env`
- Use secrets do Docker Compose em produção
- Configure variáveis sensíveis via ambiente

### Usuário não-root

O container roda como usuário `nextjs` (não-root) para segurança.

### Network

O container usa uma network isolada (`mediagrab-network`).

## Notes

- O container instala automaticamente `yt-dlp` e `ffmpeg`
- Migrações do Prisma são executadas automaticamente no startup
- Secrets (`JWT_SECRET`, `NEXTAUTH_SECRET`) são gerados automaticamente
- Health check está disponível em `/api/health`
- O build usa multi-stage para otimizar o tamanho da imagem final
- Todas as integrações (Stripe, SendGrid, OAuth) podem ser configuradas via painel admin após o deploy
- Não é necessário definir credenciais OAuth, Stripe ou SendGrid em variáveis de ambiente - configure-as em `/admin/settings`

## Support

Para problemas ou dúvidas:
- Abra uma issue no GitHub
- Consulte a documentação do projeto
- Verifique os logs: `docker-compose logs -f`

