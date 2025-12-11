<div align="center">
  <img src="public/images/logo-longEscrito.png" alt="MediaGrab Logo" width="300" />
  
  <p><strong>The Ultimate Media Downloading API</strong></p>
  
  [![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
  [![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)
</div>

---

## Table of Contents

<details>
<summary>Click to expand</summary>

- [About](#about)
- [Features](#features)
- [Quick Start](#quick-start)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [First Access](#first-access)
- [Development](#development)
  - [Pre-Requisites](#pre-requisites)
  - [Environment Setup](#environment-setup)
  - [File Structure](#file-structure)
  - [Database Setup](#database-setup)
  - [Build & Deploy](#build--deploy)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [FAQ](#faq)
- [Resources](#resources)
- [License](#license)

</details>

---

## About

**MediaGrab** is a powerful and comprehensive API for downloading media from 1000+ platforms, including YouTube, Instagram, TikTok, Twitter, and many more. Built with Next.js 16, TypeScript, Supabase/PostgreSQL, and Prisma, it provides a robust and scalable solution for integrating media downloads into any application.

### Key Highlights

- **Multi-Platform Downloads** - Support for 1000+ media sites
- **Fallback System** - 4 different providers for maximum availability
- **Complete Authentication** - JWT and NextAuth with OAuth support
- **Admin Dashboard** - Complete administration panel
- **User Management** - Full user and permission management
- **API Keys** - Per-user API key system
- **Payments** - Stripe integration for subscriptions
- **Email** - SendGrid integration
- **i18n** - Portuguese and English support

---

## Features

<details>
<summary><b>Click to see all features</b></summary>

### Core Features

- **Media Download** - Support for 1000+ platforms (YouTube, Instagram, TikTok, Twitter, etc.)
- **Fallback System** - 4 providers (yt-dlp, @distube/ytdl-core, ytdl-core, play-dl) for maximum availability
- **RESTful API** - Complete API for integration in any project
- **User System** - Complete authentication with JWT and NextAuth
- **API Keys** - Per-user API key management
- **Admin Dashboard** - Complete panel to manage the platform
- **User Dashboard** - Panel for users to manage their API Keys
- **Internationalization** - Portuguese and English support

### Optional Integrations

- **Payments** - Stripe integration for subscriptions
- **Emails** - SendGrid integration
- **OAuth** - Login with Google and GitHub
- **Modern Database** - Supabase/PostgreSQL with Prisma ORM
- **Centralized Configuration** - Admin panel to manage settings

</details>

---

## Quick Start

### Installation

<details>
<summary><b>Step-by-step installation guide</b></summary>

#### Prerequisites

- **Node.js** 20.0.0 or higher
- **npm** 10.0.0 or higher
- **Supabase** - Free account and project ([create free account](https://supabase.com))
- **yt-dlp** - Installed on system ([installation instructions](https://github.com/yt-dlp/yt-dlp#installation))

#### Installation Steps

1. **Clone the repository**
```bash
git clone https://github.com/fefogaca/mediagrab.git
cd mediagrab
```

2. **Install dependencies**
```bash
npm install --legacy-peer-deps
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

4. **Configure database**
   - Create a project on Supabase
   - Copy the `DATABASE_URL` from the project
   - Paste it in the `.env` file

5. **Run Prisma migrations**
```bash
npx prisma migrate dev
```

6. **Start development server**
```bash
npm run dev
```

Visit: **http://localhost:3000**

</details>

### Configuration

<details>
<summary><b>Environment variables and settings</b></summary>

#### Required Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Database - Supabase/PostgreSQL
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# NextAuth
NEXTAUTH_URL=http://localhost:3000
```

> **Note:** `JWT_SECRET` and `NEXTAUTH_SECRET` are automatically generated if they don't exist in `.env`. They will be automatically saved to the `.env` file on first run.

#### Optional Variables (Integrations)

These variables can be configured through the admin panel (`/admin/settings`) after first login:

- **Payments - Stripe**: Configured in admin panel
- **Email - SendGrid**: Configured in admin panel
- **OAuth - Google**: Configured in admin panel
- **OAuth - GitHub**: Configured in admin panel

> **Note:** If integrations are not configured, the corresponding buttons will show a message informing that the functionality will be implemented soon.

</details>

### First Access

<details>
<summary><b>How to create the first administrator</b></summary>

On first access to `/login`, a popup will automatically appear to create the first administrator. Simply fill in:

- **Name**
- **Email**
- **Password** (minimum 8 characters)

After creating the admin, log in normally and start using!

</details>

---

## Development

### Pre-Requisites

<details>
<summary><b>Required tools and software</b></summary>

Before starting development, make sure you have installed:

- **Node.js** 20.0.0 or higher
- **npm** 10.0.0 or higher
- **Git** for version control
- **Supabase CLI** (optional, for local development)
- **yt-dlp** installed and available in PATH

</details>

### Environment Setup

<details>
<summary><b>Complete development environment setup</b></summary>

1. **Clone the repository**
```bash
git clone https://github.com/fefogaca/mediagrab.git
cd mediagrab
```

2. **Install dependencies**
```bash
npm install --legacy-peer-deps
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your credentials
```

4. **Configure database**
```bash
# Set DATABASE_URL in .env
# Run migrations
npx prisma migrate dev
```

5. **Start development server**
```bash
npm run dev
```

6. **Create first administrator**
   - Visit http://localhost:3000/login
   - A popup will automatically appear to create the first admin
   - Fill in: Name, Email and Password (minimum 8 characters)

</details>

### File Structure

<details>
<summary><b>Project structure and file organization</b></summary>

```
mediagrab/
├── prisma/
│   ├── schema.prisma          # Database schema (Prisma)
│   └── migrations/            # Database migrations
│
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── admin/             # Administration panel
│   │   │   ├── settings/      # Global settings
│   │   │   ├── users/         # User management
│   │   │   ├── api-keys/      # API Key management
│   │   │   └── ...
│   │   ├── dashboard/         # User panel
│   │   │   ├── settings/      # User settings
│   │   │   └── ...
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # Authentication (login, logout, me)
│   │   │   ├── admin/         # Administrative endpoints
│   │   │   ├── dashboard/     # User endpoints
│   │   │   ├── download/      # Download API
│   │   │   ├── setup/         # Initial setup
│   │   │   └── webhooks/      # Webhooks (Stripe)
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   ├── docs/              # API documentation
│   │   ├── pricing/           # Pricing page
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   │
│   ├── frontend/              # Frontend code
│   │   ├── components/
│   │   │   ├── ui/            # Shadcn UI components
│   │   │   └── shared/        # Shared components
│   │   └── hooks/             # Custom React Hooks
│   │
│   ├── backend/               # Backend code
│   │   ├── models/            # Prisma model wrappers
│   │   │   ├── User.ts        # User model
│   │   │   ├── ApiKey.ts      # API Key model
│   │   │   ├── Settings.ts   # Settings model
│   │   │   └── ...
│   │   ├── services/          # Services (email, payment)
│   │   └── lib/              # Utilities
│   │       ├── database.ts   # Prisma client
│   │       ├── auth.ts        # NextAuth configuration
│   │       └── secrets.ts     # Secret management
│   │
│   └── lib/                   # Shared utilities
│       ├── i18n/              # Internationalization
│       └── media/            # Media utilities
│
├── public/                    # Static assets
│   └── images/                # Images
│
├── .env                       # Environment variables (not committed)
├── .env.example               # Environment variables example
├── .gitignore                 # Git ignored files
├── next.config.mjs            # Next.js configuration
├── package.json               # Project dependencies
├── prisma/schema.prisma       # Prisma schema
├── tailwind.config.ts         # Tailwind configuration
└── tsconfig.json              # TypeScript configuration
```

| File/Directory | Description |
|----------------|-------------|
| `prisma/schema.prisma` | Defines the database schema |
| `src/app/` | Next.js routes and pages (App Router) |
| `src/app/api/` | REST API endpoints |
| `src/backend/models/` | Prisma model wrappers |
| `src/backend/lib/database.ts` | Configured Prisma client |
| `src/middleware.ts` | Authentication and routing middleware |
| `.env` | Environment variables (create manually) |

</details>

### Database Setup

<details>
<summary><b>Supabase and Prisma configuration</b></summary>

The project uses **Supabase** (PostgreSQL) with **Prisma ORM**.

#### 1. Create Supabase Project

1. Visit [supabase.com](https://supabase.com)
2. Create a free account
3. Create a new project
4. Copy the `DATABASE_URL` from the project

#### 2. Configure in Project

1. Add `DATABASE_URL` to `.env` file:
```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
```

2. Run migrations:
```bash
npx prisma migrate dev
```

3. (Optional) Open Prisma Studio to view data:
```bash
npx prisma studio
```

#### Main Models

- **User** - System users
- **ApiKey** - User API keys
- **Settings** - Global application settings
- **Payment** - Payment history
- **DownloadLog** - Download logs
- **Notification** - System notifications

</details>

### Build & Deploy

<details>
<summary><b>Build and deployment instructions</b></summary>

#### Build

To compile the project for production:

```bash
# Production build
npm run build

# Start production server
npm run start
```

The build generates optimized files in the `.next/` folder.

#### Deployment

##### Vercel (Recommended)

1. Connect your repository to Vercel
2. Configure environment variables:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_APP_URL`
   - `NEXTAUTH_URL`
3. Automatic deployment on every push

##### Other Platforms

The project can be deployed on any platform that supports Next.js:
- **Netlify**
- **Railway**
- **DigitalOcean**
- **AWS**
- **Google Cloud**

</details>

---

## API Documentation

<details>
<summary><b>Complete API reference</b></summary>

### Authentication

All API requests must include an API Key in the header:

```bash
curl -X GET "http://localhost:3000/api/download?url=VIDEO_URL" \
  -H "X-API-Key: sua-api-key"
```

### Main Endpoints

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| GET | `/api/download?url={url}` | Gets video information and formats | API Key |
| GET | `/api/download-direct?url={url}&format={format}` | Direct download | API Key |
| GET | `/api/public-download?url={url}` | Public download (for testing) | None |
| POST | `/api/auth/login` | User login | None |
| GET | `/api/auth/me` | Current user data | Cookie |
| GET | `/api/dashboard/my-api-keys` | List user API Keys | Cookie |
| POST | `/api/dashboard/my-api-keys` | Create new API Key | Cookie |

### Example Response

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

</details>

---

## Architecture

<details>
<summary><b>System architecture and fallback system</b></summary>

### Fallback System

MediaGrab uses a robust fallback system with 4 providers:

| Provider | Platforms | Priority |
|----------|-----------|----------|
| **yt-dlp** | 1000+ sites | Primary |
| **@distube/ytdl-core** | YouTube | Fallback 1 |
| **ytdl-core** | YouTube | Fallback 2 |
| **play-dl** | YouTube, SoundCloud | Fallback 3 |

If one provider fails, the system automatically tries the next. This ensures:
- If YouTube changes something, another provider can work
- Independent updates for each library
- Detailed logs of which provider was used
- Always consistent JSON response format

### Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js, JWT
- **Payments**: Stripe
- **Email**: SendGrid
- **OAuth**: Google, GitHub

</details>

---

## Contributing

<details>
<summary><b>How to contribute to the project</b></summary>

Your contributions are always welcome and appreciated! Here are ways to contribute:

1. **Report a bug** <br>
   If you found a bug, report it [here](https://github.com/fefogaca/mediagrab/issues) and we'll take care of it.

2. **Request a feature** <br>
   You can also request a feature [here](https://github.com/fefogaca/mediagrab/issues), and if viable, it will be developed.

3. **Create a pull request** <br>
   Your contribution will be appreciated by the community. You can start by picking any open issue [here](https://github.com/fefogaca/mediagrab/issues) and create a pull request.

> If you're new to open-source, make sure to read more about it [here](https://www.digitalocean.com/community/tutorial_series/an-introduction-to-open-source) and learn more about creating pull requests [here](https://www.digitalocean.com/community/tutorials/how-to-create-a-pull-request-on-github).

### Branches

We use an agile continuous integration methodology:

1. **`main`** is the production branch
2. **`develop`** is the development branch
3. No other permanent branches should be created in the main repository

**Steps to work with feature branch**

1. To start working on a new feature, create a new branch prefixed with `feat/` followed by the feature name (e.g., `feat/new-feature`)
2. When you finish your changes, you can create a PR

**Steps to create a pull request**

1. Make a PR to the `develop` branch
2. Comply with best practices and guidelines
3. Must pass all continuous integration checks and receive positive reviews

After that, changes will be merged.

### Guidelines

- Use TypeScript for all code
- Follow the configured ESLint standards
- Write descriptive commits
- Add tests when possible
- Document significant changes
- Keep code clean and readable

</details>

---

## FAQ

<details>
<summary><b>Frequently asked questions</b></summary>

**Q: Do I need to configure all integrations (Stripe, SendGrid, OAuth)?**  
A: No! These are optional. You can configure them through the admin panel (`/admin/settings`) when needed.

**Q: How do I create the first administrator?**  
A: On first access to `/login`, a popup will automatically appear to create the first admin.

**Q: Does the project work without Supabase?**  
A: No, the project requires Supabase/PostgreSQL. You can create a free account at [supabase.com](https://supabase.com).

**Q: Can I use another database?**  
A: The project is configured for PostgreSQL. To use another database, you would need to adapt the Prisma schema.

**Q: How do I generate an API Key?**  
A: After logging in, go to `/dashboard` and click "New API Key" in the API Keys panel.

**Q: What happens if a download provider fails?**  
A: The system automatically tries the next provider in the fallback chain, ensuring maximum availability.

**Q: Is there a free plan?**  
A: Yes! The free plan includes 5 requests per month and 1 API key.

</details>

---

## Resources

<details>
<summary><b>Useful resources and documentation</b></summary>

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn UI Components](https://ui.shadcn.com/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Stripe Documentation](https://stripe.com/docs)
- [SendGrid Documentation](https://docs.sendgrid.com/)

</details>

---

## Available Commands

<details>
<summary><b>All npm scripts and commands</b></summary>

```bash
# Development
npm run dev          # Start development server (with Webpack)

# Build & Production
npm run build        # Compile for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint

# Utilities
npm run clean        # Clean Next.js cache (.next and node_modules/.cache)
npm run clean:all    # Clean everything including node_modules

# Database
npx prisma migrate dev    # Run migrations in development
npx prisma generate       # Generate Prisma Client
npx prisma studio         # Open Prisma Studio (database GUI)
```

</details>

---

## Pricing Plans

<details>
<summary><b>Available subscription plans</b></summary>

| Plan | Price | Requests/month | API Keys |
|------|-------|----------------|----------|
| **Free** | $0 | 5 | 1 |
| **Developer** | $10 | 1,000 | 5 |
| **Startup** | $30 | 10,000 | 20 |
| **Enterprise** | $50 | Unlimited | Unlimited |

</details>

---

## Access URLs

| Page | URL |
|------|-----|
| Landing Page | http://localhost:3000 |
| Login | http://localhost:3000/login |
| Register | http://localhost:3000/register |
| Admin Dashboard | http://localhost:3000/admin |
| User Dashboard | http://localhost:3000/dashboard |
| API Documentation | http://localhost:3000/docs |
| Pricing | http://localhost:3000/pricing |

---

## Acknowledgments

<details>
<summary><b>Credits and acknowledgments</b></summary>

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - Download backend
- [Shadcn UI](https://ui.shadcn.com/) - UI components
- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Database
- [Prisma](https://www.prisma.io/) - ORM

</details>

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

---

<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/fefogaca">fefogaca</a></p>
  <p>
    <a href="https://github.com/fefogaca/mediagrab/issues">Report Bug</a>
    ·
    <a href="https://github.com/fefogaca/mediagrab/issues">Request Feature</a>
    ·
    <a href="https://github.com/fefogaca/mediagrab">View on GitHub</a>
  </p>
</div>
