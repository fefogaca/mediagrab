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
import { toast } from "sonner";
import {
  Play,
  Loader2,
  Copy,
  XCircle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function TestAreaPage() {
  const { t } = useTranslation();
  const exampleUrl = "https://youtube.com/watch?v=dQw4w9WgXcQ";
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>("");
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [isStructureOpen, setIsStructureOpen] = useState<boolean>(false);

  // Fetch user's API key and base URL on mount
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const res = await fetch("/api/dashboard/my-api-keys");
        const data = await res.json();
        if (data.apiKeys && data.apiKeys.length > 0) {
          setApiKey(data.apiKeys[0].key);
        }
      } catch (err) {
        console.error("Erro ao buscar API key:", err);
      }
    };
    fetchApiKey();
    
    // Get base URL
    const url = window.location.origin;
    setBaseUrl(url);
  }, []);

  const handleTest = async () => {
    if (!apiKey) {
      toast.error(t.testArea.errors.apiKeyRequired);
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Usar endpoint de teste que não conta uso
      const testUrl = `/api/test-download?url=${encodeURIComponent(exampleUrl)}&apikey=${apiKey}`;
      const res = await fetch(testUrl);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || data.error || t.testArea.errors.requestFailed);
        setResponse(data);
      } else {
        setResponse(data);
        toast.success(t.testArea.success);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t.testArea.errors.requestFailed;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getRequestStructure = () => {
    if (!baseUrl) return "";
    return `${baseUrl}/api/download?url=link_video&apikey=key`;
  };

  const censorDownloadUrls = (obj: any): any => {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      // Se for uma URL de download, censurar
      if (obj.includes('/api/download-direct') || obj.includes('download_url')) {
        try {
          const url = new URL(obj);
          // Manter apenas o domínio e caminho, sem parâmetros
          return `${url.origin}${url.pathname}`;
        } catch {
          return obj;
        }
      }
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => censorDownloadUrls(item));
    }

    if (typeof obj === 'object') {
      const censored: any = {};
      for (const key in obj) {
        if (key === 'download_url') {
          // Censurar especificamente o campo download_url
          const url = obj[key];
          if (typeof url === 'string') {
            try {
              const urlObj = new URL(url);
              censored[key] = `${urlObj.origin}${urlObj.pathname}`;
            } catch {
              censored[key] = url;
            }
          } else {
            censored[key] = url;
          }
        } else {
          censored[key] = censorDownloadUrls(obj[key]);
        }
      }
      return censored;
    }

    return obj;
  };

  const getCensoredResponse = () => {
    if (!response) return null;
    return censorDownloadUrls(response);
  };

  const copyToClipboard = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response, null, 2));
      toast.success(t.common.copied);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">{t.testArea.title}</h1>
        <p className="text-zinc-400 mt-1">{t.testArea.subtitle}</p>
      </div>

      {/* Test Card */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Play className="h-5 w-5 text-emerald-500" />
            {t.testArea.testRequest}
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {t.testArea.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* URL Input (Read-only) */}
          <div className="space-y-2">
            <Label className="text-zinc-300">{t.testArea.urlLabel}</Label>
            <div className="flex gap-2">
              <Input
                type="url"
                value={exampleUrl}
                readOnly
                className="bg-zinc-800/50 border-zinc-700 text-zinc-300 cursor-not-allowed"
              />
              <Button
                onClick={handleTest}
                disabled={loading || !apiKey}
                className="bg-emerald-600 hover:bg-emerald-500 text-white shrink-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t.testArea.testing}
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    {t.testArea.testButton}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Request Structure Info - Dropdown */}
          {baseUrl && (
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 overflow-hidden">
              <button
                onClick={() => setIsStructureOpen(!isStructureOpen)}
                className="w-full p-4 flex items-center justify-between hover:bg-blue-500/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Info className="h-5 w-5 text-blue-500 shrink-0" />
                  <p className="text-sm font-medium text-blue-400">
                    {t.testArea.requestStructure.title}
                  </p>
                </div>
                {isStructureOpen ? (
                  <ChevronUp className="h-4 w-4 text-blue-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-blue-400" />
                )}
              </button>
              {isStructureOpen && (
                <div className="px-4 pb-4 pt-0">
                  <div className="space-y-1 text-xs text-zinc-300 font-mono bg-zinc-900/50 p-3 rounded border border-zinc-700">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400 shrink-0">{t.testArea.requestStructure.baseUrl}:</span>
                      <span className="text-zinc-300 break-all">{baseUrl}/api/download</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400 shrink-0">{t.testArea.requestStructure.endpoint}:</span>
                      <span className="text-zinc-300">GET /api/download</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400 shrink-0">{t.testArea.requestStructure.parameters}:</span>
                      <span className="text-zinc-300 break-all">
                        ?url=<span className="font-bold text-emerald-400">Link_Video</span>&apikey=<span className="font-bold text-emerald-400">Key</span>
                      </span>
                    </div>
                    <div className="pt-2 border-t border-zinc-700">
                      <span className="text-blue-400">{t.testArea.requestStructure.fullUrl}:</span>
                      <div className="mt-1 text-zinc-300 break-all">
                        {baseUrl}/api/download?url=<span className="font-bold text-emerald-400">link_video</span>&apikey=<span className="font-bold text-emerald-400">key</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Response Display */}
          {(response || error) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-zinc-300">{t.testArea.response}</Label>
                {response && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyToClipboard}
                    className="text-zinc-400 hover:text-white"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    {t.common.copy}
                  </Button>
                )}
              </div>
              <div className="relative">
                <pre
                  className={`p-4 rounded-lg overflow-auto max-h-96 text-sm font-mono ${
                    error
                      ? "bg-red-500/10 border border-red-500/30 text-red-400"
                      : "bg-zinc-800/50 border border-zinc-700 text-zinc-300"
                  }`}
                >
                  {error ? (
                    <div className="flex items-start gap-2">
                      <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold mb-1">{t.testArea.error}</p>
                        <p>{error}</p>
                        {response && (
                          <div className="mt-3 pt-3 border-t border-red-500/30">
                            <p className="text-xs text-red-500/80 mb-2">
                              {t.testArea.fullResponse}:
                            </p>
                            <pre className="text-xs">
                              {JSON.stringify(getCensoredResponse(), null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    JSON.stringify(getCensoredResponse(), null, 2)
                  )}
                </pre>
              </div>
            </div>
          )}

          {/* Info Card */}
          <div className="p-4 rounded-lg bg-zinc-800/30 border border-zinc-700/50">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">
                  {t.testArea.info.title}
                </p>
                <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside">
                  <li>{t.testArea.info.tip1}</li>
                  <li>{t.testArea.info.tip2}</li>
                  <li>{t.testArea.info.tip3}</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

