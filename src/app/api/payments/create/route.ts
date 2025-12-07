import { NextRequest, NextResponse } from "next/server";
import { auth } from "@backend/lib/auth";
import connectDB from "@backend/lib/mongodb";
import User from "@models/User";
import Payment from "@models/Payment";
import abacatePay, { AbacateCustomer } from "@services/abacatepay";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { plan, yearly = false } = body;

    // Validar plano
    if (!["developer", "startup", "enterprise"].includes(plan)) {
      return NextResponse.json(
        { error: "Plano inválido" },
        { status: 400 }
      );
    }

    await connectDB();

    // Buscar usuário
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se já tem plano pago
    if (user.plan !== "free" && user.planExpiresAt && new Date() < user.planExpiresAt) {
      return NextResponse.json(
        { error: "Você já possui um plano ativo. Cancele o atual primeiro." },
        { status: 400 }
      );
    }

    // Criar dados do cliente para AbacatePay
    const customer: AbacateCustomer = {
      email: user.email,
      name: user.fullName || user.name,
      cellphone: user.phone || undefined,
      taxId: user.taxId || undefined,
    };

    // URLs de retorno
    const baseUrl = process.env.NEXT_PUBLIC_WEB_BASE_URL || "http://localhost:3000";
    const returnUrl = `${baseUrl}/dashboard/subscription`;
    const completionUrl = `${baseUrl}/dashboard/subscription?success=true`;

    // Criar cobrança no AbacatePay
    const billing = await abacatePay.createPlanPayment(
      plan as "developer" | "startup" | "enterprise",
      customer,
      returnUrl,
      completionUrl,
      yearly
    );

    // Salvar pagamento no banco
    const payment = await Payment.create({
      userId: user._id,
      abacatePayBillingId: billing.id,
      abacatePayUrl: billing.url,
      amount: billing.amount,
      method: "PIX", // Default, será atualizado pelo webhook se for cartão
      products: billing.products,
      planPurchased: plan,
      planDuration: yearly ? 12 : 1,
      status: "pending",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos
    });

    return NextResponse.json({
      success: true,
      payment: {
        id: payment._id.toString(),
        billingId: billing.id,
        url: billing.url,
        amount: billing.amount,
        status: billing.status,
      },
    });
  } catch (error) {
    console.error("Erro ao criar pagamento:", error);
    return NextResponse.json(
      { error: "Erro ao criar pagamento" },
      { status: 500 }
    );
  }
}

