"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@frontend/components/ui/card";
import { Button } from "@frontend/components/ui/button";
import { Input } from "@frontend/components/ui/input";
import { Label } from "@frontend/components/ui/label";
import { Switch } from "@frontend/components/ui/switch";
import { Separator } from "@frontend/components/ui/separator";
import { Badge } from "@frontend/components/ui/badge";
import { toast } from "sonner";
import {
  Save,
  Shield,
  Database,
  Key,
  Globe,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  CreditCard,
  Mail,
  Eye,
  EyeOff,
  Github,
  Chrome,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface StripeConfig {
  enabled: boolean;
  secretKey: string;
  publishableKey: string;
  webhookSecret: string;
  developerPriceId: string;
  developerProductId: string;
  startupPriceId: string;
  startupProductId: string;
  enterprisePriceId: string;
  enterpriseProductId: string;
}

interface SendGridConfig {
  enabled: boolean;
  apiKey: string;
  fromEmail: string;
}

interface GoogleOAuthConfig {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
}

interface GitHubOAuthConfig {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
}

interface CookiesConfig {
  instagram: string;
  youtube: string;
}

interface Settings {
  siteName: string;
  siteUrl: string;
  supportEmail: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  emailVerification: boolean;
  twoFactorRequired: boolean;
  maxApiKeysPerUser: number;
  defaultDailyLimit: number;
  rateLimitPerMinute: number;
  stripe: StripeConfig;
  sendGrid: SendGridConfig;
  googleOAuth: GoogleOAuthConfig;
  githubOAuth: GitHubOAuthConfig;
  cookies: CookiesConfig;
}

interface DbStatus {
  connected: boolean;
  type: string;
  tables: number;
  tableNames: string[];
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Settings>({
    siteName: "MediaGrab",
    siteUrl: "https://mediagrab.com",
    supportEmail: "support@mediagrab.com",
    maintenanceMode: false,
    allowRegistration: true,
    emailVerification: true,
    twoFactorRequired: false,
    maxApiKeysPerUser: 5,
    defaultDailyLimit: 100,
    rateLimitPerMinute: 60,
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
    sendGrid: {
      enabled: false,
      apiKey: "",
      fromEmail: "",
    },
    googleOAuth: {
      enabled: false,
      clientId: "",
      clientSecret: "",
    },
    githubOAuth: {
      enabled: false,
      clientId: "",
      clientSecret: "",
    },
    cookies: {
      instagram: "",
      youtube: "",
    },
  });

  const [showStripeSecret, setShowStripeSecret] = useState(false);
  const [showStripeWebhook, setShowStripeWebhook] = useState(false);
  const [showSendGridKey, setShowSendGridKey] = useState(false);
  const [showGoogleSecret, setShowGoogleSecret] = useState(false);
  const [showGitHubSecret, setShowGitHubSecret] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  const [dbStatus, setDbStatus] = useState<DbStatus>({
    connected: false,
    type: "PostgreSQL",
    tables: 0,
    tableNames: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingDb, setCheckingDb] = useState(false);

  useEffect(() => {
    fetchSettings();
    checkDbConnection();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          // Garantir que stripe, sendGrid e OAuth existam
          const loadedSettings = {
            ...data.settings,
            stripe: data.settings.stripe || settings.stripe,
            sendGrid: data.settings.sendGrid || settings.sendGrid,
            googleOAuth: data.settings.googleOAuth || settings.googleOAuth,
            githubOAuth: data.settings.githubOAuth || settings.githubOAuth,
            cookies: data.settings.cookies || settings.cookies,
          };
          setSettings(loadedSettings);
          
          // Verificar se há cookies configurados
          if (loadedSettings.cookies) {
            setCookieStatus({
              instagram: !!(loadedSettings.cookies.instagram && loadedSettings.cookies.instagram.trim() !== ''),
              youtube: !!(loadedSettings.cookies.youtube && loadedSettings.cookies.youtube.trim() !== ''),
            });
          }
        }
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkDbConnection = async () => {
    setCheckingDb(true);
    try {
      const response = await fetch("/api/admin/settings/database");
      const data = await response.json();
      setDbStatus({
        connected: data.connected,
        type: data.type || "PostgreSQL",
        tables: data.tables || 0,
        tableNames: data.tableNames || [],
      });
      if (data.connected) {
        toast.success("Conexão com o banco verificada!");
      } else {
        toast.error("Falha na conexão com o banco");
      }
    } catch (error) {
      console.error("Erro ao verificar banco:", error);
      setDbStatus({
        connected: false,
        type: "PostgreSQL",
        tables: 0,
        tableNames: [],
      });
      toast.error("Erro ao verificar conexão");
    } finally {
      setCheckingDb(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success(t.admin.settings.saveSuccess);
        
        // Se modo manutenção foi ativado, mostrar aviso
        if (settings.maintenanceMode) {
          toast.warning(t.admin.settings.maintenanceModeWarning);
        }
      } else {
        const error = await response.json();
        toast.error(error.message || t.admin.settings.errorSaving);
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error(t.admin.settings.errorSaving);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (key: keyof Settings, value: boolean) => {
    setSettings({ ...settings, [key]: value });
    
    // Salvar imediatamente toggles críticos
    if (key === 'maintenanceMode' || key === 'allowRegistration') {
      try {
        await fetch("/api/admin/settings/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value }),
        });
        
        if (key === 'maintenanceMode' && value) {
          toast.warning(t.admin.settings.maintenanceModeActivated);
        } else if (key === 'maintenanceMode' && !value) {
          toast.success(t.admin.settings.maintenanceModeDeactivated);
        }
      } catch (error) {
        console.error("Erro ao alternar:", error);
      }
    }
  };

  const handleStripeChange = (field: keyof StripeConfig, value: string | boolean) => {
    setSettings({
      ...settings,
      stripe: {
        ...settings.stripe,
        [field]: value,
      },
    });
  };

  const handleSendGridChange = (field: keyof SendGridConfig, value: string | boolean) => {
    setSettings({
      ...settings,
      sendGrid: {
        ...settings.sendGrid,
        [field]: value,
      },
    });
  };

  const handleGoogleOAuthChange = (field: keyof GoogleOAuthConfig, value: string | boolean) => {
    setSettings({
      ...settings,
      googleOAuth: {
        ...settings.googleOAuth,
        [field]: value,
      },
    });
  };

  const handleGitHubOAuthChange = (field: keyof GitHubOAuthConfig, value: string | boolean) => {
    setSettings({
      ...settings,
      githubOAuth: {
        ...settings.githubOAuth,
        [field]: value,
      },
    });
  };

  const [uploadingCookies, setUploadingCookies] = useState(false);
  const [instagramFile, setInstagramFile] = useState<File | null>(null);
  const [youtubeFile, setYoutubeFile] = useState<File | null>(null);
  const [testingCookies, setTestingCookies] = useState<{ instagram: boolean; youtube: boolean }>({
    instagram: false,
    youtube: false,
  });
  const [cookieStatus, setCookieStatus] = useState<{ instagram: boolean; youtube: boolean }>({
    instagram: false,
    youtube: false,
  });

  const handleCookiesUpload = async () => {
    if (!instagramFile && !youtubeFile) {
      toast.error("Selecione pelo menos um arquivo de cookies");
      return;
    }

    setUploadingCookies(true);
    try {
      const formData = new FormData();
      // Aceitar qualquer arquivo .txt - o nome do arquivo não importa mais
      if (instagramFile) {
        formData.append('instagram', instagramFile);
      }
      if (youtubeFile) {
        formData.append('youtube', youtubeFile);
      }

      const response = await fetch("/api/admin/settings/cookies", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setSettings({
          ...settings,
          cookies: data.cookies,
        });
        toast.success(t.admin.settings.cookies.success);
        setInstagramFile(null);
        setYoutubeFile(null);
        // Recarregar settings para garantir sincronização
        await fetchSettings();
        
        // Atualizar status dos cookies
        if (data.cookies) {
          setCookieStatus({
            instagram: !!(data.cookies.instagram && data.cookies.instagram.trim() !== ''),
            youtube: !!(data.cookies.youtube && data.cookies.youtube.trim() !== ''),
          });
        }
      } else {
        const error = await response.json();
        toast.error(error.message || t.admin.settings.cookies.error);
      }
    } catch (error) {
      console.error("Erro ao fazer upload dos cookies:", error);
      toast.error(t.admin.settings.cookies.error);
    } finally {
      setUploadingCookies(false);
    }
  };

  const handleTestCookies = async (platform: 'instagram' | 'youtube') => {
    setTestingCookies(prev => ({ ...prev, [platform]: true }));
    
    try {
      const response = await fetch("/api/admin/settings/cookies/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || `Cookies do ${platform} estão funcionando!`);
      } else {
        if (data.error === 'NO_COOKIES') {
          toast.warning(data.message || `Nenhum cookie configurado para ${platform}`);
        } else {
          toast.error(data.message || `Erro ao testar cookies do ${platform}`);
        }
      }
    } catch (error) {
      console.error(`Erro ao testar cookies do ${platform}:`, error);
      toast.error(`Erro ao testar cookies do ${platform}`);
    } finally {
      setTestingCookies(prev => ({ ...prev, [platform]: false }));
    }
  };

  const handleTestEmail = async () => {
    if (!settings.sendGrid.apiKey || !settings.sendGrid.fromEmail) {
      toast.error("Configure a API Key e o Email Remetente primeiro");
      return;
    }

    setTestingEmail(true);
    try {
      const response = await fetch("/api/admin/settings/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: settings.sendGrid.apiKey,
          fromEmail: settings.sendGrid.fromEmail,
        }),
      });

      if (response.ok) {
        toast.success(t.admin.settings.sendgrid.sent);
      } else {
        const error = await response.json();
        toast.error(error.message || t.admin.settings.sendgrid.error);
      }
    } catch (error) {
      console.error("Erro ao testar email:", error);
      toast.error(t.admin.settings.sendgrid.error);
    } finally {
      setTestingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.admin.settings.title}</h1>
          <p className="text-zinc-400 mt-1">{t.admin.settings.subtitle}</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-500 text-white"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saving ? t.admin.settings.saving : t.admin.settings.saveChanges}
        </Button>
      </div>

      {/* Maintenance Mode Alert */}
      {settings.maintenanceMode && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <div>
            <p className="font-medium text-amber-400">{t.admin.settings.maintenanceModeActivated}</p>
            <p className="text-sm text-amber-500/80">{t.admin.settings.maintenanceModeWarning}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* General Settings */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Globe className="h-5 w-5 text-emerald-500" />
              {t.admin.settings.general.title}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {t.admin.settings.general.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">{t.admin.settings.general.siteName}</Label>
              <Input
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="bg-zinc-800/50 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">{t.admin.settings.general.siteUrl}</Label>
              <Input
                value={settings.siteUrl}
                onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                className="bg-zinc-800/50 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">{t.admin.settings.general.supportEmail}</Label>
              <Input
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="bg-zinc-800/50 border-zinc-700 text-white"
              />
            </div>
            <Separator className="bg-zinc-800" />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-zinc-300">{t.admin.settings.general.maintenanceMode}</Label>
                <p className="text-xs text-zinc-500">{t.admin.settings.general.maintenanceModeDesc}</p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => handleToggle('maintenanceMode', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-500" />
              {t.admin.settings.security.title}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {t.admin.settings.security.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-zinc-300">{t.admin.settings.security.allowRegistration}</Label>
                <p className="text-xs text-zinc-500">{t.admin.settings.security.allowRegistrationDesc}</p>
              </div>
              <Switch
                checked={settings.allowRegistration}
                onCheckedChange={(checked) => handleToggle('allowRegistration', checked)}
              />
            </div>
            <Separator className="bg-zinc-800" />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-zinc-300">{t.admin.settings.security.emailVerification}</Label>
                <p className="text-xs text-zinc-500">{t.admin.settings.security.emailVerificationDesc}</p>
              </div>
              <Switch
                checked={settings.emailVerification}
                onCheckedChange={(checked) => setSettings({ ...settings, emailVerification: checked })}
              />
            </div>
            <Separator className="bg-zinc-800" />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-zinc-300">{t.admin.settings.security.twoFactor}</Label>
                <p className="text-xs text-zinc-500">{t.admin.settings.security.twoFactorDesc}</p>
              </div>
              <Switch
                checked={settings.twoFactorRequired}
                onCheckedChange={(checked) => setSettings({ ...settings, twoFactorRequired: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* API Settings */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Key className="h-5 w-5 text-emerald-500" />
              {t.admin.settings.api.title}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {t.admin.settings.api.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">{t.admin.settings.api.maxKeys}</Label>
              <Input
                type="number"
                value={settings.maxApiKeysPerUser}
                onChange={(e) => setSettings({ ...settings, maxApiKeysPerUser: parseInt(e.target.value) || 0 })}
                className="bg-zinc-800/50 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">{t.admin.settings.api.defaultDailyLimit}</Label>
              <Input
                type="number"
                value={settings.defaultDailyLimit}
                onChange={(e) => setSettings({ ...settings, defaultDailyLimit: parseInt(e.target.value) || 0 })}
                className="bg-zinc-800/50 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">{t.admin.settings.api.rateLimit}</Label>
              <Input
                type="number"
                value={settings.rateLimitPerMinute}
                onChange={(e) => setSettings({ ...settings, rateLimitPerMinute: parseInt(e.target.value) || 0 })}
                className="bg-zinc-800/50 border-zinc-700 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Database Info */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-emerald-500" />
              {t.admin.settings.database.title}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {t.admin.settings.database.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
              <div>
                <p className="text-sm text-zinc-300">{t.admin.settings.database.type}</p>
                <p className="text-xs text-zinc-500">{dbStatus.type}</p>
              </div>
              <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
                NoSQL
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
              <div>
                <p className="text-sm text-zinc-300">{t.admin.settings.database.status}</p>
                <p className="text-xs text-zinc-500">
                  {dbStatus.connected ? t.admin.settings.database.connected : t.admin.settings.database.disconnected}
                </p>
              </div>
              {dbStatus.connected ? (
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
              <div>
                <p className="text-sm text-zinc-300">{t.admin.settings.database.collections || 'Tabelas'}</p>
                <p className="text-xs text-zinc-500">
                  {dbStatus.tables} {t.admin.settings.database.collections || 'Tabelas'}
                </p>
              </div>
              <Badge variant="outline" className="border-zinc-600 text-zinc-400">
                {dbStatus.tables}
              </Badge>
            </div>
            {dbStatus.tableNames.length > 0 && (
              <div className="p-3 rounded-lg bg-zinc-800/50">
                <p className="text-sm text-zinc-300 mb-2">{t.admin.settings.database.collectionNames || 'Tabelas'}:</p>
                <div className="flex flex-wrap gap-1">
                  {dbStatus.tableNames.map((name) => (
                    <Badge key={name} variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <Button 
              variant="outline" 
              className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              onClick={checkDbConnection}
              disabled={checkingDb}
            >
              {checkingDb ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {checkingDb ? t.admin.settings.database.checkingConnection : t.admin.settings.database.verifyConnection}
            </Button>
          </CardContent>
        </Card>

        {/* Stripe Settings */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-500" />
              {t.admin.settings.stripe.title}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {t.admin.settings.stripe.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-zinc-300">{t.admin.settings.stripe.enabled}</Label>
                <p className="text-xs text-zinc-500">{t.admin.settings.stripe.enabledDesc}</p>
              </div>
              <Switch
                checked={settings.stripe.enabled}
                onCheckedChange={(checked) => handleStripeChange('enabled', checked)}
              />
            </div>
            <Separator className="bg-zinc-800" />
            <div className="space-y-2">
              <Label className="text-zinc-300">{t.admin.settings.stripe.secretKey}</Label>
              <div className="relative">
                <Input
                  type={showStripeSecret ? "text" : "password"}
                  value={settings.stripe.secretKey}
                  onChange={(e) => handleStripeChange('secretKey', e.target.value)}
                  className="bg-zinc-800/50 border-zinc-700 text-white pr-10"
                  placeholder="sk_test_..."
                />
                <button
                  type="button"
                  onClick={() => setShowStripeSecret(!showStripeSecret)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                >
                  {showStripeSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-zinc-500">{t.admin.settings.stripe.secretKeyDesc}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">{t.admin.settings.stripe.publishableKey}</Label>
              <Input
                type="text"
                value={settings.stripe.publishableKey}
                onChange={(e) => handleStripeChange('publishableKey', e.target.value)}
                className="bg-zinc-800/50 border-zinc-700 text-white"
                placeholder="pk_test_..."
              />
              <p className="text-xs text-zinc-500">{t.admin.settings.stripe.publishableKeyDesc}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">{t.admin.settings.stripe.webhookSecret}</Label>
              <div className="relative">
                <Input
                  type={showStripeWebhook ? "text" : "password"}
                  value={settings.stripe.webhookSecret}
                  onChange={(e) => handleStripeChange('webhookSecret', e.target.value)}
                  className="bg-zinc-800/50 border-zinc-700 text-white pr-10"
                  placeholder="whsec_..."
                />
                <button
                  type="button"
                  onClick={() => setShowStripeWebhook(!showStripeWebhook)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                >
                  {showStripeWebhook ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-zinc-500">{t.admin.settings.stripe.webhookSecretDesc}</p>
            </div>
            <Separator className="bg-zinc-800" />
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-zinc-300">Planos</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-zinc-300 text-xs">Developer Price ID</Label>
                  <Input
                    type="text"
                    value={settings.stripe.developerPriceId}
                    onChange={(e) => handleStripeChange('developerPriceId', e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700 text-white text-sm"
                    placeholder="price_..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300 text-xs">Developer Product ID</Label>
                  <Input
                    type="text"
                    value={settings.stripe.developerProductId}
                    onChange={(e) => handleStripeChange('developerProductId', e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700 text-white text-sm"
                    placeholder="prod_..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300 text-xs">Startup Price ID</Label>
                  <Input
                    type="text"
                    value={settings.stripe.startupPriceId}
                    onChange={(e) => handleStripeChange('startupPriceId', e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700 text-white text-sm"
                    placeholder="price_..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300 text-xs">Startup Product ID</Label>
                  <Input
                    type="text"
                    value={settings.stripe.startupProductId}
                    onChange={(e) => handleStripeChange('startupProductId', e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700 text-white text-sm"
                    placeholder="prod_..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300 text-xs">Enterprise Price ID</Label>
                  <Input
                    type="text"
                    value={settings.stripe.enterprisePriceId}
                    onChange={(e) => handleStripeChange('enterprisePriceId', e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700 text-white text-sm"
                    placeholder="price_..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300 text-xs">Enterprise Product ID</Label>
                  <Input
                    type="text"
                    value={settings.stripe.enterpriseProductId}
                    onChange={(e) => handleStripeChange('enterpriseProductId', e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700 text-white text-sm"
                    placeholder="prod_..."
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SendGrid Settings */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Mail className="h-5 w-5 text-emerald-500" />
              {t.admin.settings.sendgrid.title}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {t.admin.settings.sendgrid.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-zinc-300">{t.admin.settings.sendgrid.enabled}</Label>
                <p className="text-xs text-zinc-500">{t.admin.settings.sendgrid.enabledDesc}</p>
              </div>
              <Switch
                checked={settings.sendGrid.enabled}
                onCheckedChange={(checked) => handleSendGridChange('enabled', checked)}
              />
            </div>
            <Separator className="bg-zinc-800" />
            <div className="space-y-2">
              <Label className="text-zinc-300">{t.admin.settings.sendgrid.apiKey}</Label>
              <div className="relative">
                <Input
                  type={showSendGridKey ? "text" : "password"}
                  value={settings.sendGrid.apiKey}
                  onChange={(e) => handleSendGridChange('apiKey', e.target.value)}
                  className="bg-zinc-800/50 border-zinc-700 text-white pr-10"
                  placeholder="SG.xxx..."
                />
                <button
                  type="button"
                  onClick={() => setShowSendGridKey(!showSendGridKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                >
                  {showSendGridKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-zinc-500">{t.admin.settings.sendgrid.apiKeyDesc}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">{t.admin.settings.sendgrid.fromEmail}</Label>
              <Input
                type="email"
                value={settings.sendGrid.fromEmail}
                onChange={(e) => handleSendGridChange('fromEmail', e.target.value)}
                className="bg-zinc-800/50 border-zinc-700 text-white"
                placeholder="noreply@mediagrab.com"
              />
              <p className="text-xs text-zinc-500">{t.admin.settings.sendgrid.fromEmailDesc}</p>
            </div>
            <Separator className="bg-zinc-800" />
            <Button
              variant="outline"
              className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              onClick={handleTestEmail}
              disabled={testingEmail || !settings.sendGrid.apiKey || !settings.sendGrid.fromEmail}
            >
              {testingEmail ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              {testingEmail ? t.admin.settings.sendgrid.sending : t.admin.settings.sendgrid.testEmail}
            </Button>
          </CardContent>
        </Card>

        {/* Google OAuth Settings */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Chrome className="h-5 w-5 text-emerald-500" />
              {t.admin.settings.googleOAuth.title}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {t.admin.settings.googleOAuth.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-zinc-300">{t.admin.settings.googleOAuth.enabled}</Label>
                <p className="text-xs text-zinc-500">{t.admin.settings.googleOAuth.enabledDesc}</p>
              </div>
              <Switch
                checked={settings.googleOAuth.enabled}
                onCheckedChange={(checked) => handleGoogleOAuthChange('enabled', checked)}
              />
            </div>
            {settings.googleOAuth.enabled && (
              <>
                <Separator className="bg-zinc-800" />
                <div className="space-y-2">
                  <Label className="text-zinc-300">{t.admin.settings.googleOAuth.clientId}</Label>
                  <Input
                    type="text"
                    value={settings.googleOAuth.clientId}
                    onChange={(e) => handleGoogleOAuthChange('clientId', e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700 text-white"
                    placeholder="xxxxx.apps.googleusercontent.com"
                  />
                  <p className="text-xs text-zinc-500">{t.admin.settings.googleOAuth.clientIdDesc}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">{t.admin.settings.googleOAuth.clientSecret}</Label>
                  <div className="relative">
                    <Input
                      type={showGoogleSecret ? "text" : "password"}
                      value={settings.googleOAuth.clientSecret}
                      onChange={(e) => handleGoogleOAuthChange('clientSecret', e.target.value)}
                      className="bg-zinc-800/50 border-zinc-700 text-white pr-10"
                      placeholder="GOCSPX-..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowGoogleSecret(!showGoogleSecret)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                    >
                      {showGoogleSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500">{t.admin.settings.googleOAuth.clientSecretDesc}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* GitHub OAuth Settings */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Github className="h-5 w-5 text-emerald-500" />
              {t.admin.settings.githubOAuth.title}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {t.admin.settings.githubOAuth.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-zinc-300">{t.admin.settings.githubOAuth.enabled}</Label>
                <p className="text-xs text-zinc-500">{t.admin.settings.githubOAuth.enabledDesc}</p>
              </div>
              <Switch
                checked={settings.githubOAuth.enabled}
                onCheckedChange={(checked) => handleGitHubOAuthChange('enabled', checked)}
              />
            </div>
            {settings.githubOAuth.enabled && (
              <>
                <Separator className="bg-zinc-800" />
                <div className="space-y-2">
                  <Label className="text-zinc-300">{t.admin.settings.githubOAuth.clientId}</Label>
                  <Input
                    type="text"
                    value={settings.githubOAuth.clientId}
                    onChange={(e) => handleGitHubOAuthChange('clientId', e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700 text-white"
                    placeholder="Iv1.xxx..."
                  />
                  <p className="text-xs text-zinc-500">{t.admin.settings.githubOAuth.clientIdDesc}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">{t.admin.settings.githubOAuth.clientSecret}</Label>
                  <div className="relative">
                    <Input
                      type={showGitHubSecret ? "text" : "password"}
                      value={settings.githubOAuth.clientSecret}
                      onChange={(e) => handleGitHubOAuthChange('clientSecret', e.target.value)}
                      className="bg-zinc-800/50 border-zinc-700 text-white pr-10"
                      placeholder="ghp_..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowGitHubSecret(!showGitHubSecret)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                    >
                      {showGitHubSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500">{t.admin.settings.githubOAuth.clientSecretDesc}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Cookies Settings */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Key className="h-5 w-5 text-emerald-500" />
              {t.admin.settings.cookies.title}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {t.admin.settings.cookies.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status dos Cookies */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${cookieStatus.instagram ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                  <span className="text-sm text-zinc-300">Instagram</span>
                </div>
                <Badge variant={cookieStatus.instagram ? "default" : "secondary"} className={cookieStatus.instagram ? "bg-emerald-600" : ""}>
                  {cookieStatus.instagram ? t.admin.settings.cookies.configured : t.admin.settings.cookies.notConfigured}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${cookieStatus.youtube ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                  <span className="text-sm text-zinc-300">YouTube</span>
                </div>
                <Badge variant={cookieStatus.youtube ? "default" : "secondary"} className={cookieStatus.youtube ? "bg-emerald-600" : ""}>
                  {cookieStatus.youtube ? t.admin.settings.cookies.configured : t.admin.settings.cookies.notConfigured}
                </Badge>
              </div>
            </div>
            <Separator className="bg-zinc-800" />
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-zinc-300">{t.admin.settings.cookies.instagram}</Label>
                {cookieStatus.instagram && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestCookies('instagram')}
                    disabled={testingCookies.instagram}
                    className="h-7 text-xs"
                  >
                    {testingCookies.instagram ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        {t.admin.settings.cookies.testing}
                      </>
                    ) : (
                      t.admin.settings.cookies.test
                    )}
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setInstagramFile(file);
                  }}
                  className="bg-zinc-800/50 border-zinc-700 text-white text-sm"
                />
                {instagramFile && (
                  <Badge variant="outline" className="text-emerald-500 border-emerald-500">
                    {instagramFile.name}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-zinc-500">{t.admin.settings.cookies.instagramDesc}</p>
            </div>
            <Separator className="bg-zinc-800" />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-zinc-300">{t.admin.settings.cookies.youtube}</Label>
                {cookieStatus.youtube && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestCookies('youtube')}
                    disabled={testingCookies.youtube}
                    className="h-7 text-xs"
                  >
                    {testingCookies.youtube ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        {t.admin.settings.cookies.testing}
                      </>
                    ) : (
                      t.admin.settings.cookies.test
                    )}
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".txt"
                  onChange={(e) => setYoutubeFile(e.target.files?.[0] || null)}
                  className="bg-zinc-800/50 border-zinc-700 text-white text-sm"
                />
                {youtubeFile && (
                  <Badge variant="outline" className="text-emerald-500 border-emerald-500">
                    {youtubeFile.name}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-zinc-500">{t.admin.settings.cookies.youtubeDesc}</p>
            </div>
            <Separator className="bg-zinc-800" />
            <Button
              onClick={handleCookiesUpload}
              disabled={uploadingCookies || (!instagramFile && !youtubeFile)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {uploadingCookies ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.admin.settings.cookies.uploading}
                </>
              ) : (
                t.admin.settings.cookies.upload
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
