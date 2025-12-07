"use client";

import React from "react";
import { Navbar } from "@frontend/components/shared/Navbar";
import { Footer } from "@frontend/components/shared/Footer";
import { Button } from "@frontend/components/ui/button";
import { Input } from "@frontend/components/ui/input";
import { Label } from "@frontend/components/ui/label";
import { Textarea } from "@frontend/components/ui/textarea";
import { useTranslation } from "@/lib/i18n";
import { Mail, Send } from "lucide-react";

export default function ContactPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />

      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              {t.contact?.title || "Entre em Contato"}
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              {t.contact?.subtitle ||
                "Tem alguma dúvida ou feedback? Adoraríamos ouvir de você."}
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <form
              action="#"
              method="POST"
              className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-8"
            >
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <Label htmlFor="first-name" className="text-zinc-300">
                    {t.contact?.firstName || "Nome"}
                  </Label>
                  <Input
                    type="text"
                    name="first-name"
                    id="first-name"
                    autoComplete="given-name"
                    className="mt-2 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last-name" className="text-zinc-300">
                    {t.contact?.lastName || "Sobrenome"}
                  </Label>
                  <Input
                    type="text"
                    name="last-name"
                    id="last-name"
                    autoComplete="family-name"
                    className="mt-2 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="email" className="text-zinc-300">
                    {t.contact?.email || "Email"}
                  </Label>
                  <Input
                    type="email"
                    name="email"
                    id="email"
                    autoComplete="email"
                    className="mt-2 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="message" className="text-zinc-300">
                    {t.contact?.message || "Mensagem"}
                  </Label>
                  <Textarea
                    name="message"
                    id="message"
                    rows={6}
                    className="mt-2 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>
              <div className="mt-8">
                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {t.contact?.submit || "Enviar Mensagem"}
                </Button>
              </div>
            </form>

            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-2 text-zinc-400">
                <Mail className="h-5 w-5" />
                <a
                  href="mailto:support@mediagrab.com"
                  className="hover:text-emerald-400 transition-colors"
                >
                  support@mediagrab.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
