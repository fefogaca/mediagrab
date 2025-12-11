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
import { Badge } from "@frontend/components/ui/badge";
import { Progress } from "@frontend/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@frontend/components/ui/dialog";
import { toast } from "sonner";
import {
  Key,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Mail,
  AlertTriangle,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface ApiKey {
  id: string;
  key: string;
  created_at: string;
  expires_at?: string;
  usage_count: number;
  usage_limit: number;
}

interface UserPlan {
  plan: string;
  maxKeys: number;
  requestLimit: number;
  emailVerified: boolean;
}

export default function ApiKeysPage() {
  const { t } = useTranslation();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [emailVerificationDialogOpen, setEmailVerificationDialogOpen] = useState(false);
  const [userPlan, setUserPlan] = useState<UserPlan>({
    plan: 'free',
    maxKeys: 1,
    requestLimit: 5,
    emailVerified: false,
  });

  useEffect(() => {
    fetchApiKeys();
    fetchUserPlan();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch("/api/dashboard/my-api-keys");
      const data = await response.json();
      setApiKeys(data.apiKeys || []);
    } catch (error) {
      console.error("Erro ao buscar API keys:", error);
      toast.error(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPlan = async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();
      if (data.user) {
        const plan = data.user.plan || 'free';
        const limits = {
          free: { maxKeys: 1, requestLimit: 5 },
          developer: { maxKeys: 5, requestLimit: 1000 },
          startup: { maxKeys: 20, requestLimit: 10000 },
          enterprise: { maxKeys: -1, requestLimit: -1 },
        };
        const planLimits = limits[plan as keyof typeof limits] || limits.free;
        setUserPlan({
          plan,
          maxKeys: planLimits.maxKeys,
          requestLimit: planLimits.requestLimit,
          emailVerified: !!data.user.emailVerified,
        });
      }
    } catch (error) {
      console.error("Erro ao buscar plano:", error);
    }
  };

  const createApiKey = async () => {
    setCreating(true);
    try {
      const response = await fetch("/api/dashboard/api-keys", {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Verificar se é erro de verificação de email
        if (data.requiresEmailVerification) {
          setDialogOpen(false);
          setEmailVerificationDialogOpen(true);
          return;
        }
        throw new Error(data.message || "Erro ao criar");
      }

      toast.success(t.apiKeys.created);
      setDialogOpen(false);
      fetchApiKeys();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.common.error);
    } finally {
      setCreating(false);
    }
  };

  const deleteApiKey = async (keyId: string) => {
    if (!confirm(t.apiKeys.deleteConfirm)) return;

    try {
      const response = await fetch(`/api/dashboard/api-keys/${keyId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error(t.common.error);

      toast.success(t.apiKeys.deleted);
      fetchApiKeys();
    } catch {
      toast.error(t.common.error);
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success(t.apiKeys.copied);
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const getUsagePercentage = (usage: number, limit: number) => {
    return Math.min((usage / limit) * 100, 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-zinc-800 rounded w-48 animate-pulse" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-zinc-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.apiKeys.title}</h1>
          <p className="text-zinc-400 mt-1">{t.apiKeys.subtitle}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white">
              <Plus className="h-4 w-4 mr-2" />
              {t.apiKeys.create}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-white">{t.apiKeys.createTitle}</DialogTitle>
              <DialogDescription className="text-zinc-400">
                {t.apiKeys.createDescription}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
                <p className="text-sm text-zinc-400 mb-2">{t.dashboard.currentPlan}: <span className="text-emerald-500 capitalize font-medium">{userPlan.plan}</span></p>
                <ul className="text-sm text-zinc-300 space-y-1">
                  <li>• {t.pricing.features.requests}: <span className="text-white font-medium">{userPlan.requestLimit === -1 ? t.common.unlimited : userPlan.requestLimit}</span></li>
                  <li>• {t.pricing.features.apiKeys}: <span className="text-white font-medium">{userPlan.maxKeys === -1 ? t.common.unlimited : `${userPlan.maxKeys - apiKeys.length} ${t.dashboard.usageOf} ${userPlan.maxKeys}`}</span></li>
                  <li>• {t.apiKeys.deleted}</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-zinc-400">
                {t.common.cancel}
              </Button>
              <Button 
                onClick={createApiKey} 
                disabled={creating}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                {creating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {t.apiKeys.creating}
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    {t.apiKeys.create}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Email Verification Dialog */}
      <Dialog open={emailVerificationDialogOpen} onOpenChange={setEmailVerificationDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Mail className="h-5 w-5 text-amber-500" />
              {t.apiKeys.emailRequired}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {t.apiKeys.emailRequiredDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-200 font-medium">{t.apiKeys.emailRequired}</p>
                  <p className="text-sm text-zinc-400 mt-1">
                    {t.apiKeys.emailRequiredDesc}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEmailVerificationDialogOpen(false)} className="text-zinc-400">
              {t.common.close}
            </Button>
            <Button 
              onClick={() => {
                toast.info(t.common.success);
                // TODO: Implementar reenvio quando SendGrid estiver configurado
              }}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              <Mail className="h-4 w-4 mr-2" />
              {t.common.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <Key className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">{t.apiKeys.table.name}</p>
              <p className="text-xl font-bold text-white">{apiKeys.length} / {userPlan.maxKeys === -1 ? '∞' : userPlan.maxKeys}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <RefreshCw className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">{t.dashboard.stats.requestsUsed}</p>
              <p className="text-xl font-bold text-white">
                {apiKeys.reduce((sum, key) => sum + key.usage_count, 0)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-500/10">
              <Key className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">{t.dashboard.stats.planLimit}</p>
              <p className="text-xl font-bold text-white">{userPlan.requestLimit === -1 ? '∞' : userPlan.requestLimit} req</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="py-12 text-center">
            <Key className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">{t.apiKeys.noKeys}</h3>
            <p className="text-zinc-400 mb-4">{t.apiKeys.createDescription}</p>
            <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-500">
              <Plus className="h-4 w-4 mr-2" />
              {t.apiKeys.create}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((apiKey) => {
            const usagePercentage = getUsagePercentage(apiKey.usage_count, apiKey.usage_limit);
            const isVisible = visibleKeys.has(apiKey.id);
            
            return (
              <Card key={apiKey.id} className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10">
                        <Key className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-base">API Key #{apiKey.id}</CardTitle>
                        <CardDescription className="text-zinc-400">
                          {t.apiKeys.table.created} {new Date(apiKey.created_at).toLocaleDateString("pt-BR")}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {usagePercentage >= 100 ? (
                        <Badge className="bg-red-500/10 text-red-500 border-red-500/30">{t.apiKeys.status.inactive}</Badge>
                      ) : usagePercentage >= 80 ? (
                        <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30">{t.apiKeys.status.inactive}</Badge>
                      ) : (
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">{t.apiKeys.status.active}</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Key Display */}
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={isVisible ? apiKey.key : "•".repeat(32)}
                      className="font-mono text-sm bg-zinc-800/50 border-zinc-700 text-zinc-300"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-zinc-700 text-zinc-400 hover:text-white"
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                    >
                      {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-zinc-700 text-zinc-400 hover:text-white"
                      onClick={() => copyKey(apiKey.key)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-zinc-700 text-red-400 hover:text-red-300 hover:border-red-500/30"
                      onClick={() => deleteApiKey(apiKey.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Usage Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">{t.apiKeys.table.usage}</span>
                      <span className="text-zinc-300">
                        {apiKey.usage_count.toLocaleString()} / {apiKey.usage_limit.toLocaleString()} {t.pricing.features.requests}
                      </span>
                    </div>
                    <Progress value={usagePercentage} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
