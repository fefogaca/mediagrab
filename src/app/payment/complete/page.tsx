"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@frontend/components/ui/card";
import { Button } from "@frontend/components/ui/button";
import { CheckCircle, ArrowRight, Loader2, PartyPopper } from "lucide-react";

function PaymentCompleteContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [planName, setPlanName] = useState('');

  useEffect(() => {
    const completePurchase = async () => {
      const plan = searchParams.get('plan');
      const billingId = searchParams.get('billing_id');
      const sessionId = searchParams.get('session_id'); // Para Stripe

      if (plan) setPlanName(plan);

      try {
        // Verificar e confirmar a compra
        const response = await fetch('/api/payment/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan,
            billingId,
            sessionId,
          }),
        });

        if (response.ok) {
        }
      } catch (error) {
        console.error('Erro ao completar compra:', error);
      } finally {
        setLoading(false);
      }
    };

    completePurchase();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-zinc-900/80 border-zinc-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-emerald-500 animate-spin mb-4" />
            <p className="text-zinc-400">Confirmando seu pagamento...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-900/80 border-zinc-800">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <CheckCircle className="h-20 w-20 text-emerald-500" />
              <PartyPopper className="h-8 w-8 text-yellow-500 absolute -top-2 -right-2" />
            </div>
          </div>
          <CardTitle className="text-2xl text-emerald-500">
            Parabéns! 🎉
          </CardTitle>
          <CardDescription className="text-zinc-400 text-lg">
            Seu pagamento foi confirmado com sucesso!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {planName && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-center">
              <p className="text-zinc-300">Plano ativado:</p>
              <p className="text-2xl font-bold text-emerald-400 capitalize">{planName}</p>
            </div>
          )}
          
          <div className="space-y-2 text-sm text-zinc-400">
            <p>✓ Seus limites foram atualizados</p>
            <p>✓ Novos recursos desbloqueados</p>
            <p>✓ Suporte prioritário ativado</p>
          </div>

          <Link href="/dashboard" className="block">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
              Ir para Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          
          <Link href="/dashboard/api-keys" className="block">
            <Button variant="ghost" className="w-full text-zinc-400">
              Criar nova API Key
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentCompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
      </div>
    }>
      <PaymentCompleteContent />
    </Suspense>
  );
}

