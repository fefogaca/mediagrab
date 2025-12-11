"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@frontend/components/ui/card";
import { Button } from "@frontend/components/ui/button";
import { Badge } from "@frontend/components/ui/badge";
import { toast } from "sonner";
import {
  Check,
  Zap,
  Star,
  Crown,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  limits: {
    requests: number;
    apiKeys: number;
  };
  icon: React.ElementType;
  popular?: boolean;
  color: string;
  paymentLink?: string;
}

export default function SubscriptionPage() {
  const { t } = useTranslation();
  const [currentPlan, setCurrentPlan] = useState("free");
  const [loading, setLoading] = useState(true);
  
  const plans: Plan[] = [
    {
      id: "free",
      name: t.pricing.plans.free.name,
      description: t.pricing.plans.free.description,
      price: 0,
      features: t.pricing.plans.free.features,
      limits: { requests: 5, apiKeys: 1 },
      icon: Star,
      color: "zinc",
    },
    {
      id: "developer",
      name: t.pricing.plans.developer.name,
      description: t.pricing.plans.developer.description,
      price: 2.00,
      features: t.pricing.plans.developer.features,
      limits: { requests: 1000, apiKeys: 5 },
      icon: Zap,
      color: "blue",
    },
    {
      id: "startup",
      name: t.pricing.plans.startup.name,
      description: t.pricing.plans.startup.description,
      price: 6.00,
      features: t.pricing.plans.startup.features,
      limits: { requests: 10000, apiKeys: 20 },
      icon: Rocket,
      popular: true,
      color: "purple",
    },
    {
      id: "enterprise",
      name: t.pricing.plans.enterprise.name,
      description: t.pricing.plans.enterprise.description,
      price: 10.00,
      features: t.pricing.plans.enterprise.features,
      limits: { requests: -1, apiKeys: -1 },
      icon: Crown,
      color: "amber",
    },
  ];

  useEffect(() => {
    fetchCurrentPlan();
  }, []);

  const fetchCurrentPlan = async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();
      setCurrentPlan(data.user?.plan || "free");
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (planId === currentPlan) {
      toast.info(t.pricing.alreadyOnPlan);
      return;
    }

    if (planId === "free") {
      toast.info(t.pricing.cannotDowngrade);
      return;
    }

    const plan = plans.find(p => p.id === planId);
    if (!plan) {
      toast.error("Plano não encontrado");
      return;
    }

    try {
      toast.info("Redirecionando para pagamento...");
      
      // Criar sessão de checkout no Stripe
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: planId }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Redirecionar para checkout do Stripe
        window.location.href = data.url;
      } else {
        // Verificar se é erro de "coming soon"
        if (data.error === 'coming_soon' || data.message?.includes('coming soon')) {
          toast.info(t.pricing.comingSoon, {
            description: t.pricing.comingSoonDescription,
            duration: 5000,
          });
        } else {
          toast.error(data.error || t.common.error);
        }
      }
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      toast.error(t.common.error);
    }
  };

  const getPlanColorClasses = (color: string, isCurrentPlan: boolean) => {
    const colors: Record<string, { border: string; bg: string; button: string }> = {
      zinc: {
        border: isCurrentPlan ? "border-zinc-500" : "border-zinc-800",
        bg: "bg-zinc-500/10",
        button: "bg-zinc-600 hover:bg-zinc-500",
      },
      blue: {
        border: isCurrentPlan ? "border-blue-500" : "border-zinc-800",
        bg: "bg-blue-500/10",
        button: "bg-blue-600 hover:bg-blue-500",
      },
      purple: {
        border: isCurrentPlan ? "border-purple-500" : "border-zinc-800",
        bg: "bg-purple-500/10",
        button: "bg-purple-600 hover:bg-purple-500",
      },
      amber: {
        border: isCurrentPlan ? "border-amber-500" : "border-zinc-800",
        bg: "bg-amber-500/10",
        button: "bg-amber-600 hover:bg-amber-500",
      },
    };
    return colors[color] || colors.zinc;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-zinc-800 rounded w-48 animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-96 bg-zinc-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white">{t.pricing.title}</h1>
        <p className="text-zinc-400 mt-2">
          {t.pricing.subtitle}
        </p>
      </div>

      {/* Current Plan Badge */}
      <div className="flex justify-center">
        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 px-4 py-1">
          {t.dashboard.currentPlan}: {plans.find(p => p.id === currentPlan)?.name || "Free"}
        </Badge>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const isCurrentPlan = plan.id === currentPlan;
          const colorClasses = getPlanColorClasses(plan.color, isCurrentPlan);
          
          return (
            <Card 
              key={plan.id} 
              className={cn(
                "bg-zinc-900/50 relative transition-all hover:scale-[1.02] flex flex-col",
                colorClasses.border,
                plan.popular && "ring-2 ring-purple-500/50"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-purple-600 text-white border-0">
                    {t.pricing.mostPopular}
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <div className={cn("w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-4", colorClasses.bg)}>
                  <plan.icon className={`h-6 w-6 text-${plan.color}-500`} />
                </div>
                <CardTitle className="text-white">{plan.name}</CardTitle>
                <CardDescription className="text-zinc-400">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center flex-1 flex flex-col">
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">
                    {plan.price === 0 ? t.pricing.free : `$${plan.price.toFixed(2)}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-zinc-400 text-sm">/{t.pricing.month}</span>
                  )}
                </div>
                <ul className="space-y-3 text-left mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="text-zinc-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                {/* Spacer para empurrar o botão para baixo */}
                <div className="flex-1" />
              </CardContent>
              <CardFooter className="pt-0">
                <Button
                  className={cn("w-full text-white", colorClasses.button)}
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrentPlan}
                >
                  {isCurrentPlan ? t.pricing.currentPlan : t.pricing.choosePlan}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* FAQ */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">{t.pricing.faq.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {t.pricing.faq.items.map((item, index) => (
            <div key={index}>
              <h4 className="font-medium text-white mb-1">{item.question}</h4>
              <p className="text-sm text-zinc-400">
                {item.answer}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

