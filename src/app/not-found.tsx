"use client";

import Link from "next/link";
import { Button } from "@frontend/components/ui/button";
import { Home, ArrowLeft, Search, HelpCircle, Globe } from "lucide-react";
import { LogoLongDark } from "@frontend/components/shared/Logo";
import { useTranslation } from "@/lib/i18n";

export default function NotFound() {
  const { t, language, setLanguage } = useTranslation();
  
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      
      {/* Language Toggle */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <Globe className="h-4 w-4 text-zinc-400" />
        <button 
          onClick={() => setLanguage('pt')}
          className={`px-2 py-1 text-sm rounded ${language === 'pt' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'}`}
        >
          PT
        </button>
        <button 
          onClick={() => setLanguage('en')}
          className={`px-2 py-1 text-sm rounded ${language === 'en' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'}`}
        >
          EN
        </button>
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 text-center">
        {/* Logo */}
        <Link href="/" className="mb-8">
          <LogoLongDark height={40} />
        </Link>

        {/* 404 Text */}
        <div className="mb-8">
          <h1 className="text-[150px] sm:text-[200px] font-bold text-zinc-800 leading-none select-none">
            404
          </h1>
          <div className="relative -mt-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              {t.notFound.title}
            </h2>
            <p className="mt-3 text-zinc-400 max-w-md mx-auto">
              {t.notFound.subtitle}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <Link href="/">
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white px-6">
              <Home className="h-4 w-4 mr-2" />
              {t.notFound.home}
            </Button>
          </Link>
          <Button 
            variant="outline" 
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.notFound.back}
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="grid sm:grid-cols-3 gap-4 max-w-2xl w-full">
          <Link 
            href="/docs" 
            className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors group"
          >
            <Search className="h-6 w-6 text-emerald-500 mb-2" />
            <h3 className="font-medium text-white group-hover:text-emerald-400 transition-colors">
              {t.notFound.docs}
            </h3>
            <p className="text-sm text-zinc-500">
              {t.notFound.docsDesc}
            </p>
          </Link>
          
          <Link 
            href="/pricing" 
            className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors group"
          >
            <svg className="h-6 w-6 text-emerald-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="font-medium text-white group-hover:text-emerald-400 transition-colors">
              {t.notFound.pricing}
            </h3>
            <p className="text-sm text-zinc-500">
              {t.notFound.pricingDesc}
            </p>
          </Link>
          
          <Link 
            href="/contact" 
            className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors group"
          >
            <HelpCircle className="h-6 w-6 text-emerald-500 mb-2" />
            <h3 className="font-medium text-white group-hover:text-emerald-400 transition-colors">
              {t.notFound.support}
            </h3>
            <p className="text-sm text-zinc-500">
              {t.notFound.supportDesc}
            </p>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center border-t border-zinc-800/50">
        <p className="text-sm text-zinc-500">
          {t.footer.copyright}
        </p>
      </footer>
    </div>
  );
}
