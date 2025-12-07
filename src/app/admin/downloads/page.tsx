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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@frontend/components/ui/table";
import { toast } from "sonner";
import {
  Search,
  Download,
  Play,
  Music,
  ExternalLink,
  Youtube,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface DownloadLog {
  id: number;
  user_id: number;
  username?: string;
  api_key_id: number;
  url: string;
  downloaded_at: string;
}

export default function DownloadsPage() {
  const { t, language } = useTranslation();
  const [downloads, setDownloads] = useState<DownloadLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchDownloads();
  }, []);

  const fetchDownloads = async () => {
    try {
      const response = await fetch("/api/admin/stats/recent-downloads");
      const data = await response.json();
      setDownloads(data.downloads || []);
    } catch (error) {
      console.error("Erro ao buscar downloads:", error);
      toast.error(t.admin.downloads.errorLoading);
    } finally {
      setLoading(false);
    }
  };

  const filteredDownloads = downloads.filter(dl =>
    dl.url.toLowerCase().includes(search.toLowerCase()) ||
    dl.username?.toLowerCase().includes(search.toLowerCase())
  );

  const getPlatformIcon = (url: string) => {
    if (url.includes("youtube") || url.includes("youtu.be")) {
      return <Youtube className="h-4 w-4 text-red-500" />;
    }
    if (url.includes("instagram")) {
      return <Play className="h-4 w-4 text-pink-500" />;
    }
    if (url.includes("tiktok")) {
      return <Music className="h-4 w-4 text-cyan-500" />;
    }
    return <Download className="h-4 w-4 text-zinc-500" />;
  };

  const getPlatformName = (url: string) => {
    if (url.includes("youtube") || url.includes("youtu.be")) return t.admin.downloads.platform.youtube;
    if (url.includes("instagram")) return t.admin.downloads.platform.instagram;
    if (url.includes("tiktok")) return t.admin.downloads.platform.tiktok;
    if (url.includes("twitter") || url.includes("x.com")) return t.admin.downloads.platform.twitter;
    return t.admin.downloads.platform.other;
  };

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
      <div>
        <h1 className="text-2xl font-bold text-white">{t.admin.downloads.title}</h1>
        <p className="text-zinc-400 mt-1">{t.admin.downloads.subtitle}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <Download className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">{t.common.name}</p>
              <p className="text-xl font-bold text-white">{downloads.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-red-500/10">
              <Youtube className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">{t.admin.downloads.platform.youtube}</p>
              <p className="text-xl font-bold text-white">
                {downloads.filter(d => d.url.includes("youtube") || d.url.includes("youtu.be")).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-pink-500/10">
              <Play className="h-5 w-5 text-pink-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">{t.admin.downloads.platform.instagram}</p>
              <p className="text-xl font-bold text-white">
                {downloads.filter(d => d.url.includes("instagram")).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-cyan-500/10">
              <Music className="h-5 w-5 text-cyan-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">{t.admin.downloads.platform.tiktok}</p>
              <p className="text-xl font-bold text-white">
                {downloads.filter(d => d.url.includes("tiktok")).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Downloads Table */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-white">{t.admin.downloads.title}</CardTitle>
              <CardDescription className="text-zinc-400">
                {filteredDownloads.length} {t.admin.downloads.table.downloadsFound}
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder={t.admin.downloads.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">{t.admin.downloads.table.platform}</TableHead>
                <TableHead className="text-zinc-400">{t.admin.downloads.table.url}</TableHead>
                <TableHead className="text-zinc-400">{t.admin.downloads.table.user}</TableHead>
                <TableHead className="text-zinc-400">{t.admin.downloads.table.date}</TableHead>
                <TableHead className="text-zinc-400 text-right">{t.common.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDownloads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-zinc-500 py-8">
                    {t.admin.downloads.table.noDownloads}
                  </TableCell>
                </TableRow>
              ) : (
                filteredDownloads.map((download) => (
                  <TableRow key={download.id} className="border-zinc-800 hover:bg-zinc-800/30">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(download.url)}
                        <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                          {getPlatformName(download.url)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md truncate text-zinc-300 font-mono text-sm">
                        {download.url}
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {download.username || `${t.admin.downloads.table.user} #${download.user_id}`}
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {new Date(download.downloaded_at).toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-zinc-400 hover:text-white"
                        onClick={() => window.open(download.url, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

