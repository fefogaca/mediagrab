"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@frontend/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Mail, Lock, Github, Chrome, Globe, Shield, User, Key, Sparkles } from "lucide-react";
import { LogoSmallDark } from "@frontend/components/shared/Logo";
import { useTranslation } from "@/lib/i18n";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const { t, language, setLanguage } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  
  // Setup state
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [setupData, setSetupData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  
  // Refs para compatibilidade com automação de browser
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Verificar se precisa de setup ao carregar
  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    try {
      const response = await fetch("/api/setup/check");
      const data = await response.json();
      
      if (data.needsSetup) {
        setNeedsSetup(true);
        setSetupOpen(true);
      }
    } catch (error) {
      console.error("Erro ao verificar setup:", error);
    } finally {
      setCheckingSetup(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (setupData.password !== setupData.confirmPassword) {
      toast.error(language === 'pt' ? "As senhas não coincidem" : "Passwords don't match");
      return;
    }
    
    if (setupData.password.length < 8) {
      toast.error(language === 'pt' ? "A senha deve ter pelo menos 8 caracteres" : "Password must be at least 8 characters");
      return;
    }
    
    setSetupLoading(true);
    
    try {
      const response = await fetch("/api/setup/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: setupData.name,
          email: setupData.email,
          password: setupData.password,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar administrador");
      }
      
      toast.success(language === 'pt' ? "Administrador criado com sucesso! Faça login." : "Admin created successfully! Please login.");
      setSetupOpen(false);
      setNeedsSetup(false);
      
      // Preencher o email do login
      setFormData(prev => ({ ...prev, email: setupData.email }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar administrador");
    } finally {
      setSetupLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Pegar valores diretamente dos inputs para compatibilidade com automação
    const email = emailRef.current?.value || formData.email;
    const password = passwordRef.current?.value || formData.password;

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.login.errors.invalid);
      }

      toast.success(language === 'pt' ? "Login realizado com sucesso!" : "Login successful!");
      
      // Aguardar um pouco para garantir que o cookie foi salvo
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Redirecionar baseado no callbackUrl ou role
      const redirectPath = callbackUrl || (data.user?.role === "admin" ? "/admin" : "/dashboard");
      
      // Usar window.location.replace para redirecionamento completo
      // Isso evita problemas com o router do Next.js e loops
      window.location.replace(redirectPath);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.login.errors.invalid);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading inicial
  if (checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-zinc-400">{language === 'pt' ? 'Verificando configuração...' : 'Checking configuration...'}</p>
        </div>
      </div>
    );
  }

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

      {/* Setup Dialog */}
      <Dialog open={setupOpen} onOpenChange={(open) => needsSetup && setSetupOpen(open)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-2">
              <div className="p-3 rounded-full bg-emerald-500/10">
                <Sparkles className="h-8 w-8 text-emerald-500" />
              </div>
            </div>
            <DialogTitle className="text-xl text-white text-center">
              {language === 'pt' ? '🎉 Bem-vindo ao MediaGrab!' : '🎉 Welcome to MediaGrab!'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-center">
              {language === 'pt' 
                ? 'Configure seu primeiro administrador para começar a usar o sistema.'
                : 'Set up your first administrator to start using the system.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSetup} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">
                {language === 'pt' ? 'Nome' : 'Name'}
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input
                  value={setupData.name}
                  onChange={(e) => setSetupData({ ...setupData, name: e.target.value })}
                  placeholder={language === 'pt' ? 'Seu nome' : 'Your name'}
                  className="pl-9 bg-zinc-800/50 border-zinc-700 text-white"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-zinc-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input
                  type="email"
                  value={setupData.email}
                  onChange={(e) => setSetupData({ ...setupData, email: e.target.value })}
                  placeholder="admin@exemplo.com"
                  className="pl-9 bg-zinc-800/50 border-zinc-700 text-white"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-zinc-300">
                {language === 'pt' ? 'Senha' : 'Password'}
              </Label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input
                  type="password"
                  value={setupData.password}
                  onChange={(e) => setSetupData({ ...setupData, password: e.target.value })}
                  placeholder="••••••••"
                  className="pl-9 bg-zinc-800/50 border-zinc-700 text-white"
                  required
                  minLength={8}
                />
              </div>
              <p className="text-xs text-zinc-500">
                {language === 'pt' ? 'Mínimo de 8 caracteres' : 'Minimum 8 characters'}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-zinc-300">
                {language === 'pt' ? 'Confirmar Senha' : 'Confirm Password'}
              </Label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input
                  type="password"
                  value={setupData.confirmPassword}
                  onChange={(e) => setSetupData({ ...setupData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="pl-9 bg-zinc-800/50 border-zinc-700 text-white"
                  required
                />
              </div>
            </div>
            
            <DialogFooter className="pt-4">
              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                disabled={setupLoading}
              >
                {setupLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === 'pt' ? 'Criando...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    {language === 'pt' ? 'Criar Administrador' : 'Create Administrator'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <Card className="w-full max-w-md relative z-10 bg-zinc-900/80 border-zinc-800 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity">
              <LogoSmallDark size={56} className="rounded-xl" />
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold text-white">{t.login.title}</CardTitle>
          <CardDescription className="text-zinc-400">
            {t.login.subtitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">{t.login.email}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input
                  ref={emailRef}
                  id="email"
                  type="email"
                  placeholder={t.login.emailPlaceholder}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-9 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-zinc-300">{t.login.password}</Label>
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-emerald-500 hover:text-emerald-400 transition-colors"
                >
                  {t.login.forgotPassword}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input
                  ref={passwordRef}
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                  {t.login.loggingIn}
                </>
              ) : (
                t.login.loginBtn
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-900 px-2 text-zinc-500">{t.login.or} {t.login.continueWith}</span>
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
            {t.login.noAccount}{" "}
            <Link href="/register" className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors">
              {t.login.createAccount}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-zinc-400">Carregando...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
