<div align="center">
  <img src="public/images/logo-longEscrito.png" alt="MediaGrab Logo" width="300" />
  
  <p><strong>The Ultimate Media Downloading API</strong></p>
  
  [![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat-square&logo=supabase)](https://supabase.com/)
  [![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
  [![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
</div>

---

## :ledger: Index

- [About](#beginner-about)
- [Features](#sparkles-features)
- [Usage](#zap-usage)
  - [Installation](#electric_plug-installation)
  - [Configuration](#gear-configuration)
  - [Commands](#package-commands)
- [Development](#wrench-development)
  - [Pre-Requisites](#notebook-pre-requisites)
  - [Development Environment](#nut_and_bolt-development-environment)
  - [File Structure](#file_folder-file-structure)
  - [Database Setup](#database-database-setup)
  - [Build](#hammer-build)
  - [Deployment](#rocket-deployment)
- [API Documentation](#api-api-documentation)
- [Community](#cherry_blossom-community)
  - [Contribution](#fire-contribution)
  - [Branches](#cactus-branches)
  - [Guideline](#exclamation-guideline)
- [FAQ](#question-faq)
- [Resources](#page_facing_up-resources)
- [Credit/Acknowledgment](#star2-creditacknowledgment)
- [License](#lock-license)

## :beginner: About

**MediaGrab** é uma API poderosa e completa para download de mídia de mais de 1000+ plataformas, incluindo YouTube, Instagram, TikTok, Twitter e muito mais. Construída com Next.js 16, TypeScript, Supabase/PostgreSQL e Prisma, oferece uma solução robusta e escalável para integração de downloads de mídia em qualquer aplicação.

### Principais Características

- 🎥 **Download Multi-Plataforma** - Suporte para 1000+ sites de mídia
- 🔄 **Sistema de Fallback** - 4 providers diferentes para máxima disponibilidade
- 🔐 **Autenticação Completa** - JWT e NextAuth com suporte a OAuth
- 📊 **Dashboard Admin** - Painel completo de administração
- 👤 **Sistema de Usuários** - Gerenciamento completo de usuários e permissões
- 🔑 **API Keys** - Sistema de chaves de API por usuário
- 💳 **Pagamentos** - Integração com Stripe para subscrições
- 📧 **Emails** - Integração com SendGrid
- 🌍 **i18n** - Suporte para Português e Inglês

## :sparkles: Features

- 🎥 **Download de Mídia** - Suporte para 1000+ plataformas (YouTube, Instagram, TikTok, Twitter, etc.)
- 🔄 **Sistema de Fallback** - 4 providers (yt-dlp, @distube/ytdl-core, ytdl-core, play-dl) para máxima disponibilidade
- 🌐 **API RESTful** - API completa para integração em qualquer projeto
- 👤 **Sistema de Usuários** - Autenticação completa com JWT e NextAuth
- 🔑 **API Keys** - Gerenciamento de chaves de API por usuário
- 📊 **Dashboard Admin** - Painel completo para gerenciar a plataforma
- 📱 **Dashboard Usuário** - Painel para usuários gerenciarem suas API Keys
- 🌍 **Internacionalização** - Suporte para Português e Inglês
- 💳 **Pagamentos** (Opcional) - Integração com Stripe para subscrições
- 📧 **Emails** (Opcional) - Integração com SendGrid
- 🔐 **OAuth** (Opcional) - Login com Google e GitHub
- 🗄️ **Banco de Dados Moderno** - Supabase/PostgreSQL com Prisma ORM
- ⚙️ **Configuração Centralizada** - Painel admin para gerenciar configurações

## :zap: Usage

### :electric_plug: Installation

#### Pré-requisitos

- **Node.js** 20.0.0 ou superior
- **npm** 10.0.0 ou superior
- **Supabase** - Conta e projeto criado ([criar conta gratuita](https://supabase.com))
- **yt-dlp** - Instalado no sistema ([instruções de instalação](https://github.com/yt-dlp/yt-dlp#installation))

#### Passos de Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/mediagrab.git
cd mediagrab
```

2. **Instale as dependências**
```bash
npm install --legacy-peer-deps
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

4. **Configure o banco de dados**
   - Crie um projeto no Supabase
   - Copie a `DATABASE_URL` do projeto
   - Cole no arquivo `.env`

5. **Execute as migrações do Prisma**
```bash
npx prisma migrate dev
```

6. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

Acesse: **http://localhost:3000**

### :gear: Configuration

#### Variáveis de Ambiente Obrigatórias

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Banco de Dados - Supabase/PostgreSQL
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# URL da aplicação
NEXT_PUBLIC_APP_URL=http://localhost:3000

# NextAuth
NEXTAUTH_URL=http://localhost:3000
```

> **Nota:** `JWT_SECRET` e `NEXTAUTH_SECRET` são gerados automaticamente se não existirem no `.env`. Eles serão salvos automaticamente no arquivo `.env` na primeira execução.

#### Variáveis Opcionais (Integrações)

Essas variáveis podem ser configuradas através do painel admin (`/admin/settings`) após o primeiro login:

- **Pagamentos - Stripe**: Configurado no painel admin
- **Email - SendGrid**: Configurado no painel admin
- **OAuth - Google**: Configurado no painel admin
- **OAuth - GitHub**: Configurado no painel admin

> **Nota:** Se as integrações não estiverem configuradas, os botões correspondentes mostrarão uma mensagem informando que a funcionalidade será implementada em breve.

### :package: Commands

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento (com Webpack)

# Build e Produção
npm run build        # Compila para produção
npm run start        # Inicia servidor de produção

# Qualidade de Código
npm run lint         # Executa ESLint

# Utilitários
npm run clean        # Limpa cache do Next.js (.next e node_modules/.cache)
npm run clean:all    # Limpa tudo incluindo node_modules

# Banco de Dados
npx prisma migrate dev    # Executa migrações em desenvolvimento
npx prisma generate       # Gera Prisma Client
npx prisma studio         # Abre Prisma Studio (GUI do banco)
```

## :wrench: Development

### :notebook: Pre-Requisites

Antes de começar a desenvolver, certifique-se de ter instalado:

- **Node.js** 20.0.0 ou superior
- **npm** 10.0.0 ou superior
- **Git** para controle de versão
- **Supabase CLI** (opcional, para desenvolvimento local)
- **yt-dlp** instalado e disponível no PATH

### :nut_and_bolt: Development Environment

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/mediagrab.git
cd mediagrab
```

2. **Instale as dependências**
```bash
npm install --legacy-peer-deps
```

3. **Configure o ambiente**
```bash
cp .env.example .env
# Edite o .env com suas credenciais
```

4. **Configure o banco de dados**
```bash
# Configure DATABASE_URL no .env
# Execute as migrações
npx prisma migrate dev
```

5. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

6. **Crie o primeiro administrador**
   - Acesse http://localhost:3000/login
   - Um popup aparecerá automaticamente para criar o primeiro admin
   - Preencha: Nome, Email e Senha (mínimo 8 caracteres)

### :file_folder: File Structure

```
mediagrab/
├── prisma/
│   ├── schema.prisma          # Schema do banco de dados (Prisma)
│   └── migrations/            # Migrações do banco de dados
│
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── admin/             # Painel de administração
│   │   │   ├── settings/      # Configurações globais
│   │   │   ├── users/          # Gerenciamento de usuários
│   │   │   ├── api-keys/       # Gerenciamento de API Keys
│   │   │   └── ...
│   │   ├── dashboard/         # Painel do usuário
│   │   │   ├── settings/      # Configurações do usuário
│   │   │   └── ...
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # Autenticação (login, logout, me)
│   │   │   ├── admin/         # Endpoints administrativos
│   │   │   ├── dashboard/     # Endpoints do usuário
│   │   │   ├── download/      # API de download
│   │   │   ├── setup/         # Setup inicial
│   │   │   └── webhooks/      # Webhooks (Stripe)
│   │   ├── login/             # Página de login
│   │   ├── register/          # Página de registro
│   │   ├── docs/              # Documentação da API
│   │   ├── pricing/           # Página de preços
│   │   ├── layout.tsx         # Layout raiz
│   │   └── page.tsx           # Página inicial
│   │
│   ├── frontend/              # Código do frontend
│   │   ├── components/
│   │   │   ├── ui/            # Componentes Shadcn UI
│   │   │   └── shared/        # Componentes compartilhados
│   │   └── hooks/             # React Hooks customizados
│   │
│   ├── backend/               # Código do backend
│   │   ├── models/            # Modelos Prisma (wrappers)
│   │   │   ├── User.ts        # Modelo de usuário
│   │   │   ├── ApiKey.ts      # Modelo de API Key
│   │   │   ├── Settings.ts    # Modelo de configurações
│   │   │   └── ...
│   │   ├── services/          # Serviços (email, pagamento)
│   │   └── lib/              # Utilitários
│   │       ├── database.ts    # Cliente Prisma
│   │       ├── auth.ts        # Configuração NextAuth
│   │       └── secrets.ts     # Gerenciamento de secrets
│   │
│   └── lib/                   # Utilitários compartilhados
│       ├── i18n/              # Internacionalização
│       └── media/             # Utilitários de mídia
│
├── public/                    # Assets estáticos
│   └── images/                # Imagens
│
├── .env                       # Variáveis de ambiente (não commitado)
├── .env.example               # Exemplo de variáveis de ambiente
├── .gitignore                 # Arquivos ignorados pelo Git
├── next.config.mjs            # Configuração do Next.js
├── package.json               # Dependências do projeto
├── prisma/schema.prisma       # Schema do Prisma
├── tailwind.config.ts         # Configuração do Tailwind
└── tsconfig.json              # Configuração do TypeScript
```

| Arquivo/Diretório | Descrição |
|-------------------|-----------|
| `prisma/schema.prisma` | Define o schema do banco de dados |
| `src/app/` | Rotas e páginas do Next.js (App Router) |
| `src/app/api/` | Endpoints da API REST |
| `src/backend/models/` | Wrappers dos modelos Prisma |
| `src/backend/lib/database.ts` | Cliente Prisma configurado |
| `src/middleware.ts` | Middleware de autenticação e roteamento |
| `.env` | Variáveis de ambiente (criar manualmente) |

### :database: Database Setup

O projeto usa **Supabase** (PostgreSQL) com **Prisma ORM**.

#### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma conta gratuita
3. Crie um novo projeto
4. Copie a `DATABASE_URL` do projeto

#### 2. Configurar no Projeto

1. Adicione `DATABASE_URL` no arquivo `.env`:
```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
```

2. Execute as migrações:
```bash
npx prisma migrate dev
```

3. (Opcional) Abra o Prisma Studio para visualizar os dados:
```bash
npx prisma studio
```

#### Modelos Principais

- **User** - Usuários do sistema
- **ApiKey** - Chaves de API dos usuários
- **Settings** - Configurações globais da aplicação
- **Payment** - Histórico de pagamentos
- **DownloadLog** - Logs de downloads
- **Notification** - Notificações do sistema

### :hammer: Build

Para compilar o projeto para produção:

```bash
# Build de produção
npm run build

# Iniciar servidor de produção
npm run start
```

O build gera os arquivos otimizados na pasta `.next/`.

### :rocket: Deployment

#### Vercel (Recomendado)

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_APP_URL`
   - `NEXTAUTH_URL`
3. Deploy automático a cada push

#### Outras Plataformas

O projeto pode ser deployado em qualquer plataforma que suporte Next.js:
- **Netlify**
- **Railway**
- **DigitalOcean**
- **AWS**
- **Google Cloud**

## :api: API Documentation

### Autenticação

Todas as requisições à API devem incluir uma API Key no header:

```bash
curl -X GET "http://localhost:3000/api/download?url=VIDEO_URL" \
  -H "X-API-Key: sua-api-key"
```

### Endpoints Principais

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/api/download?url={url}` | Obtém informações e formatos do vídeo | API Key |
| GET | `/api/download-direct?url={url}&format={format}` | Download direto | API Key |
| GET | `/api/public-download?url={url}` | Download público (para testes) | Nenhuma |
| POST | `/api/auth/login` | Login de usuário | Nenhuma |
| GET | `/api/auth/me` | Dados do usuário atual | Cookie |
| GET | `/api/dashboard/my-api-keys` | Lista API Keys do usuário | Cookie |
| POST | `/api/dashboard/my-api-keys` | Cria nova API Key | Cookie |

### Exemplo de Resposta

```json
{
  "success": true,
  "data": {
    "title": "Video Title",
    "thumbnail": "https://...",
    "duration": 120,
    "platform": "youtube",
    "formats": [
      {
        "quality": "1080p",
        "format": "mp4",
        "url": "https://..."
      }
    ]
  }
}
```

### Sistema de Fallback

O MediaGrab utiliza um sistema robusto de fallback com 4 providers:

| Provider | Plataformas | Prioridade |
|----------|-------------|------------|
| **yt-dlp** | 1000+ sites | Primário |
| **@distube/ytdl-core** | YouTube | Fallback 1 |
| **ytdl-core** | YouTube | Fallback 2 |
| **play-dl** | YouTube, SoundCloud | Fallback 3 |

## :cherry_blossom: Community

### :fire: Contribution

Suas contribuições são sempre bem-vindas e apreciadas! Seguem as formas de contribuir:

1. **Reportar um bug** <br>
   Se você encontrou um bug, reporte [aqui](https://github.com/seu-usuario/mediagrab/issues) e cuidaremos dele.

2. **Solicitar uma feature** <br>
   Você também pode solicitar uma feature [aqui](https://github.com/seu-usuario/mediagrab/issues), e se for viável, será desenvolvida.

3. **Criar um pull request** <br>
   Sua contribuição será apreciada pela comunidade. Você pode começar pegando qualquer issue aberta [aqui](https://github.com/seu-usuario/mediagrab/issues) e criar um pull request.

> Se você é novo em open-source, certifique-se de ler mais sobre isso [aqui](https://www.digitalocean.com/community/tutorial_series/an-introduction-to-open-source) e aprender mais sobre criar pull requests [aqui](https://www.digitalocean.com/community/tutorials/how-to-create-a-pull-request-on-github).

### :cactus: Branches

Usamos uma metodologia ágil de integração contínua:

1. **`main`** é a branch de produção
2. **`develop`** é a branch de desenvolvimento
3. Não devem ser criadas outras branches permanentes no repositório principal

**Passos para trabalhar com feature branch**

1. Para começar a trabalhar em uma nova feature, crie uma nova branch prefixada com `feat/` seguida do nome da feature (ex: `feat/nova-funcionalidade`)
2. Quando terminar suas mudanças, você pode criar um PR

**Passos para criar um pull request**

1. Faça um PR para a branch `develop`
2. Comply com as melhores práticas e diretrizes
3. Deve passar todas as verificações de integração contínua e receber revisões positivas

Após isso, as mudanças serão mescladas.

### :exclamation: Guideline

- Use TypeScript para todo o código
- Siga os padrões do ESLint configurados
- Escreva commits descritivos
- Adicione testes quando possível
- Documente mudanças significativas
- Mantenha o código limpo e legível

## :question: FAQ

**P: Preciso configurar todas as integrações (Stripe, SendGrid, OAuth)?**  
R: Não! Essas são opcionais. Você pode configurá-las através do painel admin (`/admin/settings`) quando necessário.

**P: Como criar o primeiro administrador?**  
R: Ao acessar `/login` pela primeira vez, um popup aparecerá automaticamente para criar o primeiro admin.

**P: O projeto funciona sem Supabase?**  
R: Não, o projeto requer Supabase/PostgreSQL. Você pode criar uma conta gratuita em [supabase.com](https://supabase.com).

**P: Posso usar outro banco de dados?**  
R: O projeto está configurado para PostgreSQL. Para usar outro banco, você precisaria adaptar o schema do Prisma.

**P: Como gerar uma API Key?**  
R: Após fazer login, acesse `/dashboard` e clique em "New API Key" no painel de API Keys.

## :page_facing_up: Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn UI Components](https://ui.shadcn.com/)

## :camera: Gallery

*Adicione screenshots do projeto aqui*

## :star2: Credit/Acknowledgment

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - Backend de download
- [Shadcn UI](https://ui.shadcn.com/) - Componentes UI
- [Next.js](https://nextjs.org/) - Framework React
- [Supabase](https://supabase.com/) - Banco de dados
- [Prisma](https://www.prisma.io/) - ORM

---

<div align="center">
  <p>Feito com ❤️ por <a href="https://github.com/fefogaca">fefogaca</a></p>
</div>

## :lock: License

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
