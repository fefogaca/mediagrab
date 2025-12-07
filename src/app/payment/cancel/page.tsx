"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@frontend/components/ui/card";
import { Button } from "@frontend/components/ui/button";
import { XCircle, ArrowLeft, HelpCircle } from "lucide-react";

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-900/80 border-zinc-800">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-zinc-500" />
          </div>
          <CardTitle className="text-2xl text-white">
            Pagamento Cancelado
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Você cancelou o processo de pagamento. Nenhuma cobrança foi realizada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-zinc-800/50 rounded-lg p-4 text-sm text-zinc-400">
            <p className="flex items-start gap-2">
              <HelpCircle className="h-5 w-5 shrink-0 text-zinc-500" />
              Se você teve algum problema durante o pagamento ou tem dúvidas, 
              nossa equipe está pronta para ajudar.
            </p>
          </div>

          <Link href="/dashboard/subscription" className="block">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Planos
            </Button>
          </Link>
          
          <Link href="/contact" className="block">
            <Button variant="ghost" className="w-full text-zinc-400">
              Entrar em Contato
            </Button>
          </Link>
          
          <Link href="/dashboard" className="block">
            <Button variant="ghost" className="w-full text-zinc-400">
              Ir para Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

