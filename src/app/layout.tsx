'use client';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
  currentTheme: string;
  changeCurrentTheme: (newTheme: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: 'light',
  changeCurrentTheme: () => {},
});

interface ThemeProviderProps {
  children: ReactNode;
}

function ThemeProvider({ children }: ThemeProviderProps) {  
  const [theme, setTheme] = useState<string>('light');

  useEffect(() => {
    const persistedTheme = localStorage.getItem('theme');
    if (persistedTheme) {
      setTheme(persistedTheme);
    }
  }, []);

  const changeCurrentTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    }
  }, [theme]);

  return <ThemeContext.Provider value={{ currentTheme: theme, changeCurrentTheme }}>{children}</ThemeContext.Provider>;
}

export const useThemeProvider = () => useContext(ThemeContext);

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body> 
    </html>
  );
}