// Wrapper para compatibilidade com código existente
import prisma from '../lib/database';
import type { Settings as PrismaSettings, Prisma } from '@prisma/client';

export type ISettings = PrismaSettings;

// Configurações padrão
const defaultSettings = {
  siteName: "MediaGrab",
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  supportEmail: "support@mediagrab.com",
  maintenanceMode: false,
  allowRegistration: true,
  emailVerification: true,
  twoFactorRequired: false,
  maxApiKeysPerUser: 5,
  defaultDailyLimit: 100,
  rateLimitPerMinute: 60,
  googleOAuth: { enabled: false, clientId: "", clientSecret: "" },
  githubOAuth: { enabled: false, clientId: "", clientSecret: "" },
  sendGrid: { enabled: false, apiKey: "", fromEmail: "" },
  stripe: {
    enabled: false,
    secretKey: "",
    publishableKey: "",
    webhookSecret: "",
    developerPriceId: "",
    developerProductId: "",
    startupPriceId: "",
    startupProductId: "",
    enterprisePriceId: "",
    enterpriseProductId: "",
  },
  cookies: {
    instagram: "",
    youtube: "",
    twitter: "",
  },
};

export const Settings = {
  // Obter ou criar configurações (singleton)
  async getSettings(): Promise<PrismaSettings> {
    try {
      let settings = await prisma.settings.findFirst();
      
      if (!settings) {
        // Criar configurações padrão
        settings = await prisma.settings.create({
          data: {
            siteName: defaultSettings.siteName,
            siteUrl: defaultSettings.siteUrl,
            supportEmail: defaultSettings.supportEmail,
            maintenanceMode: defaultSettings.maintenanceMode,
            allowRegistration: defaultSettings.allowRegistration,
            emailVerification: defaultSettings.emailVerification,
            twoFactorRequired: defaultSettings.twoFactorRequired,
            maxApiKeysPerUser: defaultSettings.maxApiKeysPerUser,
            defaultDailyLimit: defaultSettings.defaultDailyLimit,
            rateLimitPerMinute: defaultSettings.rateLimitPerMinute,
            googleOAuth: defaultSettings.googleOAuth as Prisma.InputJsonValue,
            githubOAuth: defaultSettings.githubOAuth as Prisma.InputJsonValue,
            sendGrid: defaultSettings.sendGrid as Prisma.InputJsonValue,
            stripe: defaultSettings.stripe as Prisma.InputJsonValue,
            cookies: defaultSettings.cookies as Prisma.InputJsonValue,
          },
        });
      }
      
      return settings;
    } catch (error) {
      console.error('Erro ao buscar/criar settings:', error);
      throw error;
    }
  },

  // Atualizar configurações
  async updateSettings(data: Partial<Prisma.SettingsUpdateInput>): Promise<PrismaSettings> {
    let settings = await prisma.settings.findFirst();
    
    if (!settings) {
      // Criar se não existir
      const createData: Prisma.SettingsCreateInput = {
        siteName: (data.siteName as string) || defaultSettings.siteName,
        siteUrl: (data.siteUrl as string) || defaultSettings.siteUrl,
        supportEmail: (data.supportEmail as string) || defaultSettings.supportEmail,
        maintenanceMode: (data.maintenanceMode as boolean) ?? defaultSettings.maintenanceMode,
        allowRegistration: (data.allowRegistration as boolean) ?? defaultSettings.allowRegistration,
        emailVerification: (data.emailVerification as boolean) ?? defaultSettings.emailVerification,
        twoFactorRequired: (data.twoFactorRequired as boolean) ?? defaultSettings.twoFactorRequired,
        maxApiKeysPerUser: (data.maxApiKeysPerUser as number) || defaultSettings.maxApiKeysPerUser,
        defaultDailyLimit: (data.defaultDailyLimit as number) || defaultSettings.defaultDailyLimit,
        rateLimitPerMinute: (data.rateLimitPerMinute as number) || defaultSettings.rateLimitPerMinute,
        googleOAuth: (data.googleOAuth as Prisma.InputJsonValue) || defaultSettings.googleOAuth as Prisma.InputJsonValue,
        githubOAuth: (data.githubOAuth as Prisma.InputJsonValue) || defaultSettings.githubOAuth as Prisma.InputJsonValue,
        sendGrid: (data.sendGrid as Prisma.InputJsonValue) || defaultSettings.sendGrid as Prisma.InputJsonValue,
        stripe: (data.stripe as Prisma.InputJsonValue) || defaultSettings.stripe as Prisma.InputJsonValue,
        cookies: (data.cookies as Prisma.InputJsonValue) || defaultSettings.cookies as Prisma.InputJsonValue,
      };
      settings = await prisma.settings.create({ data: createData });
    } else {
      // Atualizar existente - converter JSONB corretamente
      const updateData: Prisma.SettingsUpdateInput = {};
      if (data.siteName !== undefined) updateData.siteName = data.siteName as string;
      if (data.siteUrl !== undefined) updateData.siteUrl = data.siteUrl as string;
      if (data.supportEmail !== undefined) updateData.supportEmail = data.supportEmail as string;
      if (data.maintenanceMode !== undefined) updateData.maintenanceMode = data.maintenanceMode as boolean;
      if (data.allowRegistration !== undefined) updateData.allowRegistration = data.allowRegistration as boolean;
      if (data.emailVerification !== undefined) updateData.emailVerification = data.emailVerification as boolean;
      if (data.twoFactorRequired !== undefined) updateData.twoFactorRequired = data.twoFactorRequired as boolean;
      if (data.maxApiKeysPerUser !== undefined) updateData.maxApiKeysPerUser = data.maxApiKeysPerUser as number;
      if (data.defaultDailyLimit !== undefined) updateData.defaultDailyLimit = data.defaultDailyLimit as number;
      if (data.rateLimitPerMinute !== undefined) updateData.rateLimitPerMinute = data.rateLimitPerMinute as number;
      if (data.googleOAuth !== undefined) updateData.googleOAuth = data.googleOAuth as Prisma.InputJsonValue;
      if (data.githubOAuth !== undefined) updateData.githubOAuth = data.githubOAuth as Prisma.InputJsonValue;
      if (data.sendGrid !== undefined) updateData.sendGrid = data.sendGrid as Prisma.InputJsonValue;
      if (data.stripe !== undefined) updateData.stripe = data.stripe as Prisma.InputJsonValue;
      if (data.cookies !== undefined) updateData.cookies = data.cookies as Prisma.InputJsonValue;
      
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: updateData,
      });
    }
    
    return settings;
  },

  // Obter configuração específica
  async getSetting<K extends keyof PrismaSettings>(key: K): Promise<PrismaSettings[K]> {
    const settings = await this.getSettings();
    return settings[key];
  },
};

export default Settings;

