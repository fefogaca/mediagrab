import { NextRequest, NextResponse } from "next/server";
import connectDB from "@backend/lib/mongodb";
import User from "@models/User";
import Payment from "@models/Payment";
import { isValidWebhookPayload, AbacateWebhookPayload } from "@services/abacatepay";
import { sendPaymentConfirmation } from "@services/email";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // Validar payload
    if (!isValidWebhookPayload(payload)) {
      console.error("Payload de webhook inválido:", payload);
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    const webhookData = payload as AbacateWebhookPayload;
    const { event, data } = webhookData;
    const billing = data.billing;

    console.log(`📬 Webhook recebido: ${event}`, billing.id);

    await connectDB();

    // Buscar pagamento no banco
    const payment = await Payment.findOne({
      abacatePayBillingId: billing.id,
    }).populate("userId");

    if (!payment) {
      console.error("Pagamento não encontrado:", billing.id);
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Processar evento
    switch (event) {
      case "billing.paid": {
        // Atualizar pagamento
        payment.status = "paid";
        payment.paidAt = new Date();
        await payment.save();

        // Atualizar plano do usuário
        if (payment.planPurchased) {
          const planDuration = payment.planDuration || 1;
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + planDuration);

          await User.findByIdAndUpdate(payment.userId._id, {
            plan: payment.planPurchased,
            planExpiresAt: expiresAt,
          });

          console.log(
            `✅ Plano atualizado para ${payment.planPurchased} para usuário ${payment.userId._id}`
          );
        }

        // Enviar email de confirmação
        const user = await User.findById(payment.userId);
        if (user) {
          await sendPaymentConfirmation(
            user.email,
            user.name,
            payment.planPurchased || "N/A",
            payment.amount,
            payment.method
          );
        }

        break;
      }

      case "billing.expired": {
        payment.status = "expired";
        await payment.save();
        console.log(`⏰ Pagamento expirado: ${billing.id}`);
        break;
      }

      case "billing.refunded": {
        payment.status = "refunded";
        await payment.save();

        // Reverter plano do usuário para free
        if (payment.planPurchased) {
          await User.findByIdAndUpdate(payment.userId._id, {
            plan: "free",
            planExpiresAt: null,
          });
          console.log(`↩️ Plano revertido para free: usuário ${payment.userId._id}`);
        }

        break;
      }

      default:
        console.log(`⚠️ Evento não tratado: ${event}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Erro ao processar webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

