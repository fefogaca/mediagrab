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
import { Badge } from "@frontend/components/ui/badge";
import { toast } from "sonner";
import {
  Bell,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  CheckCheck,
  Circle,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  target_audience: string;
  created_at: string;
  isRead: boolean;
  link?: string;
  icon?: string;
  priority?: string;
}

export default function NotificationsPage() {
  const { t, language } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/dashboard/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else {
        toast.error(t.userDashboard.notifications.errorLoading);
      }
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
      toast.error(t.userDashboard.notifications.errorLoading);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string, currentStatus: boolean) => {
    try {
      const response = await fetch("/api/dashboard/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationId,
          markAsRead: !currentStatus,
        }),
      });

      if (!response.ok) throw new Error("Erro ao atualizar");

      if (!currentStatus) {
        toast.success(t.userDashboard.notifications.notificationRead);
      } else {
        toast.success(t.userDashboard.notifications.notificationUnread);
      }

      // Atualizar estado local
      setNotifications(notifications.map(n => 
        n.id === notificationId 
          ? { ...n, isRead: !currentStatus }
          : n
      ));
    } catch (error) {
      console.error("Erro ao marcar notificação:", error);
      toast.error(t.userDashboard.notifications.errorUpdating);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.isRead);
    
    if (unreadNotifications.length === 0) {
      return;
    }

    try {
      // Marcar todas como lidas
      await Promise.all(
        unreadNotifications.map(n =>
          fetch("/api/dashboard/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              notificationId: n.id,
              markAsRead: true,
            }),
          })
        )
      );

      toast.success(t.userDashboard.notifications.allRead);
      
      // Atualizar estado local
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
      toast.error(t.userDashboard.notifications.errorUpdating);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
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

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
          <h1 className="text-2xl font-bold text-white">{t.userDashboard.notifications.title}</h1>
          <p className="text-zinc-400 mt-1">{t.userDashboard.notifications.subtitle}</p>
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={markAllAsRead}
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            {t.userDashboard.notifications.markAllAsRead}
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <Bell className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">{t.userDashboard.notifications.total}</p>
              <p className="text-xl font-bold text-white">{notifications.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-500/10">
              <Circle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">{t.userDashboard.notifications.unreadCount}</p>
              <p className="text-xl font-bold text-white">{unreadCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">{t.userDashboard.notifications.title}</CardTitle>
          <CardDescription className="text-zinc-400">
            {notifications.length} {notifications.length === 1 ? 'notificação' : 'notificações'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">{t.userDashboard.notifications.noNotifications}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    flex items-start gap-4 p-4 rounded-lg transition-colors
                    ${notification.isRead 
                      ? 'bg-zinc-800/30 opacity-75' 
                      : 'bg-zinc-800/50 border border-emerald-500/20'
                    }
                    hover:bg-zinc-800
                  `}
                >
                  <div className={`p-2 rounded-lg ${notification.isRead ? 'bg-zinc-700' : 'bg-zinc-700'}`}>
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-medium ${notification.isRead ? 'text-zinc-400' : 'text-white'}`}>
                        {notification.title}
                      </h3>
                      {getTypeBadge(notification.type)}
                      {!notification.isRead && (
                        <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 text-xs">
                          {t.userDashboard.notifications.unread}
                        </Badge>
                      )}
                    </div>
                    <p className={`text-sm mb-2 ${notification.isRead ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-4">
                      <p className="text-xs text-zinc-500">
                        {new Date(notification.created_at).toLocaleString(
                          language === 'pt' ? 'pt-BR' : 'en-US'
                        )}
                      </p>
                      {notification.link && (
                        <a
                          href={notification.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-500 hover:text-emerald-400"
                        >
                          Ver mais →
                        </a>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`${
                      notification.isRead
                        ? 'text-zinc-500 hover:text-emerald-400'
                        : 'text-emerald-500 hover:text-emerald-400'
                    }`}
                    onClick={() => markAsRead(notification.id, notification.isRead)}
                    title={notification.isRead ? t.userDashboard.notifications.markAsUnread : t.userDashboard.notifications.markAsRead}
                  >
                    {notification.isRead ? (
                      <Circle className="h-4 w-4" />
                    ) : (
                      <CheckCheck className="h-4 w-4" />
                    )}
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

