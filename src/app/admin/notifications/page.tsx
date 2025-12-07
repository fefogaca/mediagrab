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
import { Textarea } from "@frontend/components/ui/textarea";
import { Badge } from "@frontend/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@frontend/components/ui/select";
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
  Bell,
  Plus,
  Send,
  Trash2,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  target_audience: string;
  created_at: string;
}

export default function NotificationsPage() {
  const { t, language } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    type: "info",
    target_audience: "all",
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/admin/notifications");
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
    } finally {
      setLoading(false);
    }
  };

  const createNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      toast.error(t.admin.notifications.fillAllFields);
      return;
    }

    try {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNotification),
      });

      if (!response.ok) throw new Error("Erro ao criar");

      toast.success(t.admin.notifications.created);
      setDialogOpen(false);
      setNewNotification({ title: "", message: "", type: "info", target_audience: "all" });
      fetchNotifications();
    } catch {
      toast.error(t.admin.notifications.errorCreating);
    }
  };

  const deleteNotification = async (id: number) => {
    if (!confirm(t.common.delete + "?")) return;

    try {
      const response = await fetch(`/api/admin/notifications/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao excluir");

      toast.success(t.admin.notifications.deleteAll.replace('todas', ''));
      fetchNotifications();
    } catch {
      toast.error(t.admin.notifications.errorCreating);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "success":
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">{t.admin.notifications.types.success}</Badge>;
      case "warning":
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30">{t.admin.notifications.types.warning}</Badge>;
      case "error":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/30">{t.admin.notifications.types.error}</Badge>;
      default:
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30">{t.admin.notifications.types.info}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-zinc-800 rounded w-48 animate-pulse" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-zinc-800 rounded animate-pulse" />
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
          <h1 className="text-2xl font-bold text-white">{t.admin.notifications.title}</h1>
          <p className="text-zinc-400 mt-1">{t.admin.notifications.subtitle}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white">
              <Plus className="h-4 w-4 mr-2" />
              {t.admin.notifications.create}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-white">{t.admin.notifications.create}</DialogTitle>
              <DialogDescription className="text-zinc-400">
                {t.admin.notifications.subtitle}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">{t.admin.notifications.form.title}</Label>
                <Input
                  placeholder={t.admin.notifications.form.title}
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                  className="bg-zinc-800/50 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">{t.admin.notifications.form.message}</Label>
                <Textarea
                  placeholder={t.admin.notifications.form.message}
                  value={newNotification.message}
                  onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                  className="bg-zinc-800/50 border-zinc-700 text-white min-h-[100px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">{t.admin.notifications.form.type}</Label>
                  <Select
                    value={newNotification.type}
                    onValueChange={(value) => setNewNotification({ ...newNotification, type: value })}
                  >
                    <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      <SelectItem value="info">{t.admin.notifications.types.info}</SelectItem>
                      <SelectItem value="success">{t.admin.notifications.types.success}</SelectItem>
                      <SelectItem value="warning">{t.admin.notifications.types.warning}</SelectItem>
                      <SelectItem value="error">{t.admin.notifications.types.error}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">{t.admin.notifications.form.targetAudience}</Label>
                  <Select
                    value={newNotification.target_audience}
                    onValueChange={(value) => setNewNotification({ ...newNotification, target_audience: value })}
                  >
                    <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      <SelectItem value="all">{t.admin.notifications.targetAudience.all}</SelectItem>
                      <SelectItem value="free">{t.admin.notifications.targetAudience.free}</SelectItem>
                      <SelectItem value="developer">{t.admin.notifications.targetAudience.developer}</SelectItem>
                      <SelectItem value="startup">{t.admin.notifications.targetAudience.startup}</SelectItem>
                      <SelectItem value="enterprise">{t.admin.notifications.targetAudience.enterprise}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-zinc-400">
                {t.common.cancel}
              </Button>
              <Button onClick={createNotification} className="bg-emerald-600 hover:bg-emerald-500">
                <Send className="h-4 w-4 mr-2" />
                {t.admin.notifications.form.send}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <Bell className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">{t.admin.notifications.totalNotifications}</p>
              <p className="text-xl font-bold text-white">{notifications.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Info className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">{t.admin.notifications.sent}</p>
              <p className="text-xl font-bold text-white">
                {notifications.filter(n => n.type === "info").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">{t.admin.notifications.unread}</p>
              <p className="text-xl font-bold text-white">
                {notifications.filter(n => n.type === "warning").length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">{t.admin.notifications.table.listTitle}</CardTitle>
          <CardDescription className="text-zinc-400">
            {notifications.length} {t.admin.notifications.table.notificationsFound}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">{t.admin.notifications.noNotifications}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start gap-4 p-4 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-zinc-700">
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-white">{notification.title}</h3>
                      {getTypeBadge(notification.type)}
                    </div>
                    <p className="text-sm text-zinc-400 mb-2">{notification.message}</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(notification.created_at).toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US')} • 
                      {t.admin.notifications.targetAudience.all}: {notification.target_audience === "all" ? t.admin.notifications.targetAudience.all : notification.target_audience}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-zinc-400 hover:text-red-400"
                    onClick={() => deleteNotification(notification.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
