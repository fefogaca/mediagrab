import sgMail from '@sendgrid/mail';

// Configurar SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@mediagrab.com';
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'MediaGrab';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, unknown>;
}

/**
 * Envia email usando SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.warn('⚠️ SENDGRID_API_KEY não configurada. Email não enviado.');
    console.log('📧 Email que seria enviado:', options);
    return false;
  }

  try {
    const msg: any = {
      to: options.to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: options.subject,
    };

    if (options.templateId) {
      msg.templateId = options.templateId;
      if (options.dynamicTemplateData) {
        msg.dynamicTemplateData = options.dynamicTemplateData;
      }
    } else {
      msg.text = options.text || '';
      msg.html = options.html || options.text || '';
    }

    await sgMail.send(msg);
    console.log(`✅ Email enviado para ${options.to}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    return false;
  }
}

/**
 * Email de boas-vindas
 */
export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: 'Bem-vindo ao MediaGrab! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎬 MediaGrab</h1>
            <p>A API mais poderosa para download de mídia</p>
          </div>
          <div class="content">
            <h2>Olá, ${name}! 👋</h2>
            <p>Seja muito bem-vindo(a) ao MediaGrab!</p>
            <p>Sua conta foi criada com sucesso. Agora você pode:</p>
            <ul>
              <li>✅ Gerar suas API Keys</li>
              <li>✅ Fazer downloads de múltiplas plataformas</li>
              <li>✅ Acompanhar estatísticas de uso</li>
              <li>✅ Gerenciar seu plano</li>
            </ul>
            <p>Pronto para começar?</p>
            <a href="${process.env.NEXT_PUBLIC_WEB_BASE_URL || 'http://localhost:3000'}/dashboard" class="button">Acessar Dashboard</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} MediaGrab. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

/**
 * Email de confirmação de email
 */
export async function sendEmailVerification(to: string, name: string, verificationUrl: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: 'Confirme seu email - MediaGrab',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎬 MediaGrab</h1>
          </div>
          <div class="content">
            <h2>Olá, ${name}! 👋</h2>
            <p>Por favor, confirme seu endereço de email clicando no botão abaixo:</p>
            <a href="${verificationUrl}" class="button">Confirmar Email</a>
            <p style="margin-top: 20px; font-size: 14px; color: #666;">
              Se você não criou esta conta, ignore este email.
            </p>
            <p style="font-size: 12px; color: #999; margin-top: 20px;">
              Link: ${verificationUrl}
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} MediaGrab. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

/**
 * Email de confirmação de pagamento
 */
export async function sendPaymentConfirmation(
  to: string,
  name: string,
  plan: string,
  amount: number,
  paymentMethod: string
): Promise<boolean> {
  const formattedAmount = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount / 100);

  return sendEmail({
    to,
    subject: 'Pagamento Confirmado - MediaGrab',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-row:last-child { border-bottom: none; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Pagamento Confirmado!</h1>
          </div>
          <div class="content">
            <h2>Olá, ${name}! 🎉</h2>
            <p>Seu pagamento foi processado com sucesso!</p>
            
            <div class="details">
              <div class="detail-row">
                <span><strong>Plano:</strong></span>
                <span>${plan}</span>
              </div>
              <div class="detail-row">
                <span><strong>Valor:</strong></span>
                <span>${formattedAmount}</span>
              </div>
              <div class="detail-row">
                <span><strong>Método:</strong></span>
                <span>${paymentMethod}</span>
              </div>
              <div class="detail-row">
                <span><strong>Data:</strong></span>
                <span>${new Date().toLocaleDateString('pt-BR')}</span>
              </div>
            </div>

            <p>Seu plano já está ativo. Aproveite todos os benefícios!</p>
            <a href="${process.env.NEXT_PUBLIC_WEB_BASE_URL || 'http://localhost:3000'}/dashboard" class="button">Ir para Dashboard</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} MediaGrab. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

/**
 * Email de código 2FA
 */
export async function send2FACode(to: string, name: string, code: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: 'Seu código de verificação - MediaGrab',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; text-align: center; }
          .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; background: white; padding: 20px; border-radius: 8px; margin: 20px 0; color: #667eea; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Verificação de Segurança</h1>
          </div>
          <div class="content">
            <h2>Olá, ${name}!</h2>
            <p>Seu código de verificação é:</p>
            <div class="code">${code}</div>
            <p style="color: #666; font-size: 14px;">Este código expira em 10 minutos.</p>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              Se você não solicitou este código, ignore este email.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} MediaGrab. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

/**
 * Email de reset de senha
 */
export async function sendPasswordReset(to: string, name: string, resetUrl: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: 'Redefinir Senha - MediaGrab',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔑 Redefinir Senha</h1>
          </div>
          <div class="content">
            <h2>Olá, ${name}!</h2>
            <p>Recebemos uma solicitação para redefinir sua senha.</p>
            <p>Clique no botão abaixo para criar uma nova senha:</p>
            <a href="${resetUrl}" class="button">Redefinir Senha</a>
            <p style="margin-top: 20px; font-size: 14px; color: #666;">
              Este link expira em 1 hora.
            </p>
            <p style="font-size: 12px; color: #999; margin-top: 20px;">
              Se você não solicitou esta redefinição, ignore este email.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} MediaGrab. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

