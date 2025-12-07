"use client";

import Link from "next/link";
import { Navbar } from "@frontend/components/shared/Navbar";
import { Footer } from "@frontend/components/shared/Footer";
import { Button } from "@frontend/components/ui/button";
import { Badge } from "@frontend/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@frontend/components/ui/card";
import {
  Check,
  ChevronRight,
  Zap,
  Star,
  Crown,
  Rocket,
  HelpCircle,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function PricingPage() {
  const { t, language } = useTranslation();
  const plans = [
    {
      name: "Free",
      description: "Perfeito para testar",
      price: "0",
      icon: Star,
      color: "zinc",
      features: [
        "5 requests/mês",
        "1 API Key",
        "Qualidade SD (480p)",
        "Sem marca d'água",
        "Suporte por email",
      ],
      limitations: [
        "Rate limit: 5 req/min",
      ],
      cta: "Começar Grátis",
      popular: false,
      href: "/register",
    },
    {
      name: "Developer",
      description: "Para desenvolvedores individuais",
      price: "10,00",
      icon: Zap,
      color: "blue",
      features: [
        "1.000 requests/mês",
        "5 API Keys",
        "Qualidade HD (1080p)",
        "Sem marca d'água",
        "Suporte prioritário",
        "Rate limit: 60 req/min",
      ],
      limitations: [],
      cta: "Assinar Agora",
      popular: false,
      href: "/register?plan=developer",
    },
    {
      name: "Startup",
      description: "Para pequenas empresas",
      price: "30,00",
      icon: Rocket,
      color: "purple",
      features: [
        "10.000 requests/mês",
        "20 API Keys",
        "Qualidade 4K",
        "Sem marca d'água",
        "Suporte 24/7",
        "Rate limit: 200 req/min",
        "Analytics detalhados",
      ],
      limitations: [],
      cta: "Assinar Agora",
      popular: true,
      href: "/register?plan=startup",
    },
    {
      name: "Enterprise",
      description: "Para grandes empresas",
      price: "50,00",
      icon: Crown,
      color: "amber",
      features: [
        "Requests ilimitados",
        "API Keys ilimitadas",
        "Qualidade 8K",
        "Sem marca d'água",
        "Suporte dedicado",
        "Rate limit: ilimitado",
        "Analytics avançados",
        "SLA garantido (99.9%)",
      ],
      limitations: [],
      cta: "Assinar Agora",
      popular: false,
      href: "/register?plan=enterprise",
    },
  ];

  const faqs = [
    {
      question: "Posso mudar de plano a qualquer momento?",
      answer: "Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As mudanças são aplicadas imediatamente.",
    },
    {
      question: "Como funciona o limite de downloads?",
      answer: "O limite é resetado todo mês. Downloads bem-sucedidos contam para o limite. Se você exceder, pode fazer upgrade ou aguardar o próximo mês.",
    },
    {
      question: "Quais formas de pagamento são aceitas?",
      answer: "Aceitamos PIX, cartão de crédito (Visa, Mastercard, Elo) e boleto bancário através do AbacatePay.",
    },
    {
      question: "Tem garantia de reembolso?",
      answer: "Sim! Oferecemos garantia de 7 dias. Se não ficar satisfeito, devolvemos seu dinheiro sem perguntas.",
    },
    {
      question: "O que acontece se eu exceder o rate limit?",
      answer: "Suas requisições serão temporariamente bloqueadas até o período de rate limit resetar (geralmente 1 minuto).",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 mb-6">
            {t.pricing.badge}
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            {t.pricing.title}
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            {t.pricing.subtitle}
          </p>
        </div>
      </section>

      {/* Pricing Grid */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <Card 
                key={plan.name} 
                className={`bg-zinc-900/50 border-zinc-800 relative flex flex-col ${plan.popular ? 'ring-2 ring-emerald-500/50 lg:scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-600 text-white border-0">
                      {t.pricing.popular}
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <div className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-4 bg-${plan.color}-500/10`}>
                    <plan.icon className={`h-6 w-6 text-${plan.color}-500`} />
                  </div>
                  <CardTitle className="text-white">{plan.name}</CardTitle>
                  <CardDescription className="text-zinc-400">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center flex-1">
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">
                      {plan.price === "0" ? t.pricing.free : `R$${plan.price}`}
                    </span>
                    {plan.price !== "0" && <span className="text-zinc-400">{t.pricing.month}</span>}
                  </div>
                  <ul className="space-y-3 text-left">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-zinc-300">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                    {plan.limitations.map((limitation) => (
                      <li key={limitation} className="flex items-start gap-2 text-sm text-zinc-500">
                        <span className="h-4 w-4 shrink-0 mt-0.5 text-center">✕</span>
                        {limitation}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link 
                    href={plan.href} 
                    className="w-full"
                  >
                    <Button 
                      className={`w-full ${plan.popular ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-zinc-800 hover:bg-zinc-700'} text-white`}
                    >
                      {plan.cta}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-4 bg-zinc-900/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Compare os planos
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-4 px-4 text-zinc-400 font-medium">Recurso</th>
                  <th className="py-4 px-4 text-zinc-300 font-medium">Free</th>
                  <th className="py-4 px-4 text-zinc-300 font-medium">Developer</th>
                  <th className="py-4 px-4 text-zinc-300 font-medium">Startup</th>
                  <th className="py-4 px-4 text-zinc-300 font-medium">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Requests/mês", values: ["5", "1.000", "10.000", "Ilimitado"] },
                  { feature: "API Keys", values: ["1", "5", "20", "Ilimitado"] },
                  { feature: "Qualidade máxima", values: ["480p", "1080p", "4K", "8K"] },
                  { feature: "Rate limit", values: ["5/min", "60/min", "200/min", "Ilimitado"] },
                  { feature: "Sem marca d'água", values: [true, true, true, true] },
                  { feature: "Suporte", values: ["Email", "Prioritário", "24/7", "Dedicado"] },
                  { feature: "SLA", values: [false, false, false, true] },
                ].map((row) => (
                  <tr key={row.feature} className="border-b border-zinc-800/50">
                    <td className="py-4 px-4 text-zinc-400">{row.feature}</td>
                    {row.values.map((value, i) => (
                      <td key={i} className="py-4 px-4 text-center">
                        {typeof value === "boolean" ? (
                          value ? (
                            <Check className="h-5 w-5 text-emerald-500 mx-auto" />
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )
                        ) : (
                          <span className="text-zinc-300">{value}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            {t.pricing.faq.title}
          </h2>
          
          <div className="space-y-4">
            {t.pricing.faq.items.map((faq, index) => (
              <Card key={index} className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <HelpCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-white mb-2">{faq.question}</h3>
                      <p className="text-zinc-400 text-sm">{faq.answer}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-emerald-900/20 to-emerald-800/20 border border-emerald-800/50 rounded-3xl p-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              {t.pricing.contact.title}
            </h2>
            <p className="text-zinc-400 mb-8">
              {t.pricing.contact.description}
            </p>
            <Link href="/contact">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white px-8">
                {t.pricing.contact.cta}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
