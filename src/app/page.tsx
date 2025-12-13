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
type DialogStep = 'type' | 'download';

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

  const handleGetLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAllFormats([]);
    setVideoTitle("");
    setProviderLabel(null);
    setSelectedMediaType(null);
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
    // Após selecionar o tipo, ir direto para download (formato é selecionado automaticamente)
    setDialogStep('download');
  };

  const handleBackToType = () => {
    setSelectedMediaType(null);
    setDialogStep('type');
  };

  const handleCloseDialog = () => {
    setFormatDialogOpen(false);
    setDialogStep('type');
    setSelectedMediaType(null);
  };

  // Selecionar automaticamente o melhor formato baseado no tipo escolhido
  const selectedFormat = useMemo(() => {
    try {
      if (selectedMediaType === 'video') {
        // Para vídeo: escolher automaticamente 1440p ou 1080p (com áudio)
        const videoFormats = allFormats.filter(format => {
          const hasVideo = format.vcodec !== 'none' && format.vcodec !== 'unknown';
          return hasVideo;
        });

        if (videoFormats.length === 0) return null;

        // Extrair resoluções numéricas e ordenar
        const formatsWithResolution = videoFormats.map(format => {
          const resNum = parseInt((format.resolution || '').replace(/\D/g, '')) || 0;
          return { format, resNum };
        }).sort((a, b) => b.resNum - a.resNum);

        // Priorizar: 1440p > 1080p > maior disponível
        const targetResolutions = [1440, 1080];
        for (const targetRes of targetResolutions) {
          const matching = formatsWithResolution.find(f => f.resNum === targetRes);
          if (matching) {
            // Priorizar MP4 com áudio
            const mp4WithAudio = videoFormats.find(f => 
              parseInt((f.resolution || '').replace(/\D/g, '')) === targetRes &&
              f.ext.toLowerCase() === 'mp4' && 
              f.acodec !== 'none' && 
              f.acodec !== 'unknown'
            );
            if (mp4WithAudio) return mp4WithAudio;
            
            // MP4 sem áudio (backend vai fazer merge)
            const mp4 = videoFormats.find(f => 
              parseInt((f.resolution || '').replace(/\D/g, '')) === targetRes &&
              f.ext.toLowerCase() === 'mp4'
            );
            if (mp4) return mp4;
            
            return matching.format;
          }
        }

        // Se não encontrou 1440p ou 1080p, pegar o maior disponível
        if (formatsWithResolution.length > 0) {
          const best = formatsWithResolution[0];
          // Priorizar MP4
          const mp4 = videoFormats.find(f => 
            parseInt((f.resolution || '').replace(/\D/g, '')) === best.resNum &&
            f.ext.toLowerCase() === 'mp4'
          );
          return mp4 || best.format;
        }

        return null;
      } else if (selectedMediaType === 'audio') {
        // Para áudio: sempre escolher MP3 (melhor qualidade disponível)
        const audioFormats = allFormats.filter(format => {
          const hasAudio = format.acodec !== 'none' && format.acodec !== 'unknown';
          const isAudioOnly = format.vcodec === 'none' || format.vcodec === 'unknown' || !format.vcodec;
          return hasAudio && isAudioOnly;
        });

        if (audioFormats.length === 0) {
          // Se não há formatos de áudio-only, mas há formatos com vídeo+áudio, 
          // podemos extrair apenas o áudio usando bestaudio
          // Mas isso requer mudança no backend, então retornar null por enquanto
          return null;
        }

        // Priorizar MP3
        const mp3 = audioFormats.find(f => f.ext.toLowerCase() === 'mp3');
        if (mp3) return mp3;

        // Se não tem MP3, pegar o melhor áudio disponível (maior tamanho = melhor qualidade)
        return audioFormats.sort((a, b) => {
          const aSize = a.filesize_approx || 0;
          const bSize = b.filesize_approx || 0;
          return bSize - aSize;
        })[0];
      }
      return null;
    } catch (error) {
      console.error('Erro ao selecionar formato:', error);
      return null;
    }
  }, [allFormats, selectedMediaType]);

  const getQualityLabel = (format: MediaFormat | null): string => {
    if (!format) return 'Carregando...';
    
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
        if (res >= 1440) return '2K Quad HD (1440p)';
        if (res >= 1080) return 'Full HD (1080p)';
        if (res >= 720) return 'HD (720p)';
        if (res >= 480) return 'SD (480p)';
        if (res >= 360) return '360p';
        if (res >= 240) return '240p';
        if (res >= 144) return '144p';
        return `${res}p`;
      } else {
        // Para áudio, sempre retornar MP3
        return 'MP3 - Alta Qualidade';
      }
    } catch (error) {
      console.error('Erro em getQualityLabel:', error, format);
      return selectedMediaType === 'video' ? 'Padrão' : 'MP3';
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
                  onKeyDown={(e) => {
                    // Permitir Ctrl+A (ou Cmd+A no Mac) para selecionar tudo
                    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                      e.preventDefault();
                      e.currentTarget.select();
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
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
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
                      onClick={handleBackToType}
                      className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full h-8 w-8 -ml-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  )}
                  <DialogTitle className="text-2xl font-bold text-white bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                    {dialogStep === 'type' && 'Escolha o formato'}
                    {dialogStep === 'download' && 'Pronto para baixar'}
                  </DialogTitle>
                </div>
                <DialogDescription className="text-zinc-400 mt-2 text-sm">
                  {dialogStep === 'type' && 'Escolha se deseja baixar como vídeo ou áudio'}
                  {dialogStep === 'download' && videoTitle && (
                    <span className="block mt-2 text-xs text-zinc-500 line-clamp-2">{videoTitle}</span>
                  )}
                </DialogDescription>
              </div>
            </div>
            {/* Progress Indicator */}
            <div className="flex items-center gap-2 mt-4">
              <div className={`h-1.5 rounded-full flex-1 transition-all ${dialogStep === 'type' ? 'bg-emerald-500' : 'bg-emerald-500/30'}`} />
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
                    <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">1080p/1440p com áudio</span>
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

          {/* Step 2: Download */}
          {dialogStep === 'download' && (
            <div className="py-6">
              {!selectedFormat ? (
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
                          onClick={(e) => {
                            // BLOQUEAR múltiplos cliques - verificar se já está processando
                            const button = e.currentTarget.querySelector('button');
                            if (button && button.disabled) {
                              e.preventDefault();
                              e.stopPropagation();
                              return false;
                            }
                            
                            // Adicionar loading visual ao clicar - continua até o download realmente começar
                            if (button) {
                              button.disabled = true;
                              // Bloquear o link também para evitar múltiplos cliques
                              e.currentTarget.style.pointerEvents = 'none';
                              e.currentTarget.style.cursor = 'not-allowed';
                              button.className = button.className.replace('hover:from-emerald-500 hover:to-emerald-400', 'opacity-70 cursor-not-allowed');
                              const originalContent = button.innerHTML;
                              
                              // Atualizar texto periodicamente para mostrar que está processando
                              let timeElapsed = 0;
                              const updateText = () => {
                                timeElapsed += 2;
                                if (timeElapsed <= 10) {
                                  button.innerHTML = `
                                    <svg class="h-5 w-5 mr-2 animate-spin inline-block" fill="none" viewBox="0 0 24 24">
                                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Preparando download...
                                  `;
                                } else if (timeElapsed <= 60) {
                                  button.innerHTML = `
                                    <svg class="h-5 w-5 mr-2 animate-spin inline-block" fill="none" viewBox="0 0 24 24">
                                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processando... (${timeElapsed}s)
                                  `;
                                } else {
                                  button.innerHTML = `
                                    <svg class="h-5 w-5 mr-2 animate-spin inline-block" fill="none" viewBox="0 0 24 24">
                                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Aguarde... (${timeElapsed}s)
                                  `;
                                }
                              };
                              
                              updateText();
                              const intervalId = setInterval(updateText, 2000);
                              
                              // Timeout de segurança: restaurar após 90 segundos (tempo suficiente para Twitter/Instagram/YouTube)
                              const restoreTimeout = setTimeout(() => {
                                clearInterval(intervalId);
                                if (button.disabled) {
                                  button.disabled = false;
                                  button.className = button.className.replace('opacity-70 cursor-not-allowed', 'hover:from-emerald-500 hover:to-emerald-400');
                                  button.innerHTML = originalContent;
                                  // Restaurar o link também
                                  e.currentTarget.style.pointerEvents = 'auto';
                                  e.currentTarget.style.cursor = 'pointer';
                                }
                              }, 90000); // 90 segundos para dar tempo suficiente
                              
                              // Detectar quando o download realmente começa usando eventos do navegador
                              const handleBeforeUnload = () => {
                                clearInterval(intervalId);
                                clearTimeout(restoreTimeout);
                                // Restaurar o link quando o download começar
                                e.currentTarget.style.pointerEvents = 'auto';
                                e.currentTarget.style.cursor = 'pointer';
                              };
                              
                              window.addEventListener('beforeunload', handleBeforeUnload);
                              
                              // Limpar após um tempo razoável (download deve ter começado)
                              setTimeout(() => {
                                window.removeEventListener('beforeunload', handleBeforeUnload);
                                // Restaurar o link após 10 segundos (download deve ter começado)
                                e.currentTarget.style.pointerEvents = 'auto';
                                e.currentTarget.style.cursor = 'pointer';
                              }, 10000);
                            }
                          }}
                          onMouseDown={(e) => {
                            // Bloquear cliques múltiplos também no mousedown
                            const button = e.currentTarget.querySelector('button');
                            if (button && button.disabled) {
                              e.preventDefault();
                              e.stopPropagation();
                            }
                          }}
                        >
                          <Button 
                            size="lg" 
                            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300 h-12 text-base font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
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
              )}
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
