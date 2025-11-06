'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
  currentTheme: string;
  changeCurrentTheme: (newTheme: string) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  currentTheme: 'light',
  changeCurrentTheme: () => {},
});

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {  
  const [theme, setTheme] = useState<string>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }
    return localStorage.getItem('theme') ?? 'light';
  });

  const changeCurrentTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (theme === 'light') {
      document.body.classList.remove('dark');
      document.body.style.colorScheme = 'light';
    } else {
      document.body.classList.add('dark');
      document.body.style.colorScheme = 'dark';
    }
  }, [theme]);

  return <ThemeContext.Provider value={{ currentTheme: theme, changeCurrentTheme }}>{children}</ThemeContext.Provider>;
}

export const useThemeProvider = () => useContext(ThemeContext);
