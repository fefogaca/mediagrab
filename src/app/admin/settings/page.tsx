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
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

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
  });

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
          setSettings(data.settings);
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
      </div>
    </div>
  );
}
