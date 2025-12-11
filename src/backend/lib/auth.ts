import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import prisma, { connectDB } from './database';

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Google OAuth
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    
    // GitHub OAuth
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),
    
    // Credenciais (email/senha)
    Credentials({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha são obrigatórios');
        }

        await connectDB();

        const user = await prisma.user.findUnique({ 
          where: { 
            email: (credentials.email as string).toLowerCase() 
          }
        });

        if (!user || !user.password) {
          throw new Error('Credenciais inválidas');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Credenciais inválidas');
        }

        // Verificar 2FA se habilitado
        if (user.twoFactor?.enabled) {
          throw new Error('2FA_REQUIRED');
        }

        // Verificar 2FA se habilitado
        const twoFactor = user.twoFactor as { enabled?: boolean } || {};
        if (twoFactor.enabled) {
          throw new Error('2FA_REQUIRED');
        }

        // Atualizar último login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image || undefined,
          role: user.role,
          plan: user.plan,
        };
      },
    }),
  ],

  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },

  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
    newUser: '/register/complete',
  },

  callbacks: {
    async signIn({ user, account }: { user: any; account: any }) {
      if (account?.provider === 'google' || account?.provider === 'github') {
        try {
          await connectDB();
          
          // Verificar se usuário existe
          let existingUser = await prisma.user.findUnique({ 
            where: { email: user.email?.toLowerCase() || '' }
          });
          
          if (!existingUser) {
            // Criar novo usuário
            existingUser = await prisma.user.create({
              data: {
                email: user.email?.toLowerCase() || '',
                name: user.name || '',
                image: user.image,
                provider: account.provider,
                providerId: account.providerAccountId,
                emailVerified: new Date(),
                role: 'user',
                plan: 'free',
              }
            });
          } else {
            // Atualizar informações
            existingUser = await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                lastLoginAt: new Date(),
                ...(user.image && { image: user.image }),
              }
            });
          }
          
          // Adicionar dados extras ao objeto user
          user.id = existingUser.id;
          user.role = existingUser.role;
          user.plan = existingUser.plan;
        } catch (error) {
          console.error('Erro no signIn callback:', error);
          return false;
        }
      }
      
      return true;
    },

    async jwt({ token, user, trigger, session }: { token: any; user?: any; trigger?: string; session?: any }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || 'user';
        token.plan = user.plan || 'free';
      }

      // Atualizar token quando a sessão é atualizada
      if (trigger === 'update' && session) {
        token.role = session.role;
        token.plan = session.plan;
      }

      return token;
    },

    async session({ session, token }: { session: any; token: any }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.plan = token.plan as string;
      }
      
      return session;
    },
  },

  events: {
    async signIn({ user, isNewUser }: { user: any; isNewUser?: boolean }) {
      if (isNewUser) {
        console.log(`Novo usuário registrado: ${user.email}`);
        // TODO: Enviar email de boas-vindas
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// Tipos personalizados
declare module 'next-auth' {
  interface User {
    role?: string;
    plan?: string;
  }
  
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      role: string;
      plan: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    plan: string;
  }
}
