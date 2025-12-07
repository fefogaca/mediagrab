"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@frontend/components/shared/Navbar";
import { Footer } from "@frontend/components/shared/Footer";
import { Button } from "@frontend/components/ui/button";
import { ArrowLeft } from "lucide-react";

const LegalPageLayout = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="min-h-screen bg-zinc-950">
    <Navbar />
    <div className="pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/">
          <Button
            variant="ghost"
            className="mb-6 text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Home
          </Button>
        </Link>
        <h1 className="text-4xl font-bold text-white mb-8">{title}</h1>
        <div className="prose prose-invert prose-zinc max-w-none">
          <div className="text-zinc-300 [&>h2]:text-white [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mt-8 [&>h2]:mb-4 [&>h3]:text-white [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:mt-6 [&>h3]:mb-3 [&>p]:mb-4 [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-4 [&>li]:mb-2">
            {children}
          </div>
        </div>
      </div>
    </div>
    <Footer />
  </div>
);

export default LegalPageLayout;
