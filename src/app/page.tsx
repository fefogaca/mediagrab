"use client";

import React, { useState, useRef, useMemo } from "react";
import Link from "next/link";
import { Navbar } from "@frontend/components/shared/Navbar";
import { Footer } from "@frontend/components/shared/Footer";
import { Button } from "@frontend/components/ui/button";
import { Badge } from "@frontend/components/ui/badge";
import {
  Card,
  CardContent,
} from "@frontend/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@frontend/components/ui/dialog";
import { Input } from "@frontend/components/ui/input";
import { 
  Download, 
  Zap, 
  Globe, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Shield,
  Code,
  ArrowRight,
  Youtube,
  Instagram,
  Music,
  Video,
  PlayCircle,
  X,
  ChevronLeft
} from "lucide-react";
import { validateMediaUrl } from "@/lib/media/providers";
import { useTranslation } from "@/lib/i18n";

interface MediaFormat {
  format_id: string;
  ext: string;
  resolution: string;
  quality?: string | null;
  vcodec: string;
  acodec: string;
  filesize_approx?: number;
  source: string;
  download_url: string;
}

type MediaType = 'video' | 'audio' | null;
type DialogStep = 'type' | 'quality' | 'download';

export default function Home() {
  const { t } = useTranslation();
  const [url, setUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [allFormats, setAllFormats] = useState<MediaFormat[]>([]);
  const [videoTitle, setVideoTitle] = useState<string>("");
  const [providerLabel, setProviderLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [formatDialogOpen, setFormatDialogOpen] = useState(false);
  const [dialogStep, setDialogStep] = useState<DialogStep>('type');
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType>(null);
  const [selectedFormat, setSelectedFormat] = useState<MediaFormat | null>(null);

  const handleGetLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAllFormats([]);
    setVideoTitle("");
    setProviderLabel(null);
    setSelectedMediaType(null);
    setSelectedFormat(null);
    setDialogStep('type');

    // Validar URL
    const urlToValidate = url.trim();
    if (!urlToValidate) {
      setLoading(false);
      setError('Forneça um link completo (https://...) para continuar.');
      return;
    }

    const validation = validateMediaUrl(urlToValidate);
    if (!validation.ok) {
      setLoading(false);
      if (validation.reason === "UNSUPPORTED_PROVIDER") {
        setDialogMessage(validation.message);
        setDialogOpen(true);
      } else {
        setError(validation.message);
      }
      return;
    }

    const targetUrl = validation.normalizedUrl;

    try {
      const response = await fetch(
        `/api/public-download?url=${encodeURIComponent(targetUrl)}`
      );
      const data = await response.json();

      if (response.ok) {
        setVideoTitle(data.title);
        setAllFormats(data.formats);
        setProviderLabel(data.provider?.label ?? null);
        setFormatDialogOpen(true);
      } else {
        const errorMessage =
          data?.error?.message ||
          "Não foi possível gerar os links para este vídeo.";
        setError(errorMessage);

        if (data?.error?.code === "UNSUPPORTED_PROVIDER") {
          setDialogMessage(errorMessage);
          setDialogOpen(true);
        }
      }
    } catch (err) {
      console.error("Falha ao obter links:", err);
      setError(
        "Não conseguimos falar com o servidor agora. Verifique a conexão e tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMediaTypeSelect = (type: MediaType) => {
    setSelectedMediaType(type);
    setDialogStep('quality');
  };

  const handleFormatSelect = (format: MediaFormat) => {
    setSelectedFormat(format);
    setDialogStep('download');
  };

  const handleBackToType = () => {
    setSelectedMediaType(null);
    setDialogStep('type');
  };

  const handleBackToQuality = () => {
    setSelectedFormat(null);
    setDialogStep('quality');
  };

  const handleCloseDialog = () => {
    setFormatDialogOpen(false);
    setDialogStep('type');
    setSelectedMediaType(null);
    setSelectedFormat(null);
  };

  // Organizar formatos por tipo e qualidade
  const organizedFormats = useMemo(() => {
    try {
      if (selectedMediaType === 'video') {
        // Incluir TODOS os formatos com vídeo (mesmo sem áudio)
        // O backend vai fazer merge automaticamente quando necessário
        const videoFormats = allFormats.filter(format => {
          const hasVideo = format.vcodec !== 'none' && format.vcodec !== 'unknown';
          return hasVideo;
        });

        // Agrupar por resolução numérica (extrair número da resolução)
        const grouped: { [key: number]: MediaFormat[] } = {};
        videoFormats.forEach(format => {
          // Extrair número da resolução (ex: "1080p" -> 1080, "2160p" -> 2160)
          const resNum = parseInt((format.resolution || '').replace(/\D/g, '')) || 0;
          
          // Se já existe um formato com essa resolução, adicionar ao grupo
          if (!grouped[resNum]) {
            grouped[resNum] = [];
          }
          grouped[resNum].push(format);
        });

        // Para cada resolução, escolher o melhor formato
        // Priorizar: MP4 com áudio > MP4 sem áudio > outros com áudio > outros
        const uniqueFormats = Object.entries(grouped)
          .map(([resNum, group]) => {
            // Priorizar MP4 com áudio
            const mp4WithAudio = group.find(f => 
              f.ext.toLowerCase() === 'mp4' && 
              f.acodec !== 'none' && 
              f.acodec !== 'unknown'
            );
            if (mp4WithAudio) return mp4WithAudio;
            
            // MP4 sem áudio (backend vai fazer merge)
            const mp4 = group.find(f => f.ext.toLowerCase() === 'mp4');
            if (mp4) return mp4;
            
            // Outros formatos com áudio
            const withAudio = group.find(f => 
              f.acodec !== 'none' && 
              f.acodec !== 'unknown'
            );
            if (withAudio) return withAudio;
            
            // Qualquer formato de vídeo (backend vai fazer merge se necessário)
            return group[0];
          })
          .filter(Boolean) // Remove undefined/null
          .map(format => {
            // Garantir que o formato tenha acodec marcado (mesmo que seja 'none', o backend vai fazer merge)
            // Se não tiver áudio, vamos marcar como tendo áudio garantido pelo backend
            return {
              ...format,
              // Se não tem áudio, vamos garantir que o backend vai fazer merge
              // Mantemos o formato original mas sabemos que terá áudio no final
            };
          });

        // Ordenar por resolução (maior para menor)
        return uniqueFormats.sort((a, b) => {
          const aRes = parseInt((a.resolution || '').replace(/\D/g, '')) || 0;
          const bRes = parseInt((b.resolution || '').replace(/\D/g, '')) || 0;
          return bRes - aRes;
        });
      } else if (selectedMediaType === 'audio') {
        // Filtrar apenas áudios (sem vídeo)
        const audioFormats = allFormats.filter(format => {
          const hasAudio = format.acodec !== 'none' && format.acodec !== 'unknown';
          const isAudioOnly = format.vcodec === 'none' || format.vcodec === 'unknown' || !format.vcodec;
          return hasAudio && isAudioOnly;
        });

        // Agrupar por qualidade/bitrate
        const grouped: { [key: string]: MediaFormat[] } = {};
        audioFormats.forEach(format => {
          const key = format.quality || format.ext || 'default';
          if (!grouped[key]) {
            grouped[key] = [];
          }
          grouped[key].push(format);
        });

        // Converter para array e ordenar por tamanho (qualidade)
        return Object.values(grouped)
          .map(group => {
            // Priorizar MP3 dentro do grupo
            const mp3 = group.find(f => f.ext.toLowerCase() === 'mp3');
            return mp3 || group[0];
          })
          .sort((a, b) => {
            const aSize = a.filesize_approx || 0;
            const bSize = b.filesize_approx || 0;
            return bSize - aSize;
          });
      }
      return [];
    } catch (error) {
      console.error('Erro ao organizar formatos:', error);
      return [];
    }
  }, [allFormats, selectedMediaType]);

  const getQualityLabel = (format: MediaFormat): string => {
    try {
      if (selectedMediaType === 'video') {
        // Extrair número da resolução de forma segura
        const resolutionStr = format.resolution || '';
        const resMatch = resolutionStr.match(/\d+/);
        const res = resMatch ? parseInt(resMatch[0]) : 0;
        
        // Se não conseguir extrair número válido, usar a resolução original
        if (res === 0 || isNaN(res)) {
          return format.resolution || format.quality || 'Padrão';
        }
        
        // Classificar por resolução real
        if (res >= 2160) return '4K Ultra HD';
        if (res >= 1440) return '2K Quad HD';
        if (res >= 1080) return 'Full HD (1080p)';
        if (res >= 720) return 'HD (720p)';
        if (res >= 480) return 'SD (480p)';
        if (res >= 360) return '360p';
        if (res >= 240) return '240p';
        if (res >= 144) return '144p';
        return `${res}p`;
      } else {
        // Para áudio, usar qualidade ou bitrate se disponível - SEMPRE retornar string
        const quality = format.quality || format.resolution || 'Alta Qualidade';
        return String(quality);
      }
    } catch (error) {
      console.error('Erro em getQualityLabel:', error, format);
      return selectedMediaType === 'video' ? 'Padrão' : 'Alta Qualidade';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || Number.isNaN(bytes)) return "Tamanho indisponível";
    if (bytes < 1024) return `${bytes} B`;
    const units = ["KB", "MB", "GB", "TB"];
    let value = bytes / 1024;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }

    return `${value.toFixed(1)} ${units[unitIndex]}`;
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "ytdl-core":
        return "Backup: ytdl-core";
      case "yt-dlp":
        return "Principal: yt-dlp";
      default:
        return source;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-transparent to-cyan-900/20 animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_50%)]" />
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 mb-6 animate-fade-in">
            <Zap className="h-3 w-3 mr-1" />
            {t.landing.badge}
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 animate-fade-in-up">
            {t.landing.title}
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-8 animate-fade-in-up animation-delay-200">
            {t.landing.subtitle}
          </p>

          {/* URL Input Form */}
          <div className="max-w-3xl mx-auto animate-fade-in-up animation-delay-300">
            <form onSubmit={handleGetLinks} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Input
                  type="url"
                  className="w-full px-4 py-6 text-lg bg-zinc-900/80 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent backdrop-blur-sm"
                  value={url}
                  onChange={(e) => {
                    const newUrl = e.target.value;
                    setUrl(newUrl);
                    // Limpar erro quando o usuário começar a digitar
                    if (error && newUrl.trim().length > 0) {
                      setError(null);
                    }
                  }}
                  required
                  placeholder={t.landing.inputPlaceholder}
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5 mr-2" />
                    {t.landing.downloadBtn}
                  </>
                )}
              </Button>
            </form>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-rose-900/20 border border-rose-800/50 rounded-lg flex items-start gap-3 animate-fade-in">
                <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-rose-300 text-sm">{error}</p>
              </div>
            )}

            {/* Supported Sites Info */}
            <p className="mt-6 text-sm text-zinc-500">
              {t.landing.supportedSites}
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 mb-4">
              {t.landing.features.title}
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {t.landing.features.subtitle}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="p-3 rounded-xl bg-emerald-500/10 w-fit mb-4">
                  <Zap className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {t.landing.features.fast.title}
                </h3>
                <p className="text-zinc-400 text-sm">
                  {t.landing.features.fast.description}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="p-3 rounded-xl bg-emerald-500/10 w-fit mb-4">
                  <Shield className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {t.landing.features.secure.title}
                </h3>
                <p className="text-zinc-400 text-sm">
                  {t.landing.features.secure.description}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="p-3 rounded-xl bg-emerald-500/10 w-fit mb-4">
                  <Globe className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {t.landing.features.multiPlatform.title}
                </h3>
                <p className="text-zinc-400 text-sm">
                  {t.landing.features.multiPlatform.description}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="p-3 rounded-xl bg-emerald-500/10 w-fit mb-4">
                  <Code className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {t.landing.features.api.title}
                </h3>
                <p className="text-zinc-400 text-sm">
                  {t.landing.features.api.description}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {t.landing.integration.title}
            </h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              {t.landing.integration.description}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {t.landing.integration.features.map((feature: string, index: number) => (
              <Card key={index} className="bg-zinc-900/50 border-zinc-800 hover:border-emerald-500/30 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
                  <p className="text-zinc-300 text-sm">{feature}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/docs">
              <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                {t.landing.integration.cta}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Platform Icons Section */}
      <section className="py-20 px-4 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              {t.landing.platforms?.title || 'Plataformas Suportadas'}
            </h2>
            <p className="text-zinc-400">
              {t.landing.platforms?.subtitle || 'Suportamos mais de 1000+ plataformas de mídia'}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <div className="flex flex-col items-center gap-2 hover:scale-110 transition-transform duration-300">
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-red-500/50 transition-colors">
                <Youtube className="h-8 w-8 text-red-500" />
              </div>
              <span className="text-sm text-zinc-400">YouTube</span>
            </div>
            <div className="flex flex-col items-center gap-2 hover:scale-110 transition-transform duration-300">
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-pink-500/50 transition-colors">
                <Instagram className="h-8 w-8 text-pink-500" />
              </div>
              <span className="text-sm text-zinc-400">Instagram</span>
            </div>
            <div className="flex flex-col items-center gap-2 hover:scale-110 transition-transform duration-300">
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-emerald-500/50 transition-colors">
                <Music className="h-8 w-8 text-emerald-500" />
              </div>
              <span className="text-sm text-zinc-400">SoundCloud</span>
            </div>
            <div className="flex flex-col items-center gap-2 hover:scale-110 transition-transform duration-300">
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-blue-500/50 transition-colors">
                <Video className="h-8 w-8 text-blue-500" />
              </div>
              <span className="text-sm text-zinc-400">TikTok</span>
            </div>
            <div className="flex flex-col items-center gap-2 hover:scale-110 transition-transform duration-300">
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-400/50 transition-colors">
                <Globe className="h-8 w-8 text-zinc-400" />
              </div>
              <span className="text-sm text-zinc-400">{t.landing.platforms?.andMore || 'E muito mais...'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-emerald-900/20 to-emerald-800/20 border border-emerald-800/50 rounded-3xl p-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              {t.landing.cta.title}
            </h2>
            <p className="text-zinc-400 mb-8">
              {t.landing.cta.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-8"
                >
                  {t.landing.cta.primary}
                </Button>
              </Link>
              <Link href="/docs">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 px-8"
                >
                  {t.landing.cta.secondary}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Format Selection Dialog - Multi-step */}
      <Dialog open={formatDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border-zinc-800 text-white sm:max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
          <DialogHeader className="space-y-4 pb-4 border-b border-zinc-800/50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {dialogStep !== 'type' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={dialogStep === 'quality' ? handleBackToType : handleBackToQuality}
                      className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full h-8 w-8 -ml-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  )}
                  <DialogTitle className="text-2xl font-bold text-white bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                    {dialogStep === 'type' && 'Escolha o formato'}
                    {dialogStep === 'quality' && 'Selecione a qualidade'}
                    {dialogStep === 'download' && 'Pronto para baixar'}
                  </DialogTitle>
                </div>
                <DialogDescription className="text-zinc-400 mt-2 text-sm">
                  {dialogStep === 'type' && 'Escolha se deseja baixar como vídeo ou áudio'}
                  {dialogStep === 'quality' && videoTitle && (
                    <span className="block mt-2 text-xs text-zinc-500 line-clamp-2">{videoTitle}</span>
                  )}
                  {dialogStep === 'download' && selectedFormat && (
                    <span className="block mt-2 text-xs text-zinc-500 line-clamp-2">{videoTitle}</span>
                  )}
                </DialogDescription>
              </div>
            </div>
            {/* Progress Indicator */}
            <div className="flex items-center gap-2 mt-4">
              <div className={`h-1.5 rounded-full flex-1 transition-all ${dialogStep === 'type' ? 'bg-emerald-500' : 'bg-emerald-500/30'}`} />
              <div className={`h-1.5 rounded-full flex-1 transition-all ${dialogStep === 'quality' ? 'bg-emerald-500' : dialogStep === 'download' ? 'bg-emerald-500/30' : 'bg-zinc-800'}`} />
              <div className={`h-1.5 rounded-full flex-1 transition-all ${dialogStep === 'download' ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
            </div>
          </DialogHeader>

          {/* Step 1: Type Selection */}
          {dialogStep === 'type' && (
            <div className="py-8">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleMediaTypeSelect('video')}
                  className="relative flex flex-col items-center justify-center p-10 rounded-2xl border-2 border-zinc-800 hover:border-emerald-500/50 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 hover:from-emerald-500/10 hover:to-emerald-600/5 transition-all duration-300 group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-600/0 group-hover:from-emerald-500/10 group-hover:to-emerald-600/5 transition-all duration-300" />
                  <div className="relative z-10">
                    <div className="p-4 rounded-2xl bg-emerald-500/10 mb-4 group-hover:bg-emerald-500/20 transition-colors flex items-center justify-center">
                      <PlayCircle className="h-10 w-10 text-emerald-400 group-hover:text-emerald-300 group-hover:scale-110 transition-all duration-300" />
                    </div>
                    <span className="text-xl font-bold text-white mb-1 block group-hover:text-emerald-400 transition-colors">Vídeo</span>
                    <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">MP4 com áudio</span>
                  </div>
                </button>
                <button
                  onClick={() => handleMediaTypeSelect('audio')}
                  className="relative flex flex-col items-center justify-center p-10 rounded-2xl border-2 border-zinc-800 hover:border-emerald-500/50 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 hover:from-emerald-500/10 hover:to-emerald-600/5 transition-all duration-300 group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-600/0 group-hover:from-emerald-500/10 group-hover:to-emerald-600/5 transition-all duration-300" />
                  <div className="relative z-10">
                    <div className="p-4 rounded-2xl bg-emerald-500/10 mb-4 group-hover:bg-emerald-500/20 transition-colors flex items-center justify-center">
                      <Music className="h-10 w-10 text-emerald-400 group-hover:text-emerald-300 group-hover:scale-110 transition-all duration-300" />
                    </div>
                    <span className="text-xl font-bold text-white mb-1 block group-hover:text-emerald-400 transition-colors">Áudio</span>
                    <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">MP3</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Quality Selection */}
          {dialogStep === 'quality' && (
            <div className="py-6">
              {organizedFormats.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 rounded-full bg-rose-500/10 w-fit mx-auto mb-4">
                    <AlertCircle className="h-8 w-8 text-rose-400" />
                  </div>
                  <p className="text-zinc-300 mb-1 font-medium">
                    Nenhum formato {selectedMediaType === 'video' ? 'de vídeo' : 'de áudio'} disponível.
                  </p>
                  <p className="text-zinc-500 text-sm mb-6">
                    Tente outro link ou verifique sua conexão.
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleBackToType}
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                  {organizedFormats.map((format, index) => {
                    try {
                      const qualityLabel = getQualityLabel(format);
                      const qualityLabelStr = String(qualityLabel || '');
                      const isHD = qualityLabelStr.includes('HD') || qualityLabelStr.includes('4K') || qualityLabelStr.includes('2K');
                      
                      return (
                        <button
                          key={format.format_id}
                          onClick={() => handleFormatSelect(format)}
                          className="w-full p-5 rounded-xl border-2 border-zinc-800 hover:border-emerald-500/50 bg-gradient-to-r from-zinc-800/50 to-zinc-900/30 hover:from-emerald-500/10 hover:to-emerald-600/5 transition-all duration-300 text-left group relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-emerald-600/0 group-hover:from-emerald-500/5 group-hover:to-emerald-600/5 transition-all duration-300" />
                          <div className="relative z-10 flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3 flex-wrap">
                                <Badge className={`${isHD ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-400 border-emerald-500/50 shadow-lg shadow-emerald-500/10' : 'bg-zinc-700/50 text-zinc-300 border-zinc-600/50'} px-3 py-1 font-semibold`}>
                                  {qualityLabelStr}
                                </Badge>
                                <span className="text-xs text-zinc-500 uppercase font-medium tracking-wider">
                                  {format.ext}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-zinc-400 flex-wrap">
                                {format.resolution && (
                                  <span className="flex items-center gap-1">
                                    <PlayCircle className="h-3 w-3" />
                                    {format.resolution}
                                  </span>
                                )}
                                {format.quality && format.quality !== format.resolution && (
                                  <span className="text-zinc-500">• {format.quality}</span>
                                )}
                                {formatFileSize(format.filesize_approx) !== "Tamanho indisponível" && (
                                  <span className="text-zinc-500">• {formatFileSize(format.filesize_approx)}</span>
                                )}
                              </div>
                            </div>
                            <div className="ml-4 p-2 rounded-lg bg-zinc-800/50 group-hover:bg-emerald-500/20 transition-colors">
                              <ArrowRight className="h-5 w-5 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                            </div>
                          </div>
                        </button>
                      );
                    } catch (error) {
                      console.error('Erro ao renderizar formato:', error, format);
                      return null;
                    }
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Download */}
          {dialogStep === 'download' && selectedFormat && (
            <div className="py-6">
              <Card className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border-zinc-700/50 shadow-xl">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="text-center pb-6 border-b border-zinc-700/50">
                      <Badge className="bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-400 border-emerald-500/50 px-4 py-1.5 mb-4 text-sm font-semibold">
                        {selectedMediaType === 'video' ? 'Vídeo MP4' : 'Áudio MP3'}
                      </Badge>
                      <h3 className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                        {getQualityLabel(selectedFormat)}
                      </h3>
                      <p className="text-sm text-zinc-400">{videoTitle}</p>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-4">
                      {selectedFormat.resolution && (
                        <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
                          <p className="text-xs text-zinc-500 mb-1">Resolução</p>
                          <p className="text-sm font-semibold text-white">{selectedFormat.resolution}</p>
                        </div>
                      )}
                      {formatFileSize(selectedFormat.filesize_approx) !== "Tamanho indisponível" && (
                        <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
                          <p className="text-xs text-zinc-500 mb-1">Tamanho</p>
                          <p className="text-sm font-semibold text-white">{formatFileSize(selectedFormat.filesize_approx)}</p>
                        </div>
                      )}
                      <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
                        <p className="text-xs text-zinc-500 mb-1">Formato</p>
                        <p className="text-sm font-semibold text-white">{selectedFormat.ext.toUpperCase()}</p>
                      </div>
                      {selectedFormat.quality && selectedFormat.quality !== selectedFormat.resolution && (
                        <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
                          <p className="text-xs text-zinc-500 mb-1">Qualidade</p>
                          <p className="text-sm font-semibold text-white">{selectedFormat.quality}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Download Button */}
                    <div className="pt-4">
                      <a 
                        href={selectedFormat.download_url} 
                        download
                        className="block"
                      >
                        <Button 
                          size="lg" 
                          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300 h-12 text-base font-semibold"
                        >
                          <Download className="h-5 w-5 mr-2" />
                          Baixar Agora
                        </Button>
                      </a>
                      <p className="text-xs text-zinc-500 text-center mt-4">
                        {getSourceLabel(selectedFormat.source)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="sm:justify-end pt-4 border-t border-zinc-800/50">
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">
              Link não suportado
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {dialogMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setDialogOpen(false)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
