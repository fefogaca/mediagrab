'use client';

import React, { useState, useMemo } from 'react';
import { appConfig } from '@/config/app.config';

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

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  formats: MediaFormat[];
  providerLabel?: string | null;
  videoUrl: string;
}

type FormatType = 'video' | 'audio';

interface ResolutionGroup {
  resolution: string;
  formats: MediaFormat[];
}

interface FormatGroup {
  ext: string;
  resolutions: ResolutionGroup[];
}

export default function DownloadModal({
  isOpen,
  onClose,
  title,
  formats,
  providerLabel,
  videoUrl,
}: DownloadModalProps) {
  const [selectedType, setSelectedType] = useState<FormatType>('video');
  const [selectedExt, setSelectedExt] = useState<string | null>(null);
  const [selectedResolution, setSelectedResolution] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<MediaFormat | null>(null);

  // Agrupar formatos por tipo, extensão e resolução
  const organizedFormats = useMemo(() => {
    const videoFormats: FormatGroup[] = [];
    const audioFormats: FormatGroup[] = [];

    formats.forEach((format) => {
      // Considerar 'unknown' como vídeo quando tem extensão de vídeo (ex: Twitter scraping)
      const isVideo = format.vcodec !== 'none' && format.vcodec !== 'unknown';
      const isAudio = format.acodec !== 'none' && format.acodec !== 'unknown';
      // Se tiver extensão de vídeo mas codecs unknown, assumir que é vídeo (comum em scraping)
      const hasVideoExt = format.ext && ['mp4', 'webm', 'mkv', 'mov', 'avi'].includes(format.ext.toLowerCase());
      const hasUrlWithUnknown = format.vcodec === 'unknown' && format.acodec === 'unknown';
      
      // Pular formatos que não têm vídeo nem áudio
      if (!isVideo && !isAudio && !(hasUrlWithUnknown && hasVideoExt)) return;
      
      // Se tem URL com codecs unknown mas extensão de vídeo, tratar como vídeo
      const effectiveIsVideo = isVideo || (hasUrlWithUnknown && hasVideoExt);
      const effectiveIsAudio = isAudio || (hasUrlWithUnknown && !hasVideoExt && !isVideo);

      const targetArray = effectiveIsVideo ? videoFormats : audioFormats;
      const resolution = format.resolution || 'Desconhecido';

      // Encontrar ou criar grupo de extensão
      let formatGroup = targetArray.find(g => g.ext === format.ext);
      if (!formatGroup) {
        formatGroup = { ext: format.ext, resolutions: [] };
        targetArray.push(formatGroup);
      }

      // Encontrar ou criar grupo de resolução
      let resolutionGroup = formatGroup.resolutions.find(r => r.resolution === resolution);
      if (!resolutionGroup) {
        resolutionGroup = { resolution, formats: [] };
        formatGroup.resolutions.push(resolutionGroup);
      }

      resolutionGroup.formats.push(format);
    });

    // Ordenar resoluções (tentar ordenar numericamente)
    const sortResolutions = (a: ResolutionGroup, b: ResolutionGroup) => {
      const aNum = parseInt(a.resolution.replace(/\D/g, '')) || 0;
      const bNum = parseInt(b.resolution.replace(/\D/g, '')) || 0;
      if (aNum !== bNum) return bNum - aNum;
      return a.resolution.localeCompare(b.resolution);
    };

    // Ordenar formatos dentro de cada resolução (por tamanho)
    videoFormats.forEach(fg => {
      fg.resolutions.sort(sortResolutions);
      fg.resolutions.forEach(rg => {
        rg.formats.sort((a, b) => (b.filesize_approx ?? 0) - (a.filesize_approx ?? 0));
      });
    });

    audioFormats.forEach(fg => {
      fg.resolutions.sort(sortResolutions);
      fg.resolutions.forEach(rg => {
        rg.formats.sort((a, b) => (b.filesize_approx ?? 0) - (a.filesize_approx ?? 0));
      });
    });

    return { video: videoFormats, audio: audioFormats };
  }, [formats]);

  // Obter formatos filtrados baseado na seleção
  const currentFormats = useMemo(() => {
    const typeFormats = selectedType === 'video' ? organizedFormats.video : organizedFormats.audio;
    
    if (!selectedExt) return [];
    
    const formatGroup = typeFormats.find(fg => fg.ext === selectedExt);
    if (!formatGroup) return [];

    if (!selectedResolution) return formatGroup.resolutions;

    return formatGroup.resolutions.filter(rg => rg.resolution === selectedResolution);
  }, [organizedFormats, selectedType, selectedExt, selectedResolution]);

  // Selecionar automaticamente quando mudar o tipo
  React.useEffect(() => {
    const typeFormats = selectedType === 'video' ? organizedFormats.video : organizedFormats.audio;
    if (typeFormats.length > 0) {
      setSelectedExt(typeFormats[0].ext);
      if (typeFormats[0].resolutions.length > 0) {
        setSelectedResolution(typeFormats[0].resolutions[0].resolution);
        setSelectedFormat(typeFormats[0].resolutions[0].formats[0]);
      }
    } else {
      setSelectedExt(null);
      setSelectedResolution(null);
      setSelectedFormat(null);
    }
  }, [selectedType, organizedFormats]);

  // Atualizar formato selecionado quando mudar resolução
  React.useEffect(() => {
    if (currentFormats.length > 0 && currentFormats[0].formats.length > 0) {
      setSelectedFormat(currentFormats[0].formats[0]);
    }
  }, [currentFormats]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes || Number.isNaN(bytes)) return 'Tamanho indisponível';
    if (bytes < 1024) return `${bytes} B`;
    const units = ['KB', 'MB', 'GB', 'TB'];
    let value = bytes / 1024;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }

    return `${value.toFixed(1)} ${units[unitIndex]}`;
  };

  const handleDownload = () => {
    if (!selectedFormat) return;
    
    // Redirecionar para a URL configurável da API
    window.open(selectedFormat.download_url, '_blank');
  };

  if (!isOpen) return null;

  const typeFormats = selectedType === 'video' ? organizedFormats.video : organizedFormats.audio;
  const hasMultipleFormats = typeFormats.length > 1;
  const hasMultipleResolutions = selectedExt && typeFormats.find(fg => fg.ext === selectedExt)?.resolutions.length && (typeFormats.find(fg => fg.ext === selectedExt)?.resolutions.length ?? 0) > 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 animate-scale-in overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-violet-50 to-sky-50 dark:from-gray-800 dark:to-gray-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                {title}
              </h2>
              {providerLabel && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-medium border border-violet-200 dark:border-violet-800">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {providerLabel}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Type Selector */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setSelectedType('video')}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                selectedType === 'video'
                  ? 'bg-gradient-to-r from-violet-600 to-sky-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Vídeo
              </div>
            </button>
            <button
              onClick={() => setSelectedType('audio')}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                selectedType === 'audio'
                  ? 'bg-gradient-to-r from-violet-600 to-sky-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                Áudio
              </div>
            </button>
          </div>

          {/* Format Selection (se houver múltiplos formatos) */}
          {hasMultipleFormats && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Selecione o Formato:
              </label>
              <div className="flex flex-wrap gap-2">
                {typeFormats.map((formatGroup) => (
                  <button
                    key={formatGroup.ext}
                    onClick={() => {
                      setSelectedExt(formatGroup.ext);
                      if (formatGroup.resolutions.length > 0) {
                        setSelectedResolution(formatGroup.resolutions[0].resolution);
                        setSelectedFormat(formatGroup.resolutions[0].formats[0]);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      selectedExt === formatGroup.ext
                        ? 'bg-violet-600 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {formatGroup.ext.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Resolution Selection (apenas para vídeo) */}
          {selectedType === 'video' && selectedExt && hasMultipleResolutions && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Selecione a Resolução:
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {typeFormats.find(fg => fg.ext === selectedExt)?.resolutions.map((resolutionGroup) => (
                  <button
                    key={resolutionGroup.resolution}
                    onClick={() => {
                      setSelectedResolution(resolutionGroup.resolution);
                      setSelectedFormat(resolutionGroup.formats[0]);
                    }}
                    className={`px-4 py-3 rounded-xl font-medium text-sm transition-all text-left ${
                      selectedResolution === resolutionGroup.resolution
                        ? 'bg-violet-600 text-white shadow-lg border-2 border-violet-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border-2 border-transparent'
                    }`}
                  >
                    <div className="font-semibold">{resolutionGroup.resolution}</div>
                    {resolutionGroup.formats.length > 0 && (
                      <div className="text-xs mt-1 opacity-80">
                        {formatFileSize(resolutionGroup.formats[0].filesize_approx)}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Format Details */}
          {selectedFormat ? (
            <div className="bg-gradient-to-br from-violet-50 to-sky-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-6 border border-violet-200 dark:border-violet-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Detalhes do Formato</h3>
                <span className="px-3 py-1 rounded-full bg-violet-600 text-white text-xs font-semibold uppercase">
                  {selectedFormat.ext}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Resolução:</span>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedFormat.resolution}</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Tamanho:</span>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{formatFileSize(selectedFormat.filesize_approx)}</p>
                </div>
                {selectedFormat.quality && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Qualidade:</span>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedFormat.quality}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Codec:</span>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
                    {selectedFormat.vcodec !== 'none' ? selectedFormat.vcodec : selectedFormat.acodec}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400">Nenhum formato {selectedType === 'video' ? 'de vídeo' : 'de áudio'} disponível</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              {selectedFormat && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Pronto para baixar:</span>{' '}
                  {selectedFormat.ext.toUpperCase()} - {selectedFormat.resolution} ({formatFileSize(selectedFormat.filesize_approx)})
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDownload}
                disabled={!selectedFormat}
                className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-violet-600 to-sky-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Baixar Agora
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
