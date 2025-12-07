"use client";

import { useState } from "react";
import { Navbar } from "@frontend/components/shared/Navbar";
import { Footer } from "@frontend/components/shared/Footer";
import { Button } from "@frontend/components/ui/button";
import { Badge } from "@frontend/components/ui/badge";
import {
  Card,
  CardContent,
} from "@frontend/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@frontend/components/ui/tabs";
import {
  Key,
  Code,
  Zap,
  ArrowRight,
  Copy,
  Check,
  Book,
  Terminal,
  Globe,
  Shield,
  Youtube,
  Instagram,
  Twitter,
  Facebook,
  Music,
  Video,
  Radio,
  MessageCircle,
  Image,
} from "lucide-react";
import Link from "next/link";

export default function DocsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const endpoints = [
    {
      method: "POST",
      path: "/api/download",
      description: "Inicia um download de mídia",
      auth: true,
    },
    {
      method: "GET",
      path: "/api/download/:id",
      description: "Verifica o status de um download",
      auth: true,
    },
    {
      method: "POST",
      path: "/api/public-download",
      description: "Download público (rate limited)",
      auth: false,
    },
  ];

  const codeExamples = {
    curl: `curl -X POST https://api.mediagrab.com/api/download \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://youtube.com/watch?v=dQw4w9WgXcQ"
  }'`,
    javascript: `const response = await fetch('https://api.mediagrab.com/api/download', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://youtube.com/watch?v=dQw4w9WgXcQ'
  })
});

const data = await response.json();
console.log(data);`,
    python: `import requests

response = requests.post(
    'https://api.mediagrab.com/api/download',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
    },
    json={
        'url': 'https://youtube.com/watch?v=dQw4w9WgXcQ'
    }
)

data = response.json()
print(data)`,
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
              <Book className="h-3 w-3 mr-1" />
              Documentação
            </Badge>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            API Reference
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl">
            Tudo que você precisa para integrar o MediaGrab em sua aplicação. 
            Documentação completa com exemplos práticos.
          </p>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
              <CardContent className="p-6">
                <div className="p-3 rounded-xl bg-emerald-500/10 w-fit mb-4">
                  <Key className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">1. Obter API Key</h3>
                <p className="text-zinc-400 text-sm mb-4">
                  Crie sua conta e gere uma API Key no dashboard
                </p>
                <Link href="/register">
                  <Button variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                    Criar Conta
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
              <CardContent className="p-6">
                <div className="p-3 rounded-xl bg-blue-500/10 w-fit mb-4">
                  <Terminal className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">2. Fazer Requisição</h3>
                <p className="text-zinc-400 text-sm mb-4">
                  Use sua API Key para autenticar as requisições
                </p>
                <code className="text-xs text-zinc-400 bg-zinc-800 px-3 py-2 rounded block overflow-x-auto">
                  Authorization: Bearer YOUR_API_KEY
                </code>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
              <CardContent className="p-6">
                <div className="p-3 rounded-xl bg-purple-500/10 w-fit mb-4">
                  <Zap className="h-6 w-6 text-purple-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">3. Receber Resultado</h3>
                <p className="text-zinc-400 text-sm mb-4">
                  Processe a resposta com os links de download
                </p>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                  JSON Response
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section className="py-12 px-4 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8">Endpoints</h2>
          
          <div className="space-y-4">
            {endpoints.map((endpoint) => (
              <Card key={endpoint.path} className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Badge className={`
                        ${endpoint.method === 'GET' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : ''}
                        ${endpoint.method === 'POST' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : ''}
                      `}>
                        {endpoint.method}
                      </Badge>
                      <code className="text-zinc-300 font-mono">{endpoint.path}</code>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-zinc-400">{endpoint.description}</span>
                      {endpoint.auth && (
                        <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                          <Shield className="h-3 w-3 mr-1" />
                          Auth
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Code Examples */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8">Exemplos de Código</h2>
          
          <Card className="bg-zinc-900/50 border-zinc-800">
            <Tabs defaultValue="curl" className="w-full">
              <div className="border-b border-zinc-800 px-4 pt-4">
                <TabsList className="bg-transparent gap-2">
                  <TabsTrigger value="curl" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                    cURL
                  </TabsTrigger>
                  <TabsTrigger value="javascript" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                    JavaScript
                  </TabsTrigger>
                  <TabsTrigger value="python" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                    Python
                  </TabsTrigger>
                </TabsList>
              </div>
              {Object.entries(codeExamples).map(([key, code]) => (
                <TabsContent key={key} value={key} className="mt-0">
                  <CardContent className="p-0 relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-4 right-4 text-zinc-400 hover:text-white"
                      onClick={() => copyCode(code, key)}
                    >
                      {copiedCode === key ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <pre className="p-6 text-sm text-zinc-300 overflow-x-auto">
                      <code>{code}</code>
                    </pre>
                  </CardContent>
                </TabsContent>
              ))}
            </Tabs>
          </Card>
        </div>
      </section>

      {/* Response Format */}
      <section className="py-12 px-4 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8">Formato de Resposta</h2>
          
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-6">
              <pre className="text-sm text-zinc-300 overflow-x-auto">
                <code>{`{
  "success": true,
  "data": {
    "title": "Nome do Vídeo",
    "provider": {
      "id": "youtube",
      "name": "YouTube"
    },
    "formats": [
      {
        "format_id": "22",
        "ext": "mp4",
        "resolution": "1080p",
        "quality": "hd1080",
        "vcodec": "avc1.64001F",
        "acodec": "mp4a.40.2",
        "filesize_approx": 52428800
      }
    ]
  }
}`}</code>
              </pre>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Supported Platforms */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8">Plataformas Suportadas</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: "YouTube", icon: Youtube, color: "text-red-500" },
              { name: "Instagram", icon: Instagram, color: "text-pink-500" },
              { name: "TikTok", icon: Music, color: "text-cyan-400" },
              { name: "Twitter/X", icon: Twitter, color: "text-sky-400" },
              { name: "Facebook", icon: Facebook, color: "text-blue-500" },
              { name: "Vimeo", icon: Video, color: "text-blue-400" },
              { name: "Twitch", icon: Video, color: "text-purple-500" },
              { name: "Dailymotion", icon: Video, color: "text-blue-300" },
              { name: "SoundCloud", icon: Radio, color: "text-orange-500" },
              { name: "Spotify", icon: Music, color: "text-green-500" },
              { name: "Reddit", icon: MessageCircle, color: "text-orange-400" },
              { name: "Pinterest", icon: Image, color: "text-red-400" },
            ].map((platform) => (
              <Card key={platform.name} className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors group">
                <CardContent className="p-4 text-center">
                  <platform.icon className={`h-6 w-6 ${platform.color} mx-auto mb-2 group-hover:scale-110 transition-transform`} />
                  <span className="text-sm text-zinc-300">{platform.name}</span>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-zinc-500 mt-6">
            E mais de 1000+ outros sites suportados pelo yt-dlp
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-emerald-900/20 to-emerald-800/20 border border-emerald-800/50 rounded-3xl p-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Pronto para começar?
            </h2>
            <p className="text-zinc-400 mb-8">
              Crie sua conta e obtenha sua API Key em segundos.
            </p>
            <Link href="/register">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white px-8">
                Criar Conta Grátis
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
