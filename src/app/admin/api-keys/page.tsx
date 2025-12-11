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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@frontend/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@frontend/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@frontend/components/ui/dialog";
import { toast } from "sonner";
import {
  Search,
  MoreHorizontal,
  Key,
  Copy,
  Trash2,
  RefreshCw,
  Activity,
  Ban,
  CheckCircle,
  XCircle,
  Eye,
  Mail,
  Plus,
  User,
} from "lucide-react";
import { Label } from "@frontend/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@frontend/components/ui/select";
import { useTranslation } from "@/lib/i18n";

interface ApiKey {
  id: string;
  key: string;
  name: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    plan: string;
    role?: string;
  };
  isActive: boolean;
  usageCount: number;
  usageLimit: number;
  createdAt: string;
  lastUsedAt?: string | null;
  expiresAt?: string | null;
}

interface UserOption {
  id: string;
  _id?: string; // Para compatibilidade
  name: string;
  email: string;
}

export default function AdminApiKeysPage() {
  const { t, language } = useTranslation();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Create API Key states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [newKeyData, setNewKeyData] = useState({
    name: "",
    userId: "",
    usageLimit: 1000,
  });

  useEffect(() => {
    fetchApiKeys();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();
      // A API retorna 'id', não '_id'
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error(language === 'pt' ? 'Erro ao carregar usuários' : 'Error loading users');
    }
  };

  const createApiKey = async () => {
    if (!newKeyData.name || !newKeyData.userId) {
      toast.error(language === 'pt' ? 'Preencha todos os campos obrigatórios' : 'Fill in all required fields');
      return;
    }

    if (!newKeyData.userId || newKeyData.userId.trim() === '') {
      toast.error(language === 'pt' ? 'Selecione um usuário' : 'Please select a user');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyData.name.trim(),
          userId: newKeyData.userId,
          usageLimit: newKeyData.usageLimit || 1000,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Error creating API key");
      }

      toast.success(language === 'pt' ? 'API Key criada com sucesso!' : 'API Key created successfully!');
      setShowCreateDialog(false);
      setNewKeyData({ name: "", userId: "", usageLimit: 1000 });
      fetchApiKeys();
    } catch (error) {
      console.error('Error creating API key:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : (language === 'pt' ? 'Erro ao criar API Key' : 'Error creating API Key');
      toast.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const fetchApiKeys = async () => {
    try {
      const response = await fetch("/api/admin/api-keys");
      const data = await response.json();
      setApiKeys(data.apiKeys || []);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      toast.error(t.admin.apiKeys.errorLoading);
    } finally {
      setLoading(false);
    }
  };

  const toggleKeyStatus = async (keyId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/api-keys/${keyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      
      if (!response.ok) throw new Error("Error updating");
      
      toast.success(
        !currentStatus ? t.admin.apiKeys.keyActivated : t.admin.apiKeys.keyDeactivated
      );
      fetchApiKeys();
    } catch {
      toast.error(t.admin.apiKeys.errorUpdating);
    }
  };

  const deleteApiKey = async (keyId: string) => {
    if (!confirm(t.admin.apiKeys.deleteConfirm)) return;
    
    try {
      const response = await fetch(`/api/admin/api-keys/${keyId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) throw new Error("Error deleting");
      
      toast.success(t.admin.apiKeys.keyDeleted);
      fetchApiKeys();
    } catch {
      toast.error(t.admin.apiKeys.errorDeleting);
    }
  };

  const resetUsage = async (keyId: string) => {
    try {
      const response = await fetch(`/api/admin/api-keys/${keyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usageCount: 0 }),
      });
      
      if (!response.ok) throw new Error("Error resetting");
      
      toast.success(t.admin.apiKeys.usageReset);
      fetchApiKeys();
    } catch {
      toast.error(t.admin.apiKeys.errorResetting);
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success(t.admin.apiKeys.keyCopied);
  };

  const filteredKeys = apiKeys.filter(key =>
    key.key.toLowerCase().includes(search.toLowerCase()) ||
    key.name?.toLowerCase().includes(search.toLowerCase()) ||
    key.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    key.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getUsagePercentage = (usage: number, limit: number) => {
    return Math.min((usage / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const activeKeys = apiKeys.filter(k => k.isActive).length;
  const totalUsage = apiKeys.reduce((sum, key) => sum + key.usageCount, 0);
  const keysAtLimit = apiKeys.filter(k => k.usageCount >= k.usageLimit).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-zinc-800 rounded w-48 animate-pulse" />
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-zinc-800 rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.admin.apiKeys.title}</h1>
          <p className="text-zinc-400 mt-1">{t.admin.apiKeys.subtitle}</p>
        </div>
        <Button 
          onClick={() => setShowCreateDialog(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          {language === 'pt' ? 'Criar API Key' : 'Create API Key'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <Key className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">{t.admin.apiKeys.stats.totalKeys}</p>
              <p className="text-xl font-bold text-white">{apiKeys.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500/10">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">{t.admin.apiKeys.stats.activeKeys}</p>
              <p className="text-xl font-bold text-white">{activeKeys}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Activity className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">{t.admin.apiKeys.stats.totalRequests}</p>
              <p className="text-xl font-bold text-white">{totalUsage.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-500/10">
              <Ban className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">{t.admin.apiKeys.stats.keysAtLimit}</p>
              <p className="text-xl font-bold text-white">{keysAtLimit}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Keys Table */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-white">
                {t.admin.apiKeys.table.listTitle}
              </CardTitle>
              <CardDescription className="text-zinc-400">
                {filteredKeys.length} {t.admin.apiKeys.table.keysFound}
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder={t.admin.apiKeys.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">{t.admin.apiKeys.table.name}</TableHead>
                  <TableHead className="text-zinc-400">{t.admin.apiKeys.table.key}</TableHead>
                  <TableHead className="text-zinc-400">{t.admin.apiKeys.table.user}</TableHead>
                  <TableHead className="text-zinc-400">{t.admin.apiKeys.table.usage}</TableHead>
                  <TableHead className="text-zinc-400">{t.admin.apiKeys.table.status}</TableHead>
                  <TableHead className="text-zinc-400">{t.admin.apiKeys.table.lastUsed}</TableHead>
                  <TableHead className="text-zinc-400 text-right">{t.admin.apiKeys.table.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKeys.length === 0 ? (
                  <TableRow key="no-keys">
                    <TableCell colSpan={7} className="text-center text-zinc-500 py-8">
                      {t.admin.apiKeys.noKeys}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredKeys.map((apiKey) => {
                    const usagePercentage = getUsagePercentage(apiKey.usageCount, apiKey.usageLimit);
                    return (
                      <TableRow key={apiKey.id} className="border-zinc-800 hover:bg-zinc-800/30">
                        <TableCell className="text-white font-medium">
                          {apiKey.name || "Unnamed"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-sm text-zinc-300 bg-zinc-800 px-2 py-1 rounded font-mono">
                              {apiKey.key.substring(0, 8)}...{apiKey.key.substring(apiKey.key.length - 4)}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-zinc-400 hover:text-white"
                              onClick={() => copyKey(apiKey.key)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-zinc-300">{apiKey.user?.name || "Unknown"}</p>
                            <p className="text-xs text-zinc-500">{apiKey.user?.email || ""}</p>
                            <Badge className="mt-1 capitalize" variant="outline">
                              {apiKey.user?.plan || "free"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 w-32">
                            <div className="flex justify-between text-xs">
                              <span className="text-zinc-400">{apiKey.usageCount}</span>
                              <span className="text-zinc-500">/ {apiKey.usageLimit}</span>
                            </div>
                            <Progress 
                              value={usagePercentage} 
                              className={`h-1.5 ${getUsageColor(usagePercentage)}`}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          {!apiKey.isActive ? (
                            <Badge className="bg-red-500/10 text-red-500 border-red-500/30">
                              <XCircle className="h-3 w-3 mr-1" />
                              {t.admin.apiKeys.status.inactive}
                            </Badge>
                          ) : usagePercentage >= 100 ? (
                            <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                              <Ban className="h-3 w-3 mr-1" />
                              {t.admin.apiKeys.status.exhausted}
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {t.admin.apiKeys.status.active}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-zinc-400 text-sm">
                          {apiKey.lastUsedAt 
                            ? new Date(apiKey.lastUsedAt).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US')
                            : t.admin.apiKeys.never}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                              <DropdownMenuItem 
                                className="text-zinc-300 focus:bg-zinc-800 focus:text-white cursor-pointer"
                                onClick={() => {
                                  setSelectedKey(apiKey);
                                  setShowDetails(true);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                {t.admin.apiKeys.actions.viewDetails}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-zinc-300 focus:bg-zinc-800 focus:text-white cursor-pointer"
                                onClick={() => copyKey(apiKey.key)}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                {t.admin.apiKeys.actions.copyKey}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-zinc-300 focus:bg-zinc-800 focus:text-white cursor-pointer"
                                onClick={() => resetUsage(apiKey.id)}
                              >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                {t.admin.apiKeys.actions.resetUsage}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className={`cursor-pointer ${apiKey.isActive ? 'text-amber-400 focus:bg-amber-500/10' : 'text-green-400 focus:bg-green-500/10'}`}
                                onClick={() => toggleKeyStatus(apiKey.id, apiKey.isActive)}
                              >
                                {apiKey.isActive ? (
                                  <>
                                    <Ban className="mr-2 h-4 w-4" />
                                    {t.admin.apiKeys.actions.revoke}
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    {t.admin.apiKeys.actions.activate}
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
                                onClick={() => deleteApiKey(apiKey.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t.admin.apiKeys.actions.delete}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Key className="h-5 w-5 text-emerald-500" />
              {t.admin.apiKeys.details.title}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {selectedKey?.name || "Unnamed Key"}
            </DialogDescription>
          </DialogHeader>
          
          {selectedKey && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-zinc-500">{t.admin.apiKeys.details.owner}</p>
                  <p className="text-white">{selectedKey.user?.name || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">{t.common.email}</p>
                  <p className="text-white flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {selectedKey.user?.email || ""}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">{t.admin.apiKeys.details.plan}</p>
                  <Badge className="capitalize">{selectedKey.user?.plan || "free"}</Badge>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">{t.common.status}</p>
                  <Badge className={selectedKey.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}>
                    {selectedKey.isActive ? t.admin.apiKeys.status.active : t.admin.apiKeys.status.inactive}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">{t.admin.apiKeys.details.usage}</p>
                  <p className="text-white">{selectedKey.usageCount} / {selectedKey.usageLimit}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">{t.admin.apiKeys.details.created}</p>
                  <p className="text-white">{new Date(selectedKey.createdAt).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US')}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-zinc-500 mb-2">API Key</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm text-zinc-300 bg-zinc-800 px-3 py-2 rounded font-mono break-all">
                    {selectedKey.key}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => copyKey(selectedKey.key)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create API Key Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-500" />
              {language === 'pt' ? 'Criar Nova API Key' : 'Create New API Key'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {language === 'pt' 
                ? 'Crie uma nova API Key para um usuário do sistema.'
                : 'Create a new API Key for a system user.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">
                {language === 'pt' ? 'Nome da Key' : 'Key Name'} *
              </Label>
              <Input
                placeholder={language === 'pt' ? 'Ex: Chave de Produção' : 'Ex: Production Key'}
                value={newKeyData.name}
                onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
                className="bg-zinc-800/50 border-zinc-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">
                {language === 'pt' ? 'Usuário' : 'User'} *
              </Label>
              <Select
                value={newKeyData.userId}
                onValueChange={(value) => setNewKeyData({ ...newKeyData, userId: value })}
              >
                <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
                  <SelectValue placeholder={language === 'pt' ? 'Selecione um usuário' : 'Select a user'} />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {users.map((user) => {
                    const userId = user.id || user._id || ''; // Compatibilidade com ambos os formatos
                    if (!userId) return null; // Pular se não tiver ID válido
                    return (
                      <SelectItem 
                        key={userId} 
                        value={userId}
                        className="text-zinc-300 focus:bg-zinc-800 focus:text-white"
                      >
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{user.name}</span>
                          <span className="text-zinc-500 text-xs">({user.email})</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">
                {language === 'pt' ? 'Limite de Uso' : 'Usage Limit'}
              </Label>
              <Input
                type="number"
                min={1}
                value={newKeyData.usageLimit}
                onChange={(e) => setNewKeyData({ ...newKeyData, usageLimit: parseInt(e.target.value) || 1000 })}
                className="bg-zinc-800/50 border-zinc-700 text-white"
              />
              <p className="text-xs text-zinc-500">
                {language === 'pt' 
                  ? 'Número máximo de requisições permitidas'
                  : 'Maximum number of allowed requests'}
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                onClick={() => setShowCreateDialog(false)}
                disabled={creating}
              >
                {language === 'pt' ? 'Cancelar' : 'Cancel'}
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                onClick={createApiKey}
                disabled={creating}
              >
                {creating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {language === 'pt' ? 'Criando...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    {language === 'pt' ? 'Criar Key' : 'Create Key'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
