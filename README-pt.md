# MediaGrab API

<div align="center">

![MediaGrab Logo](./public/images/logo-longEscrito.png)

**API moderna para download de mídia de múltiplas plataformas**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat-square&logo=supabase)](https://supabase.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)

</div>

MediaGrab é uma API RESTful completa para download de mídia de múltiplas plataformas, incluindo YouTube, Instagram, TikTok, Twitter e outras. Oferece sistema completo de autenticação, gerenciamento de API keys, painel administrativo, integração com Stripe para pagamentos e SendGrid para envio de emails.

## Index

- [About](#about)
- [Usage](#usage)
  - [Installation](#installation)
  - [Commands](#commands)
- [Development](#development)
  - [Pre-Requisites](#pre-requisites)
  - [Development Environment](#development-environment)
  - [File Structure](#file-structure)
  - [Build](#build)
  - [Deployment](#deployment)
- [Community](#community)
  - [Contribution](#contribution)
  - [Branches](#branches)
  - [Guideline](#guideline)
- [FAQ](#faq)
- [Resources](#resources)
- [License](#license)

## About

MediaGrab é uma solução completa para desenvolvedores que precisam integrar funcionalidades de download de mídia em suas aplicações. A API oferece:

- **Suporte Multi-plataforma**: Download de vídeos, áudios e imagens de YouTube, Instagram, TikTok, Twitter e outras plataformas populares
- **RESTful API**: Endpoints bem documentados e fáceis de usar
- **Sistema de Autenticação Completo**: JWT, OAuth (Google, GitHub) e autenticação de dois fatores (2FA)
- **Painel Administrativo**: Interface completa para gerenciar usuários, API keys, configurações e estatísticas
- **Dashboard do Usuário**: Área personalizada para cada usuário gerenciar suas chaves de API e downloads
- **Gerenciamento de API Keys**: Sistema robusto com limites de uso e controle de acesso
- **Integração de Pagamentos**: Stripe integrado para planos de assinatura (Developer, Startup, Enterprise) - Configurável via painel admin
- **Serviço de Email**: Integração com SendGrid para envio de emails transacionais - Configurável via painel admin
- **Integração OAuth**: Login com Google e GitHub - Configurável via painel admin
- **Banco de Dados Moderno**: PostgreSQL via Supabase com Prisma ORM
- **Docker Ready**: Deploy rápido e fácil com Docker e Docker Compose
- **Suporte Multi-Arquitetura**: Imagem Docker suporta tanto `linux/amd64` quanto `linux/arm64` (funciona em servidores e MacBooks Apple Silicon)
- **Configuração via Painel Admin**: Todas as integrações (Stripe, SendGrid, OAuth) podem ser configuradas através do painel administrativo sem editar arquivos `.env`

A aplicação é construída com Next.js 16, React 19, TypeScript e utiliza Supabase como banco de dados PostgreSQL gerenciado.

## Usage

### Installation

#### Prerequisites

- **Node.js** 20.0.0 ou superior
- **npm** 10.0.0 ou superior
- **Conta Supabase** - Crie uma conta gratuita em [supabase.com](https://supabase.com)
- **yt-dlp** - Instalado no sistema ([instruções de instalação](https://github.com/yt-dlp/yt-dlp#installation))

#### Installation Steps

1. **Clone o repositório**
```bash
git clone https://github.com/fefogaca/mediagrab.git
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

> **Nota:** `JWT_SECRET` e `NEXTAUTH_SECRET` são gerados automaticamente se não estiverem definidos no `.env`. Eles serão salvos automaticamente no arquivo `.env` na primeira execução.
> 
> **Importante:** Após o primeiro login, configure Stripe, SendGrid e OAuth (Google/GitHub) através do painel administrativo em `/admin/settings`. Não é necessário editar arquivos `.env` para essas integrações.

#### Docker Installation

<details>
<summary>Instalação rápida com Docker</summary>

##### Prerequisites

- **Docker** 20.10+ e **Docker Compose** 2.0+
- **Conta Supabase** - Crie uma conta gratuita em [supabase.com](https://supabase.com)

##### Quick Start

1. **Clone o repositório**
```bash
git clone https://github.com/fefogaca/mediagrab.git
cd mediagrab
```

2. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
# Edite o .env e configure sua DATABASE_URL do Supabase
```

3. **Build e inicie com Docker Compose**
```bash
docker-compose up -d
```

4. **Verifique os logs**
```bash
docker-compose logs -f
```

5. **Acesse a aplicação**
Acesse: **http://localhost:3000**

A aplicação executará automaticamente:
- Migrações do Prisma
- Geração do Prisma Client
- Inicialização do servidor Next.js
- Health check disponível em `/api/health`

Para documentação detalhada do Docker, consulte [DOCKER-pt.md](./DOCKER-pt.md)

</details>

### Commands

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento
npm run build            # Build para produção
npm run start            # Inicia servidor de produção
npm run lint             # Executa o linter

# Limpeza
npm run clean            # Remove cache do Next.js
npm run clean:all        # Remove cache e node_modules

# Instalação
npm run install:clean    # Instala dependências limpas
npm run install:fast     # Instalação rápida com npm ci
```

## Development

### Pre-Requisites

Antes de começar a desenvolver, certifique-se de ter instalado:

- Node.js 20.0.0 ou superior
- npm 10.0.0 ou superior
- Git
- Conta Supabase (gratuita)
- yt-dlp instalado no sistema
- Docker e Docker Compose (opcional, para desenvolvimento com containers)

### Development Environment

1. **Clone o repositório**
```bash
git clone https://github.com/fefogaca/mediagrab.git
cd mediagrab
```

2. **Instale as dependências**
```bash
npm install --legacy-peer-deps
```

3. **Configure o ambiente**
```bash
cp .env.example .env
```

4. **Configure o banco de dados**
   - Crie um projeto no Supabase
   - Obtenha a `DATABASE_URL` do projeto
   - Adicione ao arquivo `.env`

5. **Execute as migrações**
```bash
npx prisma migrate dev
npx prisma generate
```

6. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

### File Structure

```
mediagrab/
├── prisma/
│   └── schema.prisma              # Schema do banco de dados Prisma
├── public/
│   └── images/                    # Imagens estáticas
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── api/                    # Rotas da API
│   │   │   ├── admin/             # Endpoints administrativos
│   │   │   ├── auth/               # Autenticação
│   │   │   ├── dashboard/          # Endpoints do dashboard
│   │   │   ├── download/           # Download de mídia
│   │   │   ├── payments/           # Pagamentos Stripe
│   │   │   └── webhooks/           # Webhooks
│   │   ├── admin/                  # Páginas do painel admin
│   │   ├── dashboard/              # Páginas do dashboard do usuário
│   │   ├── login/                  # Página de login
│   │   └── layout.tsx              # Layout principal
│   ├── backend/
│   │   ├── lib/                    # Utilitários
│   │   │   ├── database.ts        # Conexão Prisma
│   │   │   ├── auth.ts             # Configuração NextAuth
│   │   │   ├── secrets.ts          # Gerenciamento de secrets
│   │   │   ├── stripe.ts           # Configuração Stripe
│   │   │   ├── sendgrid.ts        # Configuração SendGrid
│   │   │   ├── oauth.ts            # Configuração OAuth
│   │   │   └── auth-providers.ts   # Gerenciamento de providers OAuth
│   │   ├── models/                 # Modelos de dados
│   │   │   ├── User.ts             # Modelo de usuário
│   │   │   ├── ApiKey.ts           # Modelo de API key
│   │   │   ├── Settings.ts         # Modelo de configurações
│   │   │   └── ...
│   │   └── services/               # Lógica de negócio
│   │       ├── email.ts             # Serviço de email
│   │       └── media.ts            # Serviço de download
│   └── frontend/
│       └── components/              # Componentes React
│           ├── ui/                  # Componentes UI base
│           └── ...
├── Dockerfile                       # Configuração Docker
├── docker-compose.yml               # Docker Compose
├── docker-entrypoint.sh             # Script de inicialização
├── next.config.mjs                   # Configuração Next.js
├── package.json                      # Dependências do projeto
└── README.md                         # Este arquivo
```

| No | File/Folder | Description |
|----|-------------|-------------|
| 1  | `src/app/api/` | Rotas da API REST |
| 2  | `src/app/admin/` | Páginas do painel administrativo |
| 3  | `src/app/dashboard/` | Páginas do dashboard do usuário |
| 4  | `src/backend/lib/` | Utilitários e configurações |
| 5  | `src/backend/models/` | Modelos de dados Prisma |
| 6  | `src/backend/services/` | Serviços de negócio |
| 7  | `prisma/schema.prisma` | Schema do banco de dados |

### Build

Para criar um build de produção:

```bash
# Build da aplicação
npm run build

# Iniciar servidor de produção
npm run start
```

O build gera uma versão otimizada da aplicação na pasta `.next/standalone` (quando `output: 'standalone'` está configurado no `next.config.mjs`).

### Deployment

#### Docker Deployment

A forma mais fácil de fazer deploy é usando Docker:

```bash
# Build e start
docker-compose up -d --build

# Ver logs
docker-compose logs -f
```

#### Platform-Specific Deployment

**Coolify:**
1. **Opção 1: Docker Image (Recomendado)**
   - Build da imagem localmente: `docker buildx build --platform linux/amd64 -t seu-usuario/mediagrab:latest --push .`
   - No Coolify, selecione deploy "Docker Image"
   - Digite o nome da imagem: `seu-usuario/mediagrab:latest`
   - Configure as variáveis de ambiente (veja abaixo)
   - Defina "Port Exposes" para `3000` (importante!)
   - Faça o deploy

2. **Opção 2: Repositório Git**
   - Conecte seu repositório Git
   - O Coolify detectará automaticamente o `Dockerfile`
   - Configure as variáveis de ambiente
   - Deploy automático a cada push

**Importante para Coolify:**
- Use a URL do **Session Pooler** do Supabase (não conexão direta)
- Formato: `postgresql://postgres.PROJECT_ID:SENHA@aws-1-eu-central-1.pooler.supabase.com:5432/postgres`
- Codifique caracteres especiais na senha (`#` → `%23`, `!` → `%21`)
- Defina `PORT=3000` e "Port Exposes" para `3000` no dashboard do Coolify
- Configure `NEXT_PUBLIC_APP_URL` e `NEXTAUTH_URL` com seu domínio do Coolify

**Portainer:**
1. Vá em **Stacks** → **Add Stack**
2. Cole o conteúdo do `docker-compose.yml`
3. Configure as variáveis de ambiente
4. Clique em **Deploy**

**Railway/Render:**
1. Conecte o repositório
2. Configure `DATABASE_URL` e outras variáveis
3. A plataforma detectará o Dockerfile automaticamente
4. Deploy automático

Para instruções detalhadas de deploy, consulte [DOCKER-pt.md](./DOCKER-pt.md)

## Community

### Contribution

Suas contribuições são sempre bem-vindas e apreciadas. Seguem as formas de contribuir:

1. **Reportar um bug**  
Se você encontrou um bug, reporte [aqui](https://github.com/fefogaca/mediagrab/issues) e cuidaremos disso.

2. **Solicitar uma feature**  
Você também pode solicitar uma feature [aqui](https://github.com/fefogaca/mediagrab/issues), e se for viável, será incluída no desenvolvimento.

3. **Criar um pull request**  
Não pode ficar melhor que isso! Seu pull request será apreciado pela comunidade. Você pode começar pegando qualquer issue aberta [aqui](https://github.com/fefogaca/mediagrab/issues) e criar um pull request.

> Se você é novo em open-source, certifique-se de ler mais sobre isso [aqui](https://www.digitalocean.com/community/tutorial_series/an-introduction-to-open-source) e aprender mais sobre como criar um pull request [aqui](https://www.digitalocean.com/community/tutorials/how-to-create-a-pull-request-on-github).

### Branches

Utilizamos uma metodologia ágil de integração contínua, então a versão é atualizada frequentemente e o desenvolvimento é muito rápido.

1. **`main`** é o branch de produção.
2. **`develop`** é o branch de desenvolvimento.
3. Nenhum outro branch permanente deve ser criado no repositório principal. Você pode criar branches de feature, mas eles devem ser mesclados com o `main`.

**Passos para trabalhar com feature branch**

1. Para começar a trabalhar em uma nova feature, crie um novo branch prefixado com `feat` seguido do nome da feature. (ex: `feat-FEATURE-NAME`)
2. Uma vez que você terminar suas mudanças, você pode criar um PR.

**Passos para criar um pull request**

1. Faça um PR para o branch `develop`.
2. Cumpra com as melhores práticas e diretrizes, por exemplo, onde o PR concerne elementos visuais, deve ter uma imagem mostrando o efeito.
3. Deve passar todas as verificações de integração contínua e obter revisões positivas.

Após isso, as mudanças serão mescladas.

### Guideline

- Siga o estilo de código existente
- Adicione testes para novas features
- Atualize a documentação conforme necessário
- Mantenha commits atômicos e bem descritos
- Use TypeScript para todo código novo
- Siga as convenções de nomenclatura do projeto
- Adicione comentários JSDoc para funções públicas
- Mantenha o código limpo e legível

## FAQ

**Como começar?**

1. Clone o repositório
2. Instale as dependências: `npm install --legacy-peer-deps`
3. Configure seu banco Supabase e adicione `DATABASE_URL` ao `.env`
4. Execute as migrações: `npx prisma migrate dev`
5. Inicie o servidor de desenvolvimento: `npm run dev`

**Posso usar Docker?**

Sim! Veja a seção [Docker Installation](#installation) acima.

**Como configuro Stripe/SendGrid/OAuth?**

Após fazer login como admin, vá para `/admin/settings` e configure esses serviços através do painel administrativo. Você pode configurar:
- **Stripe**: Processamento de pagamentos com chaves de API e secrets de webhook
- **SendGrid**: Envio de emails com chave de API e email remetente
- **Google OAuth**: Login com Google usando Client ID e Secret
- **GitHub OAuth**: Login com GitHub usando Client ID e Secret

Não é necessário editar arquivos `.env` - tudo é gerenciado através do painel administrativo.

**Quais plataformas são suportadas?**

Atualmente suporta: YouTube, Instagram, TikTok, Twitter e outras. Consulte a documentação da API para a lista completa.

**Como faço o deploy?**

Você pode fazer deploy usando Docker para plataformas como Coolify, Portainer, Railway ou Render. Veja a seção [Deployment](#deployment) para instruções específicas de plataforma.

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Docker Documentation](https://docs.docker.com/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Stripe Documentation](https://stripe.com/docs)
- [SendGrid Documentation](https://docs.sendgrid.com/)

## License

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

<div align="center">

Made with ❤️ by [fefogaca](https://github.com/fefogaca)

[Report Bug](https://github.com/fefogaca/mediagrab/issues) • [Request Feature](https://github.com/fefogaca/mediagrab/issues)

</div>

