# Context.md - MediaGrab API

Este documento contém o contexto completo da aplicação MediaGrab, incluindo arquitetura, funcionalidades, mudanças recentes e informações técnicas importantes.

**Última atualização:** 2024-12-19

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
│   │   │   ├── components/    # Componentes do admin
│   │   │   ├── partials/      # Partials (Header, Sidebar, etc.)
│   │   │   ├── charts/        # Componentes de gráficos
│   │   │   ├── css/           # Estilos do admin
│   │   │   └── users/         # Página de usuários
│   │   ├── api/               # API Routes
│   │   │   ├── admin/         # Rotas administrativas
│   │   │   ├── auth/          # Autenticação
│   │   │   ├── download/      # Download de mídia
│   │   │   └── public-download/ # Download público
│   │   ├── components/        # Componentes compartilhados
│   │   ├── contact/           # Página de contato
│   │   ├── docs/              # Documentação
│   │   ├── login/             # Página de login
│   │   ├── pricing/           # Página de preços
│   │   ├── privacy/           # Política de privacidade
│   │   ├── terms/             # Termos de serviço
│   │   ├── page.tsx           # Landing page
│   │   └── layout.tsx         # Layout principal
│   ├── lib/
│   │   ├── database.ts        # Configuração do banco
│   │   ├── media/
│   │   │   └── providers.ts   # Provedores de mídia
│   │   ├── server/
│   │   │   └── mediaResolver.ts # Resolução de mídia
│   │   └── utils.ts           # Utilitários
│   └── scripts/               # Scripts de setup
├── public/                    # Arquivos estáticos
├── package.json
├── tsconfig.json
└── Context.md                 # Este arquivo
```

---

## ⚡ Funcionalidades

### 1. Landing Page

- Interface moderna com gradientes e animações
- Campo de input para URLs de mídia
- Exibição de formatos disponíveis com cards interativos
- Animações suaves e transições
- Design responsivo

### 2. Dashboard Administrativo

- **Estatísticas:**
  - Total de downloads
  - Total de usuários
  - Total de API keys
  - Downloads recentes
  - Top usuários
  - Gráficos de uso ao longo do tempo

- **Gerenciamento:**
  - Criação e edição de usuários
  - Gerenciamento de API keys
  - Visualização de estatísticas detalhadas

- **UI:**
  - Toggle dark/light mode funcional
  - Sidebar responsiva
  - Header com busca e notificações

### 3. Sistema de Autenticação

- Login com JWT
- Proteção de rotas administrativas
- Captcha matemático no login (proteção contra bots)
- Hash de senhas com bcrypt

### 4. API de Download

- Endpoint público (`/api/public-download`)
- Endpoint autenticado (`/api/download`)
- Endpoint de download direto (`/api/download-direct`)
- Suporte a múltiplos formatos e resoluções

### 5. Sistema de Planos

- **Developer (Free):** 5 chamadas/mês
- **Pro:** 10,000 chamadas/mês ($10/mês)
- **Enterprise:** Ilimitado (customizado)

---

## 🔌 API Endpoints

### Públicos

#### `GET /api/public-download?url=<URL>`
Retorna informações e links de download para uma URL de mídia.

**Resposta:**
```json
{
  "title": "Título do Vídeo",
  "provider": {
    "id": "youtube",
    "label": "YouTube"
  },
  "formats": [
    {
      "format_id": "313",
      "ext": "mp4",
      "resolution": "3840x2160",
      "quality": "4K",
      "vcodec": "av01.0.13M.10",
      "acodec": "none",
      "filesize_approx": 157383383,
      "download_url": "..."
    }
  ]
}
```

### Autenticados

#### `GET /api/download?url=<URL>&apikey=<API_KEY>`
Versão autenticada do endpoint público.

#### `GET /api/download-direct?url=<URL>&format=<FORMAT_ID>&source=<SOURCE>`
Download direto do arquivo de mídia.

### Administrativos

- `GET /api/admin/users` - Listar usuários
- `POST /api/admin/users` - Criar usuário
- `GET /api/admin/api-keys` - Listar API keys
- `POST /api/admin/api-keys` - Criar API key
- `GET /api/admin/stats/*` - Estatísticas diversas

---

## 🎨 Interface do Usuário

### Design System

**Cores Principais:**
- Violet: `#755ff8` (violet-600)
- Sky: `#67bfff` (sky-600)
- Gradientes: violet-600 → sky-600

**Tipografia:**
- Font: Geist Sans (via Next.js)
- Tamanhos: xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl

**Componentes:**
- Botões com gradientes e hover effects
- Cards com sombras e animações
- Inputs modernos com focus states
- Modais com backdrop blur

### Animações

- `fade-in`: Fade in suave
- `scale-in`: Scale com fade
- `gradient`: Animação de gradiente infinito

### Dark Mode

- Toggle funcional no admin dashboard
- Suporte completo em todas as páginas
- Persistência via localStorage

---

## 🔒 Segurança

### Autenticação

- JWT tokens com expiração
- Senhas hasheadas com bcrypt
- Proteção de rotas administrativas

### Captcha

- Captcha matemático no login
- Operações: adição, subtração, multiplicação
- Regeneração automática em caso de erro

### Validação

- Validação de URLs de mídia
- Verificação de provedores suportados
- Sanitização de inputs

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

- `--user-agent`: User agent específico por plataforma (essencial)
- `--no-warnings`: Suprimir avisos
- `--quiet`: Modo silencioso
- `--no-call-home`: Não enviar dados para servidores externos

### Opções por Plataforma

**YouTube:**
- `--extractor-args youtube:player_client=android,web` (melhora compatibilidade)

**Instagram, TikTok, Twitter/X:**
- Funcionam melhor sem opções extras adicionais
- User agent específico é suficiente

### Estratégia de Resolução

1. **Primeiro:** Tenta `getVideoInfo()` (método padrão, mais confiável)
2. **Fallback:** Se falhar, tenta `execPromise()` com opções customizadas
3. **YouTube:** Se ainda falhar, usa `ytdl-core` como último recurso

### Fallback

- Para YouTube, usa `ytdl-core` como fallback se `yt-dlp` falhar

---

## 📝 Mudanças Recentes

### 2024-12-19 - Reformulação Completa da UI e Sistema de Configuração

#### Sistema de Configuração
- ✅ **Arquivo de Configuração:** Criado `src/config/app.config.ts` com todas as configurações centralizadas
- ✅ **URL da API Configurável:** Adicionada variável `apiBaseUrl` que pode ser configurada via `NEXT_PUBLIC_API_BASE_URL`
- ✅ **Helpers de URL:** Criadas funções `buildApiUrl` e `buildDownloadUrl` para facilitar construção de URLs
- ✅ **Configurações Extensíveis:** Sistema permite adicionar facilmente novas configurações (UI, API, features)

#### Reformulação da Página de Documentação (/docs)
- ✅ **Design Moderno:** Interface completamente redesenhada com gradientes, badges e cards
- ✅ **Documentação Completa:** 
  - Seção Quick Start com passos numerados
  - Referência completa da API com exemplos
  - Tabela de códigos de erro
  - Lista de plataformas suportadas
- ✅ **Melhor UX:** 
  - Code blocks com botão de copiar
  - Badges de status
  - Seção CTA para gerar API key
  - Navegação consistente com o resto do site

#### Modal de Download na Landing Page
- ✅ **Modal Interativo:** Substituída a lista de 100+ formatos por um modal elegante
- ✅ **Agrupamento Inteligente:** Formatos agrupados por tipo (vídeo/áudio), extensão e qualidade
- ✅ **Seleção Simplificada:** 
  - Seleção de tipo (vídeo ou áudio)
  - Cards clicáveis para escolher formato e qualidade
  - Informações resumidas (tamanho, resolução, codec)
- ✅ **Redirecionamento Configurável:** Botão de download redireciona para URL configurável em `app.config.ts`
- ✅ **UX Melhorada:** Evita sobrecarga visual com muitos formatos, mantendo apenas o essencial

#### Seção de Funcionalidades na Landing Page
- ✅ **Cards Interativos:** 6 cards com funcionalidades principais:
  - Ultra Rápido
  - Múltiplas Plataformas
  - Seguro e Confiável
  - Fácil Integração
  - Atualizações Constantes
  - Métricas Detalhadas
- ✅ **Animações:** Hover effects com scale e translate
- ✅ **Design Consistente:** Gradientes e ícones alinhados com o design system

#### Integração da Configuração
- ✅ **Rotas da API Atualizadas:** `src/app/api/download/route.ts` e `src/app/api/public-download/route.ts` agora usam `buildDownloadUrl`
- ✅ **Landing Page:** Usa `appConfig` para URL do desenvolvedor
- ✅ **Consistência:** Todas as URLs de download agora usam a configuração centralizada

### 2024-12-19 - Correção do Build e Scripts de Limpeza

#### Problema Identificado
- ❌ **Build Corrompido:** O comando `npm run build` não executava devido a processos do Next.js em background bloqueando o lock file

#### Solução Implementada
- ✅ **Processos Limpos:** Adicionado comando para matar processos do Next.js que podem estar bloqueando
- ✅ **Scripts de Limpeza:** Criados novos scripts no `package.json`:
  - `npm run clean`: Limpa cache do Next.js (`.next` e `node_modules/.cache`)
  - `npm run clean:all`: Limpa tudo incluindo `node_modules`
- ✅ **Documentação:** Adicionada seção de troubleshooting no README.md e Context.md
- ✅ **Build Funcionando:** Build agora executa corretamente sem travamentos

#### Comandos Adicionados
```bash
npm run clean        # Limpar cache do Next.js
npm run clean:all    # Limpar tudo (incluindo node_modules)
```

### 2024-12-19 - Sistema de Notificações e Melhorias Administrativas

#### Sistema de Notificações
- ✅ **Tabela de Notificações:** Criada tabela `notifications` no banco de dados
- ✅ **Rotas de API:**
  - `/api/admin/notifications` - Listar e criar notificações (admin)
  - `/api/admin/notifications/[id]` - Marcar como lida e deletar
  - `/api/dashboard/notifications` - Listar notificações do usuário
- ✅ **Componente DropdownNotifications:**
  - Atualizado para buscar notificações reais do banco
  - Contador de não lidas
  - Auto-refresh a cada 30 segundos
  - Marca como lida ao clicar
  - Ícones por tipo (info, success, warning, error)
- ✅ **Página de Gerenciamento:** Nova página `/admin/notifications` para criar e gerenciar notificações
- ✅ **Tipos de Notificações:**
  - `all` - Todos os usuários
  - `user` - Usuário específico
- ✅ **Integração:** Notificações aparecem tanto no painel admin quanto no dashboard de usuário

#### Melhorias no Gerenciamento de Usuários
- ✅ **Criação de Usuários Corrigida:** 
  - Melhor tratamento de erros com mensagens detalhadas
  - Exibe credenciais após criação (username, password, role, ID)
  - Usuário pode fazer login imediatamente após criação
- ✅ **Feedback Visual:** Alert com todas as informações necessárias para o admin

#### Melhorias no Gerenciamento de API Keys
- ✅ **Gerenciamento de API Keys de Usuários:**
  - Admin pode criar API keys para qualquer usuário
  - Seleção de usuário no formulário de criação
  - Tabela mostra username e role do usuário
  - Informações completas (usage_count, usage_limit, expires_at)
- ✅ **Interface Melhorada:**
  - Coluna "Usuário" na tabela de API keys
  - Formatação melhorada de datas
  - Visual mais informativo

#### Configurações e Variáveis de Ambiente
- ✅ **.env.local.example:** Criado arquivo de exemplo com todas as variáveis importantes
- ✅ **.gitignore Atualizado:** Melhor organização e mais arquivos ignorados
- ✅ **Variáveis Documentadas:**
  - `JWT_SECRET` - Secret para JWT
  - `NEXT_PUBLIC_API_BASE_URL` - URL base da API
  - `NEXT_PUBLIC_WEB_BASE_URL` - URL base da aplicação web
  - `INSTAGRAM_APP_ID` - App ID utilizado nos cabeçalhos do Instagram (default: `936619743392459`)
  - `INSTAGRAM_COOKIES_PATH` - Caminho para arquivo de cookies do Instagram (formato Netscape) usado pelo yt-dlp
  - `YOUTUBE_COOKIES_PATH` - Caminho para arquivo de cookies do YouTube (formato Netscape) usado pelo yt-dlp
  - Outras variáveis opcionais documentadas

### 2024-12-19 - Dashboard de Usuário e Melhorias de Erros

#### Dashboard de Usuário
- ✅ **Painel de Usuário Criado:** Novo painel em `/dashboard` para usuários regulares (não-admin)
- ✅ **Layout Consistente:** Mesmo layout do admin, mas sem permissões administrativas
- ✅ **Funcionalidades do Usuário:**
  - Visualizar métricas pessoais (total de downloads, API keys ativas)
  - Gerenciar próprias API keys (criar, visualizar, deletar)
  - Ver downloads recentes
  - Gráfico de downloads ao longo do tempo
- ✅ **Rotas de API Criadas:**
  - `/api/dashboard/my-stats` - Estatísticas do usuário
  - `/api/dashboard/my-api-keys` - Listar API keys do usuário
  - `/api/dashboard/api-keys` - Criar API key
  - `/api/dashboard/api-keys/[id]` - Deletar API key
  - `/api/dashboard/my-recent-downloads` - Downloads recentes
  - `/api/dashboard/my-downloads-over-time` - Dados para gráfico
- ✅ **Autenticação:** Login redireciona baseado no role (admin → `/admin`, user → `/dashboard`)
- ✅ **Segurança:** Usuários só podem gerenciar suas próprias API keys e ver suas próprias métricas

#### Melhorias no Tratamento de Erros do YouTube e Instagram
- ✅ **Detecção Melhorada:** Função `isFormatNotAvailableError` que verifica erro em múltiplas camadas (mensagem, cause, stderr)
- ✅ **Fallback Robusto para YouTube:**
  - **Tratamento Especial:** Qualquer erro do YouTube dispara o fallback completo (similar ao Instagram)
  - **Detecção de Erros Durante Stream:** Aguarda o primeiro chunk de dados ou erro antes de retornar resposta (timeout de 2s)
  - **Verificação em Todos os Fallbacks:** Cada formato alternativo também é verificado antes de retornar resposta
  - Tenta ytdl-core primeiro se disponível
  - Se falhar, tenta múltiplos formatos do yt-dlp em sequência:
    - `bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best`
    - `bestvideo+bestaudio/best`
    - `best[height<=1080]`
    - `best[height<=720]`
    - `best[height<=480]`
    - `best`
    - `worst`
  - Logs detalhados para cada tentativa
- ✅ **Fallback Robusto para Instagram:**
  - Sempre tenta múltiplos formatos quando houver qualquer erro
  - **Detecção de Erros Durante Stream:** Cada formato alternativo também é verificado antes de retornar resposta
  - Lista extensa de formatos alternativos (13 formatos diferentes):
    - `best`, `bestvideo+bestaudio/best`, `bestvideo/best`, `bestaudio/best`
    - `worst`, `worstvideo+worstaudio/worst`
    - `best[ext=mp4]`, `best[ext=webm]`
    - `bestvideo[ext=mp4]+bestaudio[ext=m4a]/best`
    - `bestvideo[height<=1080]`, `bestvideo[height<=720]`, `bestvideo[height<=480]`, `bestvideo[height<=360]`
  - **Cookies Opcionais:** Caso `INSTAGRAM_COOKIES_PATH` ou `YOUTUBE_COOKIES_PATH` estejam configuradas, os arquivos (formato Netscape) são enviados ao yt-dlp para requisições autenticadas
  - Tratamento especial: qualquer erro do Instagram dispara o fallback completo
- ✅ **Logs Detalhados:** Cada tentativa de fallback é logada para debugging
- ✅ **Tratamento de Erros:** Erros de formato não disponível são detectados e tratados corretamente
- ✅ **Logging Melhorado:**
  - Logs estruturados com informações do provider (`[instagram]`, `[youtube]`, etc.)
  - Captura de `message`, `cause` e `stderr` para debugging completo
  - Validação de formatos antes de retornar (verifica se há formatos disponíveis)
  - Logs de sucesso quando o fallback funciona
  - Logs de erro detalhados quando ambos os métodos falham

### 2024-12-19 - Correções e Melhorias Finais

#### Correções Críticas
- ✅ **API Corrigida:** Revertido para usar `getVideoInfo` como método principal (mais confiável)
- ✅ **Fallback Inteligente:** Se `getVideoInfo` falhar, tenta com `execPromise` e opções customizadas
- ✅ **Opções Simplificadas:** Removidas opções que causavam problemas, mantendo apenas as essenciais
- ✅ **User Agents:** Mantidos user agents específicos por plataforma

#### UI/UX
- ✅ **Alinhamento do Header:** Corrigido alinhamento vertical dos links de navegação
- ✅ **Fonte Moderna:** Trocada de Geist para Inter (mais moderna e legível)
- ✅ **Dashboard Modernizado:** 
  - Background com gradiente
  - Títulos com gradientes e badges
  - Descrições claras sobre o propósito
- ✅ **Páginas de Gerenciamento:**
  - Users: Interface moderna com cards e botões estilizados
  - API Keys: Design consistente com o resto do admin
  - Loading states e error handling melhorados

#### Build e Testes
- ✅ **Build Funcionando:** Todos os erros de TypeScript corrigidos
- ✅ **Dependências:** uuid e @types/react-transition-group instalados
- ✅ **Type Safety:** Todos os tipos corrigidos

### 2024-12-19 - Modernização Completa (Anterior)

#### UI/UX
- ✅ Landing page completamente redesenhada
  - Gradientes modernos (violet → sky)
  - Animações suaves (fade-in, scale-in)
  - Cards interativos com hover effects
  - Pop-ups modernos com backdrop blur
  
- ✅ Páginas atualizadas
  - Pricing: Cards com animações e badges
  - Contact: Formulário moderno com gradientes
  - Docs: Layout melhorado
  - Terms/Privacy: Design consistente

- ✅ Header e Footer
  - Sticky header com backdrop blur
  - Navegação com underline animado
  - Footer moderno com links organizados

#### Admin Dashboard
- ✅ Toggle dark/light mode corrigido
  - Ícone visível e funcional
  - Transições suaves
  - Persistência no localStorage

#### Segurança
- ✅ Captcha matemático no login
  - Operações: +, -, ×
  - Regeneração automática
  - UI moderna e intuitiva

#### yt-dlp
- ✅ Configurações melhoradas
  - User agents específicos por plataforma
  - Opções para evitar captcha
  - Configurações específicas por provedor
  - Fallback para ytdl-core no YouTube

#### Correções Técnicas
- ✅ Removido `'use server'` de `mediaResolver.ts`
- ✅ Instalado pacote `uuid` e tipos
- ✅ Instalado `@types/react-transition-group`
- ✅ Corrigido componente `ModalSearch`
- ✅ Build funcionando corretamente

---

## 🚀 Próximos Passos

### Melhorias Sugeridas

1. **Testes**
   - Testar os links fornecidos:
     - Instagram: https://www.instagram.com/reel/DQsc_OKjNfU/
     - YouTube: https://www.youtube.com/watch?v=sPUZb7MnMlI
     - YouTube Shorts: https://www.youtube.com/shorts/Ll1UyM8kBNc
     - X/Twitter: https://x.com/katyzhudson/status/1986524015331279275
     - TikTok: https://www.tiktok.com/@ssio/video/7561853960890371350

2. **Funcionalidades**
   - Implementar rate limiting
   - Adicionar cache para requisições frequentes
   - Melhorar tratamento de erros
   - Adicionar logs estruturados

3. **UI/UX**
   - Adicionar mais animações
   - Melhorar feedback visual
   - Adicionar skeleton loaders
   - Implementar toast notifications

4. **Segurança**
   - Adicionar rate limiting por IP
   - Implementar CORS adequado
   - Adicionar validação de rate limits por API key
   - Melhorar sanitização de inputs

5. **Performance**
   - Implementar cache de resultados
   - Otimizar queries do banco
   - Adicionar CDN para assets estáticos
   - Implementar lazy loading

---

## 📚 Comandos Úteis

### Desenvolvimento
```bash
npm run dev          # Iniciar servidor de desenvolvimento
npm run build        # Build de produção
npm start            # Iniciar servidor de produção
npm run lint         # Executar linter
npm run clean        # Limpar cache do Next.js
npm run clean:all    # Limpar tudo (incluindo node_modules)
```

### Troubleshooting

Se o build ou dev não funcionarem:
```bash
# Matar processos do Next.js que podem estar bloqueando
pkill -f "next" || true

# Limpar cache
npm run clean

# Se ainda houver problemas
npm run clean:all
npm install
```

### Setup
```bash
npm run create-admin # Criar usuário administrador
node scripts/setup.js # Configurar banco de dados
```

### Variáveis de Ambiente

Criar `.env.local`:
```
JWT_SECRET=your_super_secret_jwt_key
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
INSTAGRAM_APP_ID=936619743392459
INSTAGRAM_COOKIES_PATH=private/instagram_cookies.txt
YOUTUBE_COOKIES_PATH=private/youtube_cookies.txt
```

---

## 🔗 Links Úteis

- **Documentação Next.js:** https://nextjs.org/docs
- **yt-dlp GitHub:** https://github.com/yt-dlp/yt-dlp
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Referências de Design:**
  - https://www.api.polpharma.com
  - https://app.stableapp.cloud/session/login

---

## 📝 Notas de Manutenção

### Ao fazer mudanças:

1. **Atualizar este arquivo (Context.md)** com as mudanças realizadas
2. **Testar o build:** `npm run build`
3. **Verificar erros de TypeScript**
4. **Testar funcionalidades afetadas**
5. **Atualizar documentação de API se necessário**

### Estrutura de Commits

```
feat: Adicionar nova funcionalidade
fix: Corrigir bug
refactor: Refatorar código
style: Mudanças de estilo/UI
docs: Atualizar documentação
```

---

**Mantido por:** Equipe MediaGrab  
**Versão:** 1.3.0  
**Última atualização:** 2024-12-19 (Sistema de Notificações e Melhorias Administrativas)

