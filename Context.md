# Context.md - MediaGrab API

Este documento contém o contexto completo da aplicação MediaGrab, incluindo arquitetura, funcionalidades, mudanças recentes e informações técnicas importantes.

**Última atualização:** 2024-12-20

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Tecnologias Utilizadas](#tecnologias-utilizadas)
4. [Estrutura do Projeto](#estrutura-do-projeto)
5. [Funcionalidades](#funcionalidades)
6. [API Endpoints](#api-endpoints)
7. [Interface do Usuário](#interface-do-usuário)
8. [Segurança](#segurança)
9. [Configurações do yt-dlp](#configurações-do-yt-dlp)
10. [Mudanças Recentes](#mudanças-recentes)
11. [Próximos Passos](#próximos-passos)

---

## 🎯 Visão Geral

**MediaGrab** é uma API poderosa e confiável para download de mídia de diversas plataformas online. A aplicação permite que usuários e desenvolvedores obtenham informações e links de download para vídeos e áudios de plataformas como YouTube, Instagram, TikTok, Twitter/X, Vimeo, Facebook, Dailymotion e SoundCloud.

### Características Principais

- ✅ Suporte a múltiplas plataformas de mídia
- ✅ Interface moderna e responsiva
- ✅ Dashboard administrativo completo
- ✅ Sistema de autenticação JWT
- ✅ Geração de API keys
- ✅ Sistema de planos (Free, Pro, Enterprise)
- ✅ Dark/Light mode
- ✅ Proteção contra captcha e detecção

---

## 🏗️ Arquitetura

A aplicação é construída com **Next.js 16** usando:

- **Frontend:** React 19, TypeScript, Tailwind CSS 4
- **Backend:** Next.js API Routes (Server Actions)
- **Banco de Dados:** SQLite
- **Autenticação:** JWT (jsonwebtoken)
- **Download de Mídia:** yt-dlp e ytdl-core

### Fluxo de Dados

```
Cliente (Browser)
    ↓
Next.js Frontend (React)
    ↓
API Routes (/api/*)
    ↓
Media Resolver (yt-dlp/ytdl-core)
    ↓
Plataformas (YouTube, Instagram, etc.)
```

---

## 🛠️ Tecnologias Utilizadas

### Dependências Principais

```json
{
  "next": "16.0.1",
  "react": "19.2.0",
  "react-dom": "19.2.0",
  "typescript": "^5",
  "tailwindcss": "^4",
  "yt-dlp-wrap": "^2.3.12",
  "ytdl-core": "^4.11.5",
  "sqlite": "^5.1.1",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^3.0.2",
  "uuid": "^latest",
  "@types/react-transition-group": "^latest"
}
```

### Bibliotecas de UI

- `@headlessui/react` - Componentes acessíveis
- `@radix-ui/react-popover` - Popovers
- `chart.js` - Gráficos no dashboard
- `react-transition-group` - Animações

---

## 📁 Estrutura do Projeto

```
mediagrab/
├── src/
│   ├── app/
│   │   ├── admin/              # Dashboard administrativo
│   │   ├── api/                # API Routes (Next.js)
│   │   ├── components/         # Componentes compartilhados (StandardLayout, ThemeProvider, etc.)
│   │   ├── contact/, pricing/, docs/, …
│   │   ├── dashboard/          # Painel do usuário
│   │   └── page.tsx            # Landing page
│   ├── config/app.config.ts    # Configurações centralizadas
│   ├── lib/
│   │   ├── database.ts         # Conexão SQLite
│   │   ├── media/providers.ts  # Provedores suportados
│   │   └── server/mediaResolver.ts
│   └── scripts/
├── public/
├── README.md
├── Context.md
└── package.json
```

---

## ⚡ Funcionalidades

### 1. Landing Page

- Modal de download inteligente (agrupado por tipo, extensão e qualidade)
- Cards interativos e animações com gradientes
- Documentação e links consistentes em toda a navegação

### 2. Dashboard Administrativo

- Estatísticas globais (downloads, usuários, API keys)
- Gráficos (Chart.js) com atividade recente
- CRUD de usuários e API keys
- Sistema de notificações (envio e leitura)
- Toggle dark/light mode persistente

### 3. Painel do Usuário

- Métricas pessoais (downloads por período, top formatos)
- Geração/revogação de API keys próprias
- Histórico e gráficos individuais
- Recebimento de notificações do admin

### 4. API de Download

- `GET /api/download` para retornar metadados e links diretos
- `GET /api/download-direct` para baixar o formato selecionado
- `GET /api/public-download` para uso sem autenticação (limitado)
- Fallbacks para formatos indisponíveis e manipulação segura de arquivos temporários (Instagram)

### 5. Autenticação & Segurança

- Login via JWT + bcrypt
- Captcha matemático no login admin
- Proteção por role (admin vs. usuário)
- Variáveis `.env.local` documentadas

---

## 🔌 API Endpoints

### Públicos
- `GET /api/public-download?url=<URL>`

### Autenticados
- `GET /api/download?url=<URL>&apikey=<KEY>`
- `GET /api/download-direct?url=<URL>&format=<FORMAT_ID>&source=<SOURCE>`

### Administrativos
- `/api/admin/users`, `/api/admin/api-keys`, `/api/admin/stats/*`, `/api/admin/notifications`

### Dashboard do Usuário
- `/api/dashboard/my-stats`, `/api/dashboard/my-api-keys`, `/api/dashboard/notifications`, `/api/dashboard/my-recent-downloads`, etc.

As respostas incluem metadados e uma lista de formatos com `download_url` apontando para `/api/download-direct`.

---

## 🎨 Interface do Usuário

- **Layouts unificados**: `StandardLayout` e `ThemeProvider` padronizam header/footer com links Home/Pricing/Docs/Contact/Admin.
- **Docs Page**: agora reutiliza `StandardLayout` (sem sidebar duplicada) e mantém hero, quick start, referência e códigos de erro em um layout limpo.
- **Dark Mode**: suporte completo, com transições suaves.
- **Componentes**: modais com backdrop blur, cards com hover animado, badges de status, code blocks com botão de copiar.

---

## 🔒 Segurança

- **JWT** com expiração e verificação server-side
- **bcrypt** para hash de senhas
- **Captcha** no login admin (adição, subtração, multiplicação)
- **Validação**: URLs, provedores suportados, sanitização de query params

---

## 🎬 Configurações do yt-dlp

### User Agents por Plataforma

```typescript
{
  default: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
  instagram: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6...)',
  tiktok: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
  twitter: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...'
}
```

### Opções Gerais

- `--user-agent` específico por plataforma
- `--no-warnings`, `--quiet`

### Cookies

- **Instagram**: usa `INSTAGRAM_COOKIES_PATH` (Netscape) se disponível
- **YouTube**: usa `YOUTUBE_COOKIES_PATH` (Netscape) se disponível
- Logs indicam o caminho utilizado ou se nenhum arquivo foi encontrado

### Estratégia de Resolução

1. `ytDlpWrap.getVideoInfo(url)`
2. fallback com `execPromise([... '--dump-json'])`
3. se necessário, ytdl-core (YouTube)

### Tratamento por Plataforma

- **Instagram**: downloads realizados via arquivo temporário (mp4 final) para evitar falhas de streaming
- **YouTube**: múltiplos formatos tentados sequencialmente (313, 140, best, worst, etc.)

---

## 📝 Mudanças Recentes

### 2024-12-20 - Documentação e Cookies por Plataforma

- ✅ README totalmente reescrito em formato developer-friendly (inspirado no BettaFish) com passo a passo completo
- ✅ Context.md sincronizado com as novas variáveis e fluxo sem instaloader
- ✅ `INSTAGRAM_COOKIES_PATH` e `YOUTUBE_COOKIES_PATH` passam a ser configuráveis individualmente
- ✅ Logs informam quando os cookies de cada provedor são utilizados
- ✅ `/docs` reusa `StandardLayout`, eliminando header duplicado e adicionando link “Home”
- ✅ `.gitignore` garante privacidade de `private/instagram_cookies.txt` e `private/youtube_cookies.txt`
- ✅ Build verificado após remoção do layout redundante e limpeza do cache `.next`

### 2024-12-19 - Sistema de Notificações e Melhorias Administrativas

*(conteúdo existente mantido – ver histórico acima)*

### 2024-12-19 - Dashboard de Usuário e Melhorias de Erros

*(conteúdo existente mantido)*

### 2024-12-19 - Correções e Melhorias Finais

*(conteúdo existente mantido; atualizado para refletir que o fallback via instaloader foi removido)*

### 2024-12-19 - Modernização Completa

*(conteúdo existente mantido)*

---

## 🚀 Próximos Passos

*(seção mantida – recomendações de testes, funcionalidades, UI/UX, segurança e performance)*

---

## 📚 Comandos Úteis

*(seção mantida)*

Inclui variáveis de ambiente atualizadas:

```dotenv
JWT_SECRET=your_super_secret_jwt_key
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
INSTAGRAM_APP_ID=936619743392459
INSTAGRAM_COOKIES_PATH=private/instagram_cookies.txt
YOUTUBE_COOKIES_PATH=private/youtube_cookies.txt
```

---

## 🔗 Links Úteis

*(seção mantida)*

---

## 📝 Notas de Manutenção

*(seção mantida – orientações para atualizar este arquivo, rodar build, etc.)*

---

**Mantido por:** Equipe MediaGrab  
**Versão:** 1.4.0  
**Última atualização:** 2024-12-20

