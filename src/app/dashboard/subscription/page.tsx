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

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "Perfeito para testar",
    price: 0,
    features: [
      "5 requests/mês",
      "1 API Key",
      "Sem marca d'água",
      "Downloads em SD (480p)",
      "Suporte por email",
    ],
    limits: { requests: 5, apiKeys: 1 },
    icon: Star,
    color: "zinc",
  },
  {
    id: "developer",
    name: "Developer",
    description: "Para desenvolvedores",
    price: 10.00,
    features: [
      "1.000 requests/mês",
      "5 API Keys",
      "Sem marca d'água",
      "Downloads em HD (1080p)",
      "Suporte prioritário",
    ],
    limits: { requests: 1000, apiKeys: 5 },
    icon: Zap,
    color: "blue",
    paymentLink: "https://www.abacatepay.com/pay/bill_mj4gYGKxSUJhWAxUrdWs5BGJ",
  },
  {
    id: "startup",
    name: "Startup",
    description: "Para equipes",
    price: 30.00,
    features: [
      "10.000 requests/mês",
      "20 API Keys",
      "Sem marca d'água",
      "Downloads em 4K",
      "Suporte 24/7",
      "Analytics detalhados",
    ],
    limits: { requests: 10000, apiKeys: 20 },
    icon: Rocket,
    popular: true,
    color: "purple",
    paymentLink: "https://www.abacatepay.com/pay/bill_SSsaFnMcCC4YEJsr4cqrwBMC",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Para empresas",
    price: 50.00,
    features: [
      "Requests ilimitados",
      "API Keys ilimitadas",
      "Sem marca d'água",
      "Downloads em 8K",
      "Suporte dedicado",
      "SLA garantido (99.9%)",
    ],
    limits: { requests: -1, apiKeys: -1 },
    icon: Crown,
    color: "amber",
    paymentLink: "https://www.abacatepay.com/pay/bill_tz0LjSeAC3YKpukqNUg3utDe",
  },
];

export default function SubscriptionPage() {
  const [currentPlan, setCurrentPlan] = useState("free");
  const [loading, setLoading] = useState(true);

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
      toast.info("Você já está neste plano");
      return;
    }

    if (planId === "free") {
      toast.info("Não é possível fazer downgrade para o plano Free");
      return;
    }

    const plan = plans.find(p => p.id === planId);
    if (!plan) {
      toast.error("Plano não encontrado");
      return;
    }

    if (plan.paymentLink) {
      toast.info("Redirecionando para pagamento...");
      // Abrir link de pagamento do AbacatePay
      window.open(plan.paymentLink, '_blank');
    } else {
      toast.error("Link de pagamento não disponível");
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
        <h1 className="text-2xl font-bold text-white">Escolha seu Plano</h1>
        <p className="text-zinc-400 mt-2">
          Faça upgrade para desbloquear mais recursos e aumentar seus limites
        </p>
      </div>

      {/* Current Plan Badge */}
      <div className="flex justify-center">
        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 px-4 py-1">
          Plano atual: {plans.find(p => p.id === currentPlan)?.name || "Free"}
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
                    Mais Popular
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
                    {plan.price === 0 ? "Grátis" : `R$${plan.price.toFixed(2).replace(".", ",")}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-zinc-400 text-sm">/mês</span>
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
                  {isCurrentPlan ? "Plano Atual" : "Escolher Plano"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* FAQ */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Perguntas Frequentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-1">Como funciona o upgrade?</h4>
            <p className="text-sm text-zinc-400">
              Ao fazer upgrade, seu plano é ativado imediatamente e os novos limites são aplicados.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-1">Posso fazer downgrade?</h4>
            <p className="text-sm text-zinc-400">
              Sim, você pode fazer downgrade ao final do período de faturamento.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-1">Quais formas de pagamento?</h4>
            <p className="text-sm text-zinc-400">
              Aceitamos PIX, cartão de crédito e boleto bancário via AbacatePay.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

