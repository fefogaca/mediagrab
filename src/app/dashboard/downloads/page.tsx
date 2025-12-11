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
import { toast } from "sonner";
import {
  Search,
  Download,
  ExternalLink,
  Youtube,
  Music,
  Play,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface DownloadLog {
  id: number;
  url: string;
  downloaded_at: string;
}

export default function DownloadsPage() {
  const { t } = useTranslation();
  const [downloads, setDownloads] = useState<DownloadLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchDownloads();
  }, []);

  const fetchDownloads = async () => {
    try {
      const response = await fetch("/api/dashboard/my-recent-downloads");
      const data = await response.json();
      setDownloads(data.downloads || []);
    } catch (error) {
      console.error("Erro ao buscar downloads:", error);
      toast.error(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDownloads = downloads.filter(dl =>
    dl.url.toLowerCase().includes(search.toLowerCase())
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
    if (url.includes("youtube") || url.includes("youtu.be")) return "YouTube";
    if (url.includes("instagram")) return "Instagram";
    if (url.includes("tiktok")) return "TikTok";
    if (url.includes("twitter") || url.includes("x.com")) return "Twitter/X";
    return "Outro";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-zinc-800 rounded w-48 animate-pulse" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-zinc-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">{t.dashboard.downloads}</h1>
        <p className="text-zinc-400 mt-1">{t.dashboard.recentDownloads}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <Download className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">{t.dashboard.stats.totalDownloads}</p>
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
              <p className="text-sm text-zinc-400">YouTube</p>
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
              <p className="text-sm text-zinc-400">Instagram</p>
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
              <p className="text-sm text-zinc-400">TikTok</p>
              <p className="text-xl font-bold text-white">
                {downloads.filter(d => d.url.includes("tiktok")).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Downloads List */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-white">{t.dashboard.recentDownloads}</CardTitle>
              <CardDescription className="text-zinc-400">
                {filteredDownloads.length} {t.dashboard.downloads}
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder={t.common.search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDownloads.length === 0 ? (
            <div className="text-center py-12">
              <Download className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">{t.dashboard.noDownloads}</h3>
              <p className="text-zinc-400">{t.dashboard.recentDownloads}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDownloads.map((download) => (
                <div
                  key={download.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-zinc-700">
                    {getPlatformIcon(download.url)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
                        {getPlatformName(download.url)}
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-300 truncate font-mono">{download.url}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {new Date(download.downloaded_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-zinc-400 hover:text-white shrink-0"
                    onClick={() => window.open(download.url, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
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

