# MediaGrab - The Ultimate Media Downloading API

MediaGrab é uma API poderosa, confiável e fácil de integrar para gerar instantaneamente links de download para qualquer vídeo ou áudio de diversas plataformas.

## ✨ Features

- **Interface Moderna:** UI completamente redesenhada com animações suaves, gradientes modernos e design responsivo
- **Fácil de Usar:** Simplesmente cole um link para obter links de download
- **Dashboard Administrativo:** Gerencie usuários e API keys com interface moderna
- **Dashboard de Usuário:** Painel dedicado para usuários regulares gerenciarem suas próprias API keys e visualizarem métricas pessoais
- **Sistema de Notificações:** Admin pode criar notificações que aparecem tanto no painel admin quanto no dashboard de usuário
- **Gerenciamento Completo:** Admin pode criar usuários, gerenciar API keys de todos os usuários e enviar notificações
- **Seguro:** Usa JWT para autenticação, bcrypt para hash de senhas e captcha matemático no login
- **Múltiplas Plataformas:** Suporte para YouTube, Instagram, TikTok, Twitter/X, Vimeo, Facebook, Dailymotion e SoundCloud
- **Dark/Light Mode:** Toggle funcional com persistência
- **Métricas em Tempo Real:** Dashboard com estatísticas calculadas a partir das requisições
- **Tier Gratuito:** Plano Developer gratuito para projetos pessoais
- **Tratamento Robusto de Erros:** Sistema de fallback inteligente para garantir downloads mesmo quando formatos específicos não estão disponíveis

## Getting Started

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd mediagrab
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Environment Variables

Create a `.env.local` file in the root of your project. You can use `.env.local.example` as a template.

**Variáveis Obrigatórias:**
```
JWT_SECRET=your_super_secret_jwt_key
NEXT_PUBLIC_API_BASE_URL=https://api.felipefogaca.net
```

**Variáveis Opcionais:**
```
NEXT_PUBLIC_WEB_BASE_URL=https://yourdomain.com
NEXT_PUBLIC_CONTACT_EMAIL=contato@example.com
```

**Como gerar JWT_SECRET:**
```bash
openssl rand -base64 32
```

**Para desenvolvimento local:**
```
JWT_SECRET=your_super_secret_jwt_key
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

> **Nota:** Veja `.env.local.example` para todas as variáveis disponíveis e suas descrições.

### Database Setup

This project uses SQLite as its database. To set up the database schema and create the necessary tables, including a default "guest" user for free API key generation, run the following command:

```bash
node scripts/setup.js
```

### Creating an Admin User

To create an admin user, run the following command and follow the prompts:

```bash
node scripts/create-admin.js
```

### Running the Development Server

Once you have installed the dependencies, set up the environment variables, and created an admin user, you can run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## API Usage

### Free API Key Generation

To get a free API key for the Developer plan, go to the **Pricing** page and click the "Get Started" button. The API key will be displayed on the page.

### Public Download Endpoint

- **Endpoint:** `/api/public-download`
- **Method:** `GET`
- **Query Parameter:** `url` (the URL of the media to download)

**Example:**

```
GET ${NEXT_PUBLIC_API_BASE_URL}/api/public-download?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

This will return a JSON object with the video title and a list of available formats with their download links.

## 🎨 Design Moderno

A interface foi completamente modernizada com:
- **Fonte Inter:** Tipografia moderna e legível
- **Gradientes:** Cores vibrantes (violet → sky)
- **Animações:** Transições suaves e efeitos hover
- **Cards Interativos:** Design moderno com sombras e bordas arredondadas
- **Responsivo:** Funciona perfeitamente em todos os dispositivos

## 🔧 Tecnologias

- **Next.js 16** com React 19
- **TypeScript** para type safety
- **Tailwind CSS 4** para estilização
- **yt-dlp** e **ytdl-core** para download de mídia
- **SQLite** para banco de dados
- **JWT** para autenticação

## 📚 Documentação

Para mais detalhes sobre a arquitetura, funcionalidades e mudanças recentes, consulte o arquivo [Context.md](./Context.md).

## 🚀 Deploy

Após fazer o build, você pode iniciar o servidor de produção:

```bash
npm run build
npm start
```

### Troubleshooting

Se o build ou dev não funcionarem:

```bash
# Limpar cache do Next.js
npm run clean

# Se ainda houver problemas, matar processos do Next.js
pkill -f "next" || true

# Limpar tudo (incluindo node_modules)
npm run clean:all
npm install
```

## 📝 Notas

- A API usa `yt-dlp` como método principal e `ytdl-core` como fallback para YouTube
- User agents específicos são configurados por plataforma para melhor compatibilidade
- O sistema possui fallback automático caso uma biblioteca falhe
- **Dashboard de Usuário:** Usuários regulares podem fazer login em `/login` e serão redirecionados para `/dashboard` onde podem gerenciar suas próprias API keys e ver métricas pessoais
- **Tratamento de Erros:** O sistema tenta automaticamente múltiplos formatos quando um formato específico não está disponível:
  - **YouTube/YouTube Shorts:** Tenta ytdl-core primeiro, depois múltiplos formatos do yt-dlp (bestvideo+bestaudio, best[height<=1080], etc.)
  - **Instagram:** Sempre tenta 13 formatos alternativos quando houver qualquer erro (best, bestvideo+bestaudio, best[ext=mp4], bestvideo[height<=1080], etc.)
- **Sistema de Notificações:** 
  - Admin pode criar notificações em `/admin/notifications`
  - Notificações podem ser para todos os usuários ou para um usuário específico
  - Aparecem no dropdown de notificações tanto no admin quanto no dashboard de usuário
  - Auto-refresh a cada 30 segundos
- **Gerenciamento de Usuários:**
  - Admin pode criar usuários em `/admin/users`
  - Credenciais são exibidas após criação
  - Usuários podem fazer login imediatamente
- **Gerenciamento de API Keys:**
  - Admin pode criar API keys para qualquer usuário em `/admin/api-keys`
  - Tabela mostra informações completas incluindo usuário proprietário
- **Tratamento Robusto de Erros:**
  - Sistema de fallback inteligente para Instagram e YouTube
  - **YouTube:** Qualquer erro dispara fallback completo (ytdl-core + múltiplos formatos yt-dlp)
    - Aguarda primeiro chunk de dados ou erro antes de retornar resposta (timeout 2s)
    - **Verificação em todos os fallbacks:** Cada formato alternativo também é verificado antes de retornar
    - Detecta erros que ocorrem durante o stream, não apenas na criação
  - **Instagram:** Qualquer erro dispara fallback completo (13 formatos alternativos)
    - **Verificação em todos os fallbacks:** Cada formato alternativo também é verificado antes de retornar
  - Múltiplos formatos tentados automaticamente quando um formato não está disponível
  - Logs detalhados e estruturados para debugging (inclui provider, message, cause, stderr)
  - Validação de formatos antes de retornar resultados
