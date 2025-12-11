# MediaGrab API

<div align="center">

![MediaGrab Logo](./public/images/logo-longEscrito.png)

**Modern API for downloading media from multiple platforms**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat-square&logo=supabase)](https://supabase.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)

</div>

MediaGrab is a complete RESTful API for downloading media from multiple platforms, including YouTube, Instagram, TikTok, Twitter, and others. It offers a complete authentication system, API key management, admin panel, Stripe integration for payments, and SendGrid for email delivery.

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

MediaGrab is a complete solution for developers who need to integrate media download functionality into their applications. The API offers:

- **Multi-platform Support**: Download videos, audio, and images from YouTube, Instagram, TikTok, Twitter, and other popular platforms
- **RESTful API**: Well-documented and easy-to-use endpoints
- **Complete Authentication System**: JWT, OAuth (Google, GitHub), and two-factor authentication (2FA)
- **Admin Panel**: Complete interface to manage users, API keys, settings, and statistics
- **User Dashboard**: Personalized area for each user to manage their API keys and downloads
- **API Key Management**: Robust system with usage limits and access control
- **Payment Integration**: Stripe integrated for subscription plans (Developer, Startup, Enterprise) - Configurable via admin panel
- **Email Service**: SendGrid integration for transactional emails - Configurable via admin panel
- **OAuth Integration**: Google and GitHub OAuth login - Configurable via admin panel
- **Modern Database**: PostgreSQL via Supabase with Prisma ORM
- **Docker Ready**: Quick and easy deployment with Docker and Docker Compose
- **Admin Panel Configuration**: All integrations (Stripe, SendGrid, OAuth) can be configured through the admin panel without editing `.env` files

The application is built with Next.js 16, React 19, TypeScript, and uses Supabase as a managed PostgreSQL database.

## Usage

### Installation

#### Prerequisites

- **Node.js** 20.0.0 or higher
- **npm** 10.0.0 or higher
- **Supabase Account** - Create a free account at [supabase.com](https://supabase.com)
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

4. **Configure the database**
   - Create a project on Supabase
   - Copy the `DATABASE_URL` from the project
   - Paste it in the `.env` file

5. **Run Prisma migrations**
```bash
npx prisma migrate dev
```

6. **Start the development server**
```bash
npm run dev
```

Visit: **http://localhost:3000**

> **Note:** `JWT_SECRET` and `NEXTAUTH_SECRET` are automatically generated if they are not defined in `.env`. They will be automatically saved to the `.env` file on first run.

#### Docker Installation

<details>
<summary>Quick installation with Docker</summary>

##### Prerequisites

- **Docker** 20.10+ and **Docker Compose** 2.0+
- **Supabase Account** - Create a free account at [supabase.com](https://supabase.com)

##### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/fefogaca/mediagrab.git
cd mediagrab
```

2. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env and set your DATABASE_URL from Supabase
```

3. **Build and start with Docker Compose**
```bash
docker-compose up -d
```

4. **Check logs**
```bash
docker-compose logs -f
```

5. **Access the application**
Visit: **http://localhost:3000**

The application will automatically:
- Run Prisma migrations
- Generate Prisma Client
- Start the Next.js server
- Health check available at `/api/health`

For detailed Docker documentation, see [DOCKER.md](./DOCKER.md)

</details>

### Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run linter

# Cleanup
npm run clean            # Remove Next.js cache
npm run clean:all        # Remove cache and node_modules

# Installation
npm run install:clean    # Clean dependency installation
npm run install:fast     # Fast installation with npm ci
```

## Development

### Pre-Requisites

Before starting development, make sure you have installed:

- Node.js 20.0.0 or higher
- npm 10.0.0 or higher
- Git
- Supabase account (free)
- yt-dlp installed on system
- Docker and Docker Compose (optional, for containerized development)

### Development Environment

1. **Clone the repository**
```bash
git clone https://github.com/fefogaca/mediagrab.git
cd mediagrab
```

2. **Install dependencies**
```bash
npm install --legacy-peer-deps
```

3. **Configure the environment**
```bash
cp .env.example .env
```

4. **Configure the database**
   - Create a project on Supabase
   - Get the `DATABASE_URL` from the project
   - Add it to the `.env` file

5. **Run migrations**
```bash
npx prisma migrate dev
npx prisma generate
```

6. **Start the development server**
```bash
npm run dev
```

### File Structure

```
mediagrab/
├── prisma/
│   └── schema.prisma              # Prisma database schema
├── public/
│   └── images/                    # Static images
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── api/                    # API routes
│   │   │   ├── admin/             # Administrative endpoints
│   │   │   ├── auth/               # Authentication
│   │   │   ├── dashboard/          # Dashboard endpoints
│   │   │   ├── download/           # Media download
│   │   │   ├── payments/           # Stripe payments
│   │   │   └── webhooks/           # Webhooks
│   │   ├── admin/                  # Admin panel pages
│   │   ├── dashboard/              # User dashboard pages
│   │   ├── login/                  # Login page
│   │   └── layout.tsx              # Main layout
│   ├── backend/
│   │   ├── lib/                    # Utilities
│   │   │   ├── database.ts        # Prisma connection
│   │   │   ├── auth.ts             # NextAuth configuration
│   │   │   ├── secrets.ts          # Secrets management
│   │   │   ├── stripe.ts           # Stripe configuration
│   │   │   ├── sendgrid.ts        # SendGrid configuration
│   │   │   ├── oauth.ts            # OAuth configuration
│   │   │   └── auth-providers.ts   # OAuth providers management
│   │   ├── models/                 # Data models
│   │   │   ├── User.ts             # User model
│   │   │   ├── ApiKey.ts           # API key model
│   │   │   ├── Settings.ts         # Settings model
│   │   │   └── ...
│   │   └── services/               # Business logic
│   │       ├── email.ts             # Email service
│   │       └── media.ts            # Download service
│   └── frontend/
│       └── components/              # React components
│           ├── ui/                  # Base UI components
│           └── ...
├── Dockerfile                       # Docker configuration
├── docker-compose.yml               # Docker Compose
├── docker-entrypoint.sh             # Initialization script
├── next.config.mjs                   # Next.js configuration
├── package.json                      # Project dependencies
└── README.md                         # This file
```

| No | File/Folder | Description |
|----|-------------|-------------|
| 1  | `src/app/api/` | REST API routes |
| 2  | `src/app/admin/` | Admin panel pages |
| 3  | `src/app/dashboard/` | User dashboard pages |
| 4  | `src/backend/lib/` | Utilities and configurations |
| 5  | `src/backend/models/` | Prisma data models |
| 6  | `src/backend/services/` | Business services |
| 7  | `prisma/schema.prisma` | Database schema |

### Build

To create a production build:

```bash
# Build the application
npm run build

# Start production server
npm run start
```

The build generates an optimized version of the application in the `.next/standalone` folder (when `output: 'standalone'` is configured in `next.config.mjs`).

### Deployment

#### Docker Deployment

The easiest way to deploy is using Docker:

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f
```

#### Platform-Specific Deployment

**Coolify:**
1. **Option 1: Docker Image (Recommended)**
   - Build the image locally: `docker buildx build --platform linux/amd64 -t your-username/mediagrab:latest --push .`
   - In Coolify, select "Docker Image" deployment
   - Enter the image name: `your-username/mediagrab:latest`
   - Configure environment variables (see below)
   - Set "Port Exposes" to `3000` (important!)
   - Deploy

2. **Option 2: Git Repository**
   - Connect your Git repository
   - Coolify will automatically detect the `Dockerfile`
   - Configure environment variables
   - Automatic deployment on each push

**Important for Coolify:**
- Use Supabase **Session Pooler** URL (not direct connection)
- Format: `postgresql://postgres.PROJECT_ID:PASSWORD@aws-1-eu-central-1.pooler.supabase.com:5432/postgres`
- URL-encode special characters in password (`#` → `%23`, `!` → `%21`)
- Set `PORT=3000` and "Port Exposes" to `3000` in Coolify dashboard
- Configure `NEXT_PUBLIC_APP_URL` and `NEXTAUTH_URL` with your Coolify domain

**Portainer:**
1. Go to **Stacks** → **Add Stack**
2. Paste the `docker-compose.yml` content
3. Configure environment variables
4. Click **Deploy**

**Railway/Render:**
1. Connect the repository
2. Configure `DATABASE_URL` and other variables
3. The platform will automatically detect the Dockerfile
4. Automatic deployment

For detailed deployment instructions, see [DOCKER.md](./DOCKER.md)

## Community

### Contribution

Your contributions are always welcome and appreciated. Here are ways to contribute:

1. **Report a bug**  
If you found a bug, report it [here](https://github.com/fefogaca/mediagrab/issues) and we'll take care of it.

2. **Request a feature**  
You can also request a feature [here](https://github.com/fefogaca/mediagrab/issues), and if viable, it will be included in development.

3. **Create a pull request**  
It can't get better than this! Your pull request will be appreciated by the community. You can start by picking any open issue [here](https://github.com/fefogaca/mediagrab/issues) and create a pull request.

> If you are new to open-source, make sure to read more about it [here](https://www.digitalocean.com/community/tutorial_series/an-introduction-to-open-source) and learn more about creating a pull request [here](https://www.digitalocean.com/community/tutorials/how-to-create-a-pull-request-on-github).

### Branches

We use an agile continuous integration methodology, so the version is frequently updated and development is very fast.

1. **`main`** is the production branch.
2. **`develop`** is the development branch.
3. No other permanent branches should be created in the main repository. You can create feature branches, but they should be merged with `main`.

**Steps to work with feature branch**

1. To start working on a new feature, create a new branch prefixed with `feat` followed by the feature name. (e.g., `feat-FEATURE-NAME`)
2. Once you finish your changes, you can create a PR.

**Steps to create a pull request**

1. Make a PR to the `develop` branch.
2. Comply with best practices and guidelines, for example, where the PR concerns visual elements, it should have an image showing the effect.
3. Must pass all continuous integration checks and get positive reviews.

After this, changes will be merged.

### Guideline

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Keep commits atomic and well-described
- Use TypeScript for all new code
- Follow the project's naming conventions
- Add JSDoc comments for public functions
- Keep code clean and readable

## FAQ

**How do I get started?**

1. Clone the repository
2. Install dependencies: `npm install --legacy-peer-deps`
3. Set up your Supabase database and add `DATABASE_URL` to `.env`
4. Run migrations: `npx prisma migrate dev`
5. Start the development server: `npm run dev`

**Can I use Docker?**

Yes! See the [Docker Installation](#installation) section above.

**How do I configure Stripe/SendGrid/OAuth?**

After logging in as admin, go to `/admin/settings` and configure these services through the admin panel. You can configure:
- **Stripe**: Payment processing with API keys and webhook secrets
- **SendGrid**: Email delivery with API key and sender email
- **Google OAuth**: Google login with Client ID and Secret
- **GitHub OAuth**: GitHub login with Client ID and Secret

No need to edit `.env` files - everything is managed through the admin panel.

**What platforms are supported?**

Currently supports: YouTube, Instagram, TikTok, Twitter, and others. Check the API documentation for the complete list.

**How do I deploy?**

You can deploy using Docker to platforms like Coolify, Portainer, Railway, or Render. See the [Deployment](#deployment) section for platform-specific instructions.

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Docker Documentation](https://docs.docker.com/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Stripe Documentation](https://stripe.com/docs)
- [SendGrid Documentation](https://docs.sendgrid.com/)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ❤️ by [fefogaca](https://github.com/fefogaca)

[Report Bug](https://github.com/fefogaca/mediagrab/issues) • [Request Feature](https://github.com/fefogaca/mediagrab/issues)

</div>
