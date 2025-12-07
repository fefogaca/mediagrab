"use client";

import { Globe } from "lucide-react";
import { Button } from "@frontend/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@frontend/components/ui/dropdown-menu";
import { useTranslation } from "@/lib/i18n";

export function LanguageToggle() {
  const { language, setLanguage } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-zinc-400 hover:text-white">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{language === 'pt' ? 'PT' : 'EN'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
        <DropdownMenuItem 
          onClick={() => setLanguage('pt')}
          className={`cursor-pointer ${language === 'pt' ? 'bg-zinc-800' : ''}`}
        >
          🇧🇷 Português (Brasil)
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setLanguage('en')}
          className={`cursor-pointer ${language === 'en' ? 'bg-zinc-800' : ''}`}
        >
          🇺🇸 English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

