"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@frontend/components/ui/button";
import { Input } from "@frontend/components/ui/input";
import { Label } from "@frontend/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@frontend/components/ui/card";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User, Github, Chrome, Globe } from "lucide-react";
import { LogoSmallDark } from "@frontend/components/shared/Logo";
import { useTranslation } from "@/lib/i18n";

export default function RegisterPage() {
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  
  // Refs para compatibilidade com automação de browser
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Pegar valores diretamente dos inputs para compatibilidade com automação
    const name = nameRef.current?.value || formData.name;
    const email = emailRef.current?.value || formData.email;
    const password = passwordRef.current?.value || formData.password;
    const confirmPassword = confirmPasswordRef.current?.value || formData.confirmPassword;
    
    if (password !== confirmPassword) {
      toast.error(t.register.errors.passwordMismatch);
      return;
    }

    if (password.length < 8) {
      toast.error(t.register.errors.weakPassword);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || (language === 'pt' ? "Erro ao criar conta" : "Error creating account"));
      }

      toast.success(language === 'pt' ? "Conta criada com sucesso! Faça login." : "Account created! Please log in.");
      router.push("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (language === 'pt' ? "Erro ao criar conta" : "Error creating account"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-4">
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
      
      <Card className="w-full max-w-md relative z-10 bg-zinc-900/80 border-zinc-800 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity">
              <LogoSmallDark size={56} className="rounded-xl" />
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold text-white">{t.register.title}</CardTitle>
          <CardDescription className="text-zinc-400">
            {t.register.subtitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-300">{t.register.name}</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input
                  ref={nameRef}
                  id="name"
                  type="text"
                  placeholder={t.register.namePlaceholder}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-9 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">{t.register.email}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input
                  ref={emailRef}
                  id="email"
                  type="email"
                  placeholder={t.register.emailPlaceholder}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-9 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300">{t.register.password}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input
                  ref={passwordRef}
                  id="password"
                  type="password"
                  placeholder={t.register.passwordPlaceholder}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-9 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-zinc-300">{t.register.confirmPassword}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input
                  ref={confirmPasswordRef}
                  id="confirmPassword"
                  type="password"
                  placeholder={t.register.confirmPasswordPlaceholder}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="pl-9 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                  required
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.register.registering}
                </>
              ) : (
                t.register.registerBtn
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-900 px-2 text-zinc-500">
                {language === 'pt' ? 'Ou cadastre-se com' : 'Or sign up with'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
              onClick={() => toast.info(language === 'pt' ? "Login com Google em breve!" : "Google login coming soon!")}
            >
              <Chrome className="mr-2 h-4 w-4" />
              Google
            </Button>
            <Button 
              variant="outline" 
              className="bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
              onClick={() => toast.info(language === 'pt' ? "Login com GitHub em breve!" : "GitHub login coming soon!")}
            >
              <Github className="mr-2 h-4 w-4" />
              GitHub
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <p className="text-center text-sm text-zinc-400">
            {t.register.hasAccount}{" "}
            <Link href="/login" className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors">
              {t.register.loginLink}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
