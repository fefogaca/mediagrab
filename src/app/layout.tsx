import type { Metadata } from "next";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { ThemeProvider } from "@/app/components/ThemeProvider";
import { Toaster } from "@frontend/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediaGrab - The Ultimate Media Downloading API",
  description: "Download media from 1000+ platforms. Powerful, reliable, and easy to integrate API.",
  keywords: ["media download", "video download", "API", "youtube download", "instagram download"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="antialiased min-h-screen bg-zinc-950 text-white">
        <ThemeProvider>
          <LanguageProvider>
            {children}
            <Toaster />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
