# MediaGrab API

> Plataforma completa para download de mídia multi-plataforma (YouTube, Instagram, TikTok, X/Twitter, Vimeo, Facebook, Dailymotion, SoundCloud) com painel administrativo, painel de usuário e documentação interativa.

## 📚 Índice

1. [Visão Geral](#visão-geral)
2. [Principais Recursos](#principais-recursos)
3. [Arquitetura](#arquitetura)
4. [Pré-requisitos](#pré-requisitos)
5. [Instalação Passo a Passo](#instalação-passo-a-passo)
6. [Configuração de Cookies (Instagram & YouTube)](#configuração-de-cookies-instagram--youtube)
7. [Executando o Projeto](#executando-o-projeto)
8. [Painéis (Admin & Usuário)](#painéis-admin--usuário)
9. [Referência da API](#referência-da-api)
10. [Estrutura do Projeto](#estrutura-do-projeto)
11. [Fluxo de Desenvolvimento](#fluxo-de-desenvolvimento)
12. [Diagnóstico e Boas Práticas](#diagnóstico-e-boas-práticas)
13. [Contribuição](#contribuição)
14. [Licença](#licença)

---

## Visão Geral

A MediaGrab foi concebida para equipes que precisam integrar downloads de mídia em aplicações ou fluxos internos. A plataforma combina uma API em Next.js 16, interfaces modernas (landing page, documentação e dashboards) e automações com `yt-dlp`/`ytdl-core`, tudo preparado para execução local ou em produção.

---

## Principais Recursos

- **API multi-plataforma**: suporte a YouTube (vídeos e Shorts), Instagram (reels/posts), TikTok, X/Twitter, Vimeo, Facebook, Dailymotion e SoundCloud.
- **UX moderna**: landing page animada, modal de download com filtros e documentação interativa com exemplos práticos.
- **Autenticação e gestão**: painéis separados para administradores e usuários finais, criação de API Keys, métricas em tempo real, notificações internas e controle de limites.
- **Fallbacks inteligentes**: tratamento automático para formatos indisponíveis, cookies opcionais para conteúdos que exigem login e limpeza de arquivos temporários.
- **Configuração declarativa**: `.env.local` documentado, arquivos de configuração centralizados em `src/config/app.config.ts` e scripts de automação para banco de dados.
- **Experiência pronta para DevOps**: scripts `npm run build`, `npm run dev`, documentação de troubleshooting e arquivos `.gitignore` alinhados (cookies e artefatos temporários estão fora do versionamento).

---

## Arquitetura

```
Next.js 16 (App Router, Turbopack)
├─ API Routes (/api/**)
│  ├─ download (yt-dlp + cookies opcionais)
│  ├─ download-direct (streaming ou arquivo mp4 temp)
│  ├─ admin/** (usuários, chaves, notificações)
│  └─ dashboard/** (dados do usuário final)
├─ UI (React 19 + Tailwind 4)
│  ├─ Landing page (modal de formatos, cards interativos)
│  ├─ Docs page (Quick Start, referência e exemplos de respostas)
│  └─ Painéis (admin + usuário)
├─ `src/lib/server/mediaResolver.ts`
│  └─ Resolve metadados e formatos usando yt-dlp/ytdl-core
└─ SQLite (via `src/lib/database.ts`)
   ├─ Tabelas: usuários, api_keys, notifications, download_logs
   └─ Scripts: `npm run create-admin`, `node scripts/setup.js`
```

---

## Pré-requisitos

- **Node.js** ≥ 20.x (desenvolvimento em `v25.1.0`)
- **npm** ≥ 10.x
- **Python 3.9+** + `yt-dlp` e `ffmpeg` instalados no PATH (yt-dlp é empacotado via `yt-dlp-wrap`, mas dependências do sistema são necessárias)
- **SQLite** (instalado por padrão em macOS/Linux)
- (Opcional) Acesso autenticado aos serviços suportados para cookies (Instagram/YouTube)

---

## Instalação Passo a Passo

### 1. Clonar o repositório
```bash
git clone https://github.com/fefogaca/mediagrab.git
cd mediagrab
```

### 2. Instalar dependências Node
```bash
npm install
```

### 3. Criar arquivo `.env.local`
Crie o arquivo na raiz do projeto com o conteúdo mínimo:
```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
JWT_SECRET=defina_um_segredo_forte_aqui
INSTAGRAM_APP_ID=936619743392459
INSTAGRAM_COOKIES_PATH=private/instagram_cookies.txt
YOUTUBE_COOKIES_PATH=private/youtube_cookies.txt
```
> 🔐 **Por que manter `JWT_SECRET`?** Ele assina/valida os tokens emitidos no login. Mesmo ambientes de desenvolvimento devem ter um valor definido para garantir compatibilidade com o fluxo de autenticação.

### 4. Configurar banco de dados
```bash
node scripts/setup.js        # cria/atualiza a base SQLite
npm run create-admin         # guia interativo para criar o primeiro usuário admin
```

---

## Configuração de Cookies (Instagram & YouTube)

Alguns vídeos exigem autenticação. Para replicar o comportamento do CLI (`yt-dlp --cookies`):

1. Use uma extensão do navegador (ex.: “Get cookies.txt”) para exportar cookies em formato Netscape.
2. Salve os arquivos em `private/instagram_cookies.txt` e `private/youtube_cookies.txt` (nomes padrão ignorados pelo Git).
3. Ajuste se preferir caminhos personalizados:
   ```dotenv
   INSTAGRAM_COOKIES_PATH=private/meus_cookies_instagram.txt
   YOUTUBE_COOKIES_PATH=private/meus_cookies_youtube.txt
   ```
4. Reinicie o servidor (`npm run dev`) para recarregar as variáveis.

Durante as requisições, a API registrará logs indicando se os cookies foram encontrados (`YouTube: usando cookies em ...`).

---

## Executando o Projeto

### Desenvolvimento
```bash
npm run dev
# Local: http://localhost:3000
```

### Build de produção (validação)
```bash
npm run build
npm start
```

> Se aparecer `Unable to acquire lock`, finalize instâncias antigas: `pkill -f "next dev"`.

---

## Painéis (Admin & Usuário)

- **Admin (`/login` → `/admin`)**
  - Gerenciar usuários (criação, edição, senha temporária)
  - Criar/rotacionar API Keys para qualquer usuário
  - Painel de métricas gerais (total de downloads, maiores consumidores)
  - Sistema de notificações: enviar alertas para todos ou usuários específicos

- **Usuário (`/login` → `/dashboard`)**
  - Visualizar métricas pessoais (downloads por período, top formatos)
  - Criar/revogar as próprias API Keys
  - Receber notificações enviadas pelo admin

Ambos os painéis usam o mesmo backend (`/api/admin/**` e `/api/dashboard/**`) com checagens de role.

---

## Referência da API

### Endpoint principal: `GET /api/download`

#### Requisição
```
GET /api/download?url=<URL_DO_VIDEO>&apikey=<SUA_API_KEY>
```

#### Resposta (200)
```json
{
  "title": "Example Video Title",
  "requested_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "provider": {
    "id": "youtube",
    "label": "YouTube"
  },
  "library": "yt-dlp",
  "formats": [
    {
      "format_id": "313",
      "ext": "mp4",
      "resolution": "3840x2160",
      "quality": "4K",
      "vcodec": "av01.0.13M.10",
      "acodec": "none",
      "filesize_approx": 157383383,
      "source": "yt-dlp",
      "download_url": "https://api.seudominio.com/api/download-direct?url=...&format=313&source=yt-dlp"
    },
    {
      "format_id": "140",
      "ext": "m4a",
      "resolution": "Audio Only",
      "quality": "High",
      "vcodec": "none",
      "acodec": "mp4a.40.2",
      "filesize_approx": 3094343,
      "source": "yt-dlp",
      "download_url": "https://api.seudominio.com/api/download-direct?url=...&format=140&source=yt-dlp"
    }
  ]
}
```

#### Fluxo com API Key
1. Gere a chave no painel.
2. Envie em todas as requisições (`apikey=<SUA_KEY>`).
3. Trate erros comuns (401 `INVALID_API_KEY`, 429 `USAGE_LIMIT_EXCEEDED`, etc.).

### Endpoint de download direto: `GET /api/download-direct`
- Usado internamente pelos links em `download_url`.
- Para Instagram/YouTube, se necessário, baixa o arquivo para `/tmp` e responde o `.mp4` final com cabeçalhos `Content-Length`.

> Consulte `/docs` na aplicação para uma documentação interativa com exemplos copy&paste.

---

## Estrutura do Projeto

```
src/
├─ app/
│  ├─ page.tsx                 # Landing page + modal de download
│  ├─ docs/page.tsx            # Documentação interativa
│  ├─ pricing/, contact/, ...  # Páginas estáticas com StandardLayout
│  ├─ admin/, dashboard/       # Painéis com componentes próprios
│  └─ api/                     # Rotas HTTP (App Router)
├─ config/app.config.ts        # Configurações centralizadas (URLs, features)
├─ lib/
│  ├─ server/mediaResolver.ts  # Resolve metadados, usa yt-dlp/ytdl-core
│  ├─ database.ts              # Conexão SQLite e migrações básicas
│  └─ media/providers.ts       # Lista de provedores suportados
└─ app/components              # Layouts reutilizáveis (StandardLayout, ThemeProvider)
```

---

## Fluxo de Desenvolvimento

| Comando | Descrição |
|--------|-----------|
| `npm run dev` | Inicia o servidor Next.js com Turbopack |
| `npm run build` | Gera build otimizando API e páginas |
| `npm start` | Sobe o servidor em modo produção |
| `npm run create-admin` | CLI para criação de usuário admin |
| `node scripts/setup.js` | Cria/atualiza schema SQLite |

Depois de alterações nas rotas ou scripts que dependem de cookies, reinicie o servidor para carregar as novas variáveis.

---

## Diagnóstico e Boas Práticas

- **`FORMAT_NOT_AVAILABLE` no download**: o CLI `yt-dlp` com o mesmo URL é o melhor teste A/B. Se funcionar apenas com cookies, garanta que o arquivo Netscape está acessível e o caminho em `.env.local` é válido.
- **`Unable to acquire lock`** ao reiniciar `next dev`: finalize os processos antigos (`pkill -f "next dev"`).
- **Build falhando com erros de permissão**: remover diretórios externos (`rm -rf path/to/venv`) antes do `npm run build`.
- **Rotas respondendo 502**: veja os logs da API. Informações completas (`stderr` do yt-dlp) são emitidas no console.
- **Segurança**: nunca versionar cookies ou `.env.local`. O `.gitignore` já cobre `private/instagram_cookies.txt` e `private/youtube_cookies.txt`.

---

## Contribuição

Pull requests são bem-vindos! Antes de abrir uma PR:

1. Faça fork e crie uma branch (`git checkout -b feature/minha-feature`).
2. Certifique-se de rodar `npm run build` e testar os fluxos críticos.
3. Atualize documentação se alterar contratos da API ou variáveis.
4. Abra a PR descrevendo o cenário (passos de reprodução e screenshots, se aplicável).

---

## Licença

Este projeto está licenciado sob a [LICENÇA GPL-2.0](LICENSE). Consulte o arquivo para detalhes.

---

> Suporte e contato: [felipefogaca.net](https://felipefogaca.net)
