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
import { Badge } from "@frontend/components/ui/badge";
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
import { toast } from "sonner";
import {
  Search,
  MoreHorizontal,
  Bot,
  Calendar,
  User,
  Phone,
  Package,
  TrendingUp,
  Loader2,
  Filter,
  X,
  RefreshCw,
  Bell,
  BellOff,
  MessageCircle,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface Installation {
  id: string;
  bot_phone: string;
  developer_name: string;
  developer_phone: string | null;
  installation_date: string;
  bot_name: string;
  version: string;
  created_at: string;
  updated_at: string;
}

interface Stats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  uniqueDevelopers: number;
  lastInstallation: string | null;
}

function formatPhone(phone: string | null): string {
  if (!phone) return '-';
  // Formatar número de telefone (ex: 5511941212232 -> +55 11 94121-2232)
  if (phone.length >= 10) {
    const country = phone.substring(0, 2);
    const area = phone.substring(2, 4);
    const rest = phone.substring(4);
    if (rest.length >= 8) {
      const part1 = rest.substring(0, rest.length - 4);
      const part2 = rest.substring(rest.length - 4);
      return `+${country} ${area} ${part1}-${part2}`;
    }
  }
  return phone;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function InstallationsPage() {
  const { t, language } = useTranslation();
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [developerFilter, setDeveloperFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lastInstallationId, setLastInstallationId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    uniqueDevelopers: 0,
    lastInstallation: null,
  });

  useEffect(() => {
    fetchInstallations();
    calculateStats();
  }, [page, search, developerFilter, dateFrom, dateTo]);

  // Polling para atualização em tempo real (apenas quando não há filtros ativos)
  useEffect(() => {
    if (!autoRefresh || search || developerFilter || dateFrom || dateTo) return;

    const interval = setInterval(() => {
      checkForNewInstallations();
    }, 5000); // Verifica a cada 5 segundos

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, search, developerFilter, dateFrom, dateTo]);

  const fetchInstallations = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (search) params.append('search', search);
      if (developerFilter) params.append('developer', developerFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const response = await fetch(`/api/admin/installations?${params}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error fetching installations');
      }

      const newInstallations = data.data || [];
      
      // Verificar se há novas instalações
      if (silent && lastInstallationId && newInstallations.length > 0) {
        const latestId = newInstallations[0].id;
        if (latestId !== lastInstallationId) {
          // Nova instalação detectada!
          const newInstallation = newInstallations.find((inst: Installation) => inst.id === latestId);
          if (newInstallation) {
            toast.success(
              language === 'pt' 
                ? `Nova instalação detectada: ${newInstallation.developer_name}`
                : `New installation detected: ${newInstallation.developer_name}`,
              {
                description: language === 'pt'
                  ? `Bot: ${formatPhone(newInstallation.bot_phone)}`
                  : `Bot: ${formatPhone(newInstallation.bot_phone)}`,
                duration: 5000,
              }
            );
            setLastInstallationId(latestId);
          }
        }
      } else if (newInstallations.length > 0 && !lastInstallationId) {
        // Primeira carga - definir o ID da última instalação
        setLastInstallationId(newInstallations[0].id);
      }

      setInstallations(newInstallations);
      setTotalPages(data.pagination?.total_pages || 1);
    } catch (error) {
      console.error("Error fetching installations:", error);
      if (!silent) {
        toast.error(t.admin.installations.errorLoading);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const checkForNewInstallations = async () => {
    // Buscar apenas a primeira página para verificar novas instalações
    const params = new URLSearchParams({
      page: '1',
      limit: '1',
    });

    try {
      const response = await fetch(`/api/admin/installations?${params}`);
      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        const latest = data.data[0];
        if (lastInstallationId && latest.id !== lastInstallationId) {
          // Nova instalação detectada - recarregar lista completa
          await fetchInstallations(true);
          // Atualizar stats também
          calculateStats();
        }
      }
    } catch (error) {
      console.error("Error checking for new installations:", error);
    }
  };

  const calculateStats = async () => {
    try {
      // Buscar todas as instalações para calcular estatísticas
      const response = await fetch('/api/admin/installations?limit=1000');
      const data = await response.json();

      if (!data.success || !data.data) return;

      const allInstallations = data.data;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      const statsData: Stats = {
        total: allInstallations.length,
        today: allInstallations.filter((inst: Installation) => {
          const instDate = new Date(inst.installation_date);
          return instDate >= today;
        }).length,
        thisWeek: allInstallations.filter((inst: Installation) => {
          const instDate = new Date(inst.installation_date);
          return instDate >= weekAgo;
        }).length,
        thisMonth: allInstallations.filter((inst: Installation) => {
          const instDate = new Date(inst.installation_date);
          return instDate >= monthAgo;
        }).length,
        uniqueDevelopers: new Set(allInstallations.map((inst: Installation) => inst.developer_name)).size,
        lastInstallation: allInstallations.length > 0 ? allInstallations[0].installation_date : null,
      };

      setStats(statsData);
    } catch (error) {
      console.error("Error calculating stats:", error);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setDeveloperFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const hasFilters = search || developerFilter || dateFrom || dateTo;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{t.admin.installations.title}</h1>
          <p className="text-zinc-400 mt-1">{t.admin.installations.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAutoRefresh(!autoRefresh);
              toast.info(
                autoRefresh 
                  ? (language === 'pt' ? 'Atualização automática desativada' : 'Auto-refresh disabled')
                  : (language === 'pt' ? 'Atualização automática ativada' : 'Auto-refresh enabled')
              );
            }}
            className="text-zinc-400 border-zinc-700 hover:bg-zinc-800"
          >
            {autoRefresh ? (
              <>
                <BellOff className="h-4 w-4 mr-2" />
                {language === 'pt' ? 'Desativar Auto' : 'Disable Auto'}
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 mr-2" />
                {language === 'pt' ? 'Ativar Auto' : 'Enable Auto'}
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchInstallations();
              calculateStats();
              toast.success(language === 'pt' ? 'Lista atualizada!' : 'List updated!');
            }}
            className="text-zinc-400 border-zinc-700 hover:bg-zinc-800"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {language === 'pt' ? 'Atualizar' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <Bot className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">{t.admin.installations.stats.totalInstallations}</p>
              <p className="text-xl font-bold text-white">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">{t.admin.installations.stats.installationsToday}</p>
              <p className="text-xl font-bold text-white">{stats.today}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-500/10">
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">{t.admin.installations.stats.installationsThisWeek}</p>
              <p className="text-xl font-bold text-white">{stats.thisWeek}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-orange-500/10">
              <Calendar className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">{t.admin.installations.stats.installationsThisMonth}</p>
              <p className="text-xl font-bold text-white">{stats.thisMonth}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-cyan-500/10">
              <User className="h-5 w-5 text-cyan-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">{t.admin.installations.stats.uniqueDevelopers}</p>
              <p className="text-xl font-bold text-white">{stats.uniqueDevelopers}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-pink-500/10">
              <Package className="h-5 w-5 text-pink-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">{t.admin.installations.stats.lastInstallation}</p>
              <p className="text-sm font-bold text-white">
                {stats.lastInstallation ? formatDate(stats.lastInstallation) : '-'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t.admin.installations.filters.search}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label className="text-zinc-400">{t.admin.installations.filters.search}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder={t.admin.installations.searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-400">{t.admin.installations.filters.developer}</Label>
              <Input
                placeholder="Nome do desenvolvedor"
                value={developerFilter}
                onChange={(e) => setDeveloperFilter(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-400">{t.admin.installations.filters.dateFrom}</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-400">{t.admin.installations.filters.dateTo}</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>

          {hasFilters && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-zinc-400 border-zinc-700 hover:bg-zinc-800"
              >
                <X className="h-4 w-4 mr-2" />
                {t.admin.installations.filters.clearFilters}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Installations Table */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">{t.admin.installations.table.botPhone}</CardTitle>
          <CardDescription className="text-zinc-400">
            {installations.length} {t.admin.installations.table.installationsFound}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : installations.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">{t.admin.installations.table.noInstallations}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                      <TableHead className="text-zinc-400">{t.admin.installations.table.botPhone}</TableHead>
                      <TableHead className="text-zinc-400">{t.admin.installations.table.developerName}</TableHead>
                      <TableHead className="text-zinc-400">{t.admin.installations.table.developerPhone}</TableHead>
                      <TableHead className="text-zinc-400">{t.admin.installations.table.installationDate}</TableHead>
                      <TableHead className="text-zinc-400">{t.admin.installations.table.botName}</TableHead>
                      <TableHead className="text-zinc-400">{t.admin.installations.table.version}</TableHead>
                      <TableHead className="text-zinc-400">{t.admin.installations.table.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {installations.map((installation) => (
                      <TableRow key={installation.id} className="border-zinc-800 hover:bg-zinc-800/50">
                        <TableCell className="text-white font-mono text-sm">
                          {formatPhone(installation.bot_phone)}
                        </TableCell>
                        <TableCell className="text-white">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-zinc-400" />
                            {installation.developer_name}
                          </div>
                        </TableCell>
                        <TableCell className="text-zinc-400 font-mono text-sm">
                          {formatPhone(installation.developer_phone)}
                        </TableCell>
                        <TableCell className="text-zinc-400">
                          {formatDate(installation.installation_date)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
                            {installation.bot_name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                            v{installation.version}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-zinc-400">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                              <DropdownMenuItem
                                onClick={() => {
                                  const whatsappUrl = `https://wa.me/+${installation.bot_phone}`;
                                  window.open(whatsappUrl, '_blank');
                                }}
                                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                              >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                {language === 'pt' ? 'Chat' : 'Chat'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  navigator.clipboard.writeText(installation.bot_phone);
                                  toast.success(language === 'pt' ? 'Número copiado!' : 'Phone number copied!');
                                }}
                                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                              >
                                <Phone className="h-4 w-4 mr-2" />
                                {language === 'pt' ? 'Copiar Número' : 'Copy Phone'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-zinc-400">
                    {language === 'pt' 
                      ? `Página ${page} de ${totalPages}`
                      : `Page ${page} of ${totalPages}`
                    }
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="text-zinc-400 border-zinc-700 hover:bg-zinc-800"
                    >
                      {language === 'pt' ? 'Anterior' : 'Previous'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="text-zinc-400 border-zinc-700 hover:bg-zinc-800"
                    >
                      {language === 'pt' ? 'Próxima' : 'Next'}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

