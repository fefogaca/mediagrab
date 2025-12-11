"use client";

import { useState, useEffect, useRef } from "react";
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
import { Avatar, AvatarFallback } from "@frontend/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@frontend/components/ui/dialog";
import { toast } from "sonner";
import {
  User,
  Mail,
  Lock,
  Shield,
  Bell,
  Trash2,
  Save,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface UserSettings {
  name: string;
  email: string;
  image?: string;
  twoFactorEnabled: boolean;
  emailNotifications: boolean;
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<UserSettings>({
    name: "",
    email: "",
    image: "",
    twoFactorEnabled: false,
    emailNotifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Email change state
  const [newEmail, setNewEmail] = useState("");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [verifying, setVerifying] = useState(false);
  
  // Refs for inputs
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();
      if (data.user) {
        setSettings({
          name: data.user.name || "",
          email: data.user.email || "",
          image: data.user.image || "",
          twoFactorEnabled: data.user.twoFactorEnabled || false,
          emailNotifications: true,
        });
      }
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const name = nameRef.current?.value || settings.name;
      
      const response = await fetch("/api/user/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao atualizar");
      }

      setSettings(prev => ({ ...prev, name }));
      toast.success(t.settings.profile.saved);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.common.error);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      toast.error(t.settings.password.confirm);
      return;
    }

    if (passwords.new.length < 8) {
      toast.error(t.admin.users.passwordMinLength);
      return;
    }

    setChangingPassword(true);
    try {
      const response = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao alterar senha");
      }

      toast.success(t.settings.password.changed);
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.common.error);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSendEmailVerification = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast.error("Email inválido");
      return;
    }

    try {
      // TODO: Implementar envio de código via SendGrid
      toast.info("Funcionalidade de verificação de email em desenvolvimento. Por enquanto, use o código: 123456");
      setCodeSent(true);
    } catch (error) {
      toast.error("Erro ao enviar código de verificação");
    }
  };

  const handleVerifyAndChangeEmail = async () => {
    if (verificationCode !== "123456") { // Código temporário para desenvolvimento
      toast.error("Código de verificação incorreto");
      return;
    }

    setVerifying(true);
    try {
      const response = await fetch("/api/user/change-email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail, verificationCode }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao alterar email");
      }

      setSettings(prev => ({ ...prev, email: newEmail }));
      toast.success("Email alterado com sucesso!");
      setEmailDialogOpen(false);
      setNewEmail("");
      setVerificationCode("");
      setCodeSent(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao alterar email");
    } finally {
      setVerifying(false);
    }
  };

  const handleDeleteAccount = () => {
    if (confirm(t.settings.danger.deleteWarning)) {
      toast.error(t.common.error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-zinc-800 rounded w-48 animate-pulse" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-zinc-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">{t.settings.title}</h1>
        <p className="text-zinc-400 mt-1">{t.settings.subtitle}</p>
      </div>

      {/* Profile Settings */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="h-5 w-5 text-emerald-500" />
            {t.settings.profile.title}
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {t.settings.profile.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar - Display Only */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-emerald-600 text-white text-xl">
                {settings.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-medium text-white">{settings.name}</p>
              <p className="text-sm text-zinc-400">{settings.email}</p>
            </div>
          </div>

          <Separator className="bg-zinc-800" />

          {/* Name */}
          <div className="space-y-2">
            <Label className="text-zinc-300">{t.settings.profile.name}</Label>
            <Input
              ref={nameRef}
              defaultValue={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              className="bg-zinc-800/50 border-zinc-700 text-white"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label className="text-zinc-300">{t.settings.profile.email}</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                value={settings.email}
                disabled
                className="bg-zinc-800/50 border-zinc-700 text-zinc-400 flex-1"
              />
              <Button
                variant="outline"
                onClick={() => setEmailDialogOpen(true)}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                <Mail className="h-4 w-4 mr-2" />
                {t.common.edit}
              </Button>
            </div>
            <p className="text-xs text-zinc-500">{t.settings.profile.email}</p>
          </div>

          <Button onClick={handleSaveProfile} disabled={saving} className="bg-emerald-600 hover:bg-emerald-500">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t.common.loading}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t.settings.profile.save}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Email Change Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Mail className="h-5 w-5 text-emerald-500" />
              {t.settings.profile.email}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {t.settings.profile.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">{t.settings.profile.email}</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={t.settings.profile.email}
                disabled={codeSent}
                className="bg-zinc-800/50 border-zinc-700 text-white"
              />
            </div>
            
            {codeSent && (
              <div className="space-y-2">
                <Label className="text-zinc-300">{t.common.confirm}</Label>
                <Input
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder={t.common.confirm}
                  className="bg-zinc-800/50 border-zinc-700 text-white"
                />
                <p className="text-xs text-amber-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {t.common.confirm}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => {
                  setEmailDialogOpen(false);
                  setNewEmail("");
                  setVerificationCode("");
                  setCodeSent(false);
                }}
                className="text-zinc-400"
              >
                {t.common.cancel}
              </Button>
              {!codeSent ? (
                <Button
                  onClick={handleSendEmailVerification}
                  className="bg-emerald-600 hover:bg-emerald-500"
                >
                  {t.common.confirm}
                </Button>
              ) : (
                <Button
                  onClick={handleVerifyAndChangeEmail}
                  disabled={verifying}
                  className="bg-emerald-600 hover:bg-emerald-500"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t.common.loading}
                    </>
                  ) : (
                    t.common.confirm
                  )}
                </Button>
              )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Security Settings */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Lock className="h-5 w-5 text-emerald-500" />
            {t.settings.password.title}
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {t.settings.password.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 2FA */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-zinc-300">Autenticação em Dois Fatores</Label>
              <p className="text-xs text-zinc-500">Adicione uma camada extra de segurança</p>
            </div>
            <Switch
              checked={settings.twoFactorEnabled}
              onCheckedChange={(checked) => {
                setSettings({ ...settings, twoFactorEnabled: checked });
                toast.info(checked ? "2FA ativado!" : "2FA desativado!");
              }}
            />
          </div>

          <Separator className="bg-zinc-800" />

          {/* Change Password */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-zinc-300">{t.settings.password.change}</h4>
            <div className="space-y-2">
              <Label className="text-zinc-400">{t.settings.password.current}</Label>
              <Input
                type="password"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                className="bg-zinc-800/50 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">{t.settings.password.new}</Label>
              <Input
                type="password"
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                className="bg-zinc-800/50 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">{t.settings.password.confirm}</Label>
              <Input
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                className="bg-zinc-800/50 border-zinc-700 text-white"
              />
            </div>
            <Button 
              onClick={handleChangePassword}
              disabled={changingPassword}
              variant="outline" 
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              {changingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t.common.loading}
                </>
              ) : (
                t.settings.password.change
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-emerald-500" />
            {t.settings.notifications.title}
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {t.settings.notifications.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-zinc-300">{t.settings.notifications.email}</Label>
              <p className="text-xs text-zinc-500">{t.settings.notifications.emailDesc}</p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="bg-zinc-900/50 border-red-500/30">
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t.settings.danger.title}
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {t.settings.danger.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/5 border border-red-500/20">
            <div>
              <p className="font-medium text-zinc-300">{t.settings.danger.deleteAccount}</p>
              <p className="text-xs text-zinc-500">{t.settings.danger.deleteWarning}</p>
            </div>
            <Button 
              variant="outline" 
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              onClick={handleDeleteAccount}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t.common.delete}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
