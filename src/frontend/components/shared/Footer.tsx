"use client";

import Link from "next/link";
import { LogoLongDark } from "./Logo";
import { useTranslation } from "@/lib/i18n";

export function Footer() {
  const { t } = useTranslation();
  
  return (
    <footer className="border-t border-zinc-800 py-12 px-4 bg-zinc-950">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center mb-4">
              <LogoLongDark height={24} />
            </Link>
            <p className="text-zinc-400 text-sm">
              {t.footer.description}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">{t.footer.product}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/docs" className="text-zinc-400 hover:text-white transition-colors">{t.nav.docs}</Link></li>
              <li><Link href="/pricing" className="text-zinc-400 hover:text-white transition-colors">{t.nav.pricing}</Link></li>
              <li><Link href="/docs" className="text-zinc-400 hover:text-white transition-colors">{t.footer.apiReference}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">{t.footer.company}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/contact" className="text-zinc-400 hover:text-white transition-colors">{t.nav.contact}</Link></li>
              <li><Link href="/terms" className="text-zinc-400 hover:text-white transition-colors">{t.footer.terms}</Link></li>
              <li><Link href="/privacy" className="text-zinc-400 hover:text-white transition-colors">{t.footer.privacy}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">{t.footer.support}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:support@mediagrab.com" className="text-zinc-400 hover:text-white transition-colors">support@mediagrab.com</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-zinc-800 mt-12 pt-8 text-center text-sm text-zinc-500">
          {t.footer.copyright}
        </div>
      </div>
    </footer>
  );
}
