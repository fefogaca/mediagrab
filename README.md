<div align="center">
  <img src="public/images/logo-longEscrito.png" alt="MediaGrab Logo" width="300" />
  
  <p><strong>The Ultimate Media Downloading API</strong></p>
  
  [![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-7-green?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
  [![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
</div>

---

## ✨ Features

- 🎥 **Download de Mídia** - Suporte para 1000+ plataformas (YouTube, Instagram, TikTok, Twitter, etc.)
- 🔄 **Sistema de Fallback** - 4 providers (yt-dlp, @distube/ytdl-core, ytdl-core, play-dl) para máxima disponibilidade
- 🌐 **API RESTful** - API completa para integração em qualquer projeto
- 👤 **Sistema de Usuários** - Autenticação completa com JWT
- 🔑 **API Keys** - Gerenciamento de chaves de API por usuário
- 📊 **Dashboard Admin** - Painel completo para gerenciar a plataforma
- 📱 **Dashboard Usuário** - Painel para usuários gerenciarem suas API Keys
- 🌍 **Internacionalização** - Suporte para Português e Inglês
- 💳 **Pagamentos** (Opcional) - Integração com AbacatePay (PIX) e Stripe
- 📧 **Emails** (Opcional) - Integração com SendGrid
- 🔐 **OAuth** (Opcional) - Login com Google e GitHub

## 🚀 Quick Start

### Pré-requisitos

- Node.js 20+
- MongoDB (local ou [MongoDB Atlas](https://www.mongodb.com/atlas))
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) instalado no sistema

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/mediagrab.git
cd mediagrab

# Instale as dependências
npm install

# Copie o arquivo de exemplo de variáveis de ambiente
cp .env.example .env.local

# Edite o .env.local com suas credenciais
# (veja seção "Configuração" abaixo)

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse: http://localhost:3000

### 🎉 Primeiro Acesso

Na primeira execução, ao acessar a página de login, um popup aparecerá automaticamente para você criar o primeiro administrador. Basta preencher:
- Nome
- Email
- Senha (mínimo 8 caracteres)

Após criar o admin, faça login normalmente e comece a usar!

## ⚙️ Configuração

### Variáveis de Ambiente Obrigatórias

```env
# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mediagrab

# Autenticação
JWT_SECRET=sua-chave-secreta-de-32-caracteres
NEXTAUTH_SECRET=sua-chave-nextauth
NEXTAUTH_URL=http://localhost:3000

# URL da aplicação
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Variáveis Opcionais (Integrações)

```env
# Pagamentos - AbacatePay (PIX para brasileiros)
ABACATEPAY_API_KEY=sua-api-key

# Pagamentos - Stripe (Internacional)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Email - SendGrid
SENDGRID_API_KEY=sua-api-key
SENDGRID_FROM_EMAIL=noreply@seudominio.com

# OAuth - Google
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# OAuth - GitHub
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
```

> **Nota:** Se as integrações não estiverem configuradas, os botões correspondentes mostrarão uma mensagem informando que a funcionalidade será implementada em breve.

## 📁 Estrutura do Projeto

```
mediagrab/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/              # Painel de administração
│   │   ├── dashboard/          # Painel do usuário
│   │   ├── api/                # API Routes
│   │   │   ├── auth/           # Autenticação
│   │   │   ├── admin/          # Endpoints admin
│   │   │   ├── dashboard/      # Endpoints usuário
│   │   │   ├── download/       # API de download
│   │   │   ├── setup/          # Setup inicial
│   │   │   └── webhooks/       # Webhooks
│   │   └── ...                 # Páginas públicas
│   │
│   ├── frontend/               # Código do frontend
│   │   ├── components/
│   │   │   ├── ui/             # Componentes Shadcn UI
│   │   │   └── shared/         # Componentes compartilhados
│   │   └── hooks/
│   │
│   ├── backend/                # Código do backend
│   │   ├── models/             # Mongoose models
│   │   ├── services/           # Serviços (email, pagamento)
│   │   └── lib/                # Utilitários
│   │
│   └── lib/                    # Utilitários compartilhados
│       └── i18n/               # Internacionalização
│
├── public/                     # Assets estáticos
└── private/                    # Arquivos sensíveis (cookies)
```

## 🔄 Sistema de Fallback

O MediaGrab utiliza um sistema robusto de fallback com 4 providers para garantir máxima disponibilidade:

| Provider | Plataformas | Prioridade |
|----------|-------------|------------|
| **yt-dlp** | 1000+ sites | Primário |
| **@distube/ytdl-core** | YouTube | Fallback 1 |
| **ytdl-core** | YouTube | Fallback 2 |
| **play-dl** | YouTube, SoundCloud | Fallback 3 |

Se um provider falhar, o sistema automaticamente tenta o próximo. Isso garante que:
- ✅ Se o YouTube mudar algo, outro provider pode funcionar
- ✅ Atualizações independentes de cada biblioteca
- ✅ Logs detalhados de qual provider foi usado
- ✅ Formato de resposta JSON sempre consistente

## 🔌 API

### Autenticação

Todas as requisições à API devem incluir uma API Key no header:

```bash
curl -X GET "http://localhost:3000/api/download?url=VIDEO_URL" \
  -H "X-API-Key: sua-api-key"
```

### Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/download?url={url}` | Obtém informações e formatos do vídeo |
| GET | `/api/download-direct?url={url}&format={format}` | Download direto |
| GET | `/api/public-download?url={url}` | Download público (para testes) |

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

## 👤 Primeiro Acesso

Ao acessar `/login` pela primeira vez (sem nenhum admin no banco), um popup de setup aparecerá automaticamente para você criar suas credenciais de administrador.

> **Nota:** Todo o setup é feito automaticamente pelo sistema - sem necessidade de scripts!

## 💳 Planos

| Plano | Preço | Requests/mês | API Keys |
|-------|-------|--------------|----------|
| Free | R$ 0 | 5 | 1 |
| Developer | R$ 10 | 1.000 | 5 |
| Startup | R$ 30 | 10.000 | 20 |
| Enterprise | R$ 50 | Ilimitado | Ilimitado |

## 🌐 URLs de Acesso

| Página | URL |
|--------|-----|
| Landing Page | http://localhost:3000 |
| Login | http://localhost:3000/login |
| Registro | http://localhost:3000/register |
| Dashboard Admin | http://localhost:3000/admin |
| Dashboard Usuário | http://localhost:3000/dashboard |
| Documentação | http://localhost:3000/docs |
| Preços | http://localhost:3000/pricing |

## 🛠️ Scripts Disponíveis

```bash
npm run dev          # Inicia em modo desenvolvimento
npm run build        # Compila para produção
npm run start        # Inicia em modo produção
npm run lint         # Executa linter
npm run clean        # Limpa cache do Next.js
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🙏 Agradecimentos

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - Backend de download
- [Shadcn UI](https://ui.shadcn.com/) - Componentes UI
- [Next.js](https://nextjs.org/) - Framework React
- [MongoDB](https://www.mongodb.com/) - Banco de dados

---

<div align="center">
  <p>Feito com ❤️ por <a href="https://github.com/fefogaca">fefogaca</a></p>
</div>
