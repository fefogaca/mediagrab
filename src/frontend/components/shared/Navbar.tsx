"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@frontend/components/ui/button";
import { Menu, X, Globe } from "lucide-react";
import { LogoLongDark } from "./Logo";
import { useTranslation } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@frontend/components/ui/dropdown-menu";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useTranslation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center">
            <LogoLongDark height={28} />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/docs" className="text-zinc-400 hover:text-white transition-colors">
              {t.nav.docs}
            </Link>
            <Link href="/pricing" className="text-zinc-400 hover:text-white transition-colors">
              {t.nav.pricing}
            </Link>
            <Link href="/contact" className="text-zinc-400 hover:text-white transition-colors">
              {t.nav.contact}
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {/* Language Toggle */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-zinc-400 hover:text-white">
                  <Globe className="h-4 w-4" />
                  <span>{language === 'pt' ? 'PT' : 'EN'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                <DropdownMenuItem 
                  onClick={() => setLanguage('pt')}
                  className={`cursor-pointer ${language === 'pt' ? 'bg-zinc-800' : ''}`}
                >
                  🇧🇷 Português
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setLanguage('en')}
                  className={`cursor-pointer ${language === 'en' ? 'bg-zinc-800' : ''}`}
                >
                  🇺🇸 English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Link href="/login">
              <Button variant="ghost" className="text-zinc-400 hover:text-white">
                {t.nav.login}
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white">
                {t.nav.register}
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-zinc-400"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-zinc-900 border-b border-zinc-800">
          <div className="px-4 py-4 space-y-3">
            <Link href="/docs" className="block text-zinc-400 hover:text-white py-2" onClick={() => setMobileMenuOpen(false)}>
              {t.nav.docs}
            </Link>
            <Link href="/pricing" className="block text-zinc-400 hover:text-white py-2" onClick={() => setMobileMenuOpen(false)}>
              {t.nav.pricing}
            </Link>
            <Link href="/contact" className="block text-zinc-400 hover:text-white py-2" onClick={() => setMobileMenuOpen(false)}>
              {t.nav.contact}
            </Link>
            
            {/* Mobile Language Toggle */}
            <div className="flex items-center gap-2 py-2">
              <Globe className="h-4 w-4 text-zinc-400" />
              <button 
                onClick={() => setLanguage('pt')}
                className={`px-2 py-1 rounded ${language === 'pt' ? 'bg-emerald-600 text-white' : 'text-zinc-400'}`}
              >
                PT
              </button>
              <button 
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded ${language === 'en' ? 'bg-emerald-600 text-white' : 'text-zinc-400'}`}
              >
                EN
              </button>
            </div>
            
            <div className="pt-4 flex flex-col gap-2">
              <Link href="/login">
                <Button variant="outline" className="w-full border-zinc-700 text-zinc-300">
                  {t.nav.login}
                </Button>
              </Link>
              <Link href="/register">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
                  {t.nav.register}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

