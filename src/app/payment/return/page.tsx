"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@frontend/components/ui/card";
import { Button } from "@frontend/components/ui/button";
import { CheckCircle, XCircle, Clock, Loader2, ArrowRight, RefreshCw } from "lucide-react";

type PaymentStatus = 'loading' | 'success' | 'pending' | 'expired' | 'failed';

function PaymentReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [message, setMessage] = useState('');
  const [planName, setPlanName] = useState('');

  useEffect(() => {
    const checkPaymentStatus = async () => {
      const billingId = searchParams.get('billing_id') || searchParams.get('id');
      const paymentStatus = searchParams.get('status');
      const plan = searchParams.get('plan');

      if (plan) setPlanName(plan);

      // Se o status veio como parâmetro
      if (paymentStatus) {
        switch (paymentStatus.toLowerCase()) {
          case 'paid':
          case 'success':
          case 'approved':
            setStatus('success');
            setMessage('Seu pagamento foi confirmado e o plano foi ativado!');
            // Atualizar plano do usuário
            if (plan) {
              await updateUserPlan(plan);
            }
            return;
          case 'pending':
          case 'awaiting':
            setStatus('pending');
            setMessage('Aguardando confirmação do pagamento via PIX.');
            return;
          case 'expired':
            setStatus('expired');
            setMessage('O tempo para pagamento expirou.');
            return;
          case 'failed':
          case 'refused':
          case 'cancelled':
            setStatus('failed');
            setMessage('O pagamento não foi processado.');
            return;
        }
      }

      // Se temos um billing_id, verificar status na API
      if (billingId) {
        try {
          const response = await fetch(`/api/payment/check-status?billing_id=${billingId}`);
          const data = await response.json();
          
          if (data.status === 'PAID' || data.status === 'paid') {
            setStatus('success');
            setMessage('Seu pagamento foi confirmado!');
            if (data.plan) {
              await updateUserPlan(data.plan);
            }
          } else if (data.status === 'PENDING' || data.status === 'pending') {
            setStatus('pending');
            setMessage('Aguardando confirmação do pagamento.');
          } else if (data.status === 'EXPIRED' || data.status === 'expired') {
            setStatus('expired');
            setMessage('O tempo para pagamento expirou.');
          } else {
            setStatus('failed');
            setMessage(data.message || 'Não foi possível processar o pagamento.');
          }
        } catch (error) {
          console.error('Erro ao verificar pagamento:', error);
          // Se não conseguiu verificar, assumir que está pendente
          setStatus('pending');
          setMessage('Verificando status do pagamento...');
        }
      } else {
        // Sem ID, verificar status via Stripe
        setStatus('pending');
        setMessage('Verificando status do pagamento...');
      }
    };

    checkPaymentStatus();
  }, [searchParams]);

  const updateUserPlan = async (plan: string) => {
    try {
      await fetch('/api/user/update-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
    }
  };

  const handleRetry = () => {
    router.push('/dashboard/subscription');
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-16 w-16 text-emerald-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-16 w-16 text-emerald-500" />;
      case 'pending':
        return <Clock className="h-16 w-16 text-yellow-500" />;
      case 'expired':
      case 'failed':
        return <XCircle className="h-16 w-16 text-red-500" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'loading':
        return 'Verificando pagamento...';
      case 'success':
        return 'Pagamento Confirmado!';
      case 'pending':
        return 'Aguardando Pagamento';
      case 'expired':
        return 'Pagamento Expirado';
      case 'failed':
        return 'Pagamento Falhou';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-emerald-500';
      case 'pending':
        return 'text-yellow-500';
      case 'expired':
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-zinc-400';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-900/80 border-zinc-800">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className={`text-2xl ${getStatusColor()}`}>
            {getStatusTitle()}
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {message}
          </CardDescription>
          {planName && status === 'success' && (
            <p className="text-emerald-400 mt-2">
              Plano {planName} ativado com sucesso!
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'success' && (
            <Link href="/dashboard" className="block">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
                Ir para Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          )}
          
          {status === 'pending' && (
            <>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="w-full border-zinc-700 text-zinc-300"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Verificar novamente
              </Button>
              <Link href="/dashboard" className="block">
                <Button variant="ghost" className="w-full text-zinc-400">
                  Ir para Dashboard
                </Button>
              </Link>
            </>
          )}
          
          {(status === 'expired' || status === 'failed') && (
            <>
              <Button 
                onClick={handleRetry} 
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Tentar novamente
              </Button>
              <Link href="/dashboard" className="block">
                <Button variant="ghost" className="w-full text-zinc-400">
                  Voltar ao Dashboard
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
      </div>
    }>
      <PaymentReturnContent />
    </Suspense>
  );
}

