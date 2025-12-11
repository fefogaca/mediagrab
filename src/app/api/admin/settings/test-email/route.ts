import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getJWTSecret } from '@/backend/lib/secrets';
import sgMail from '@sendgrid/mail';

const JWT_SECRET = getJWTSecret();

interface DecodedToken {
  id: string;
  email: string;
  role: string;
}

async function verifyAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) return false;
    
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    return decoded.role === 'admin';
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { apiKey, fromEmail } = body;

    if (!apiKey || !fromEmail) {
      return NextResponse.json(
        { error: 'API Key e Email Remetente são obrigatórios' },
        { status: 400 }
      );
    }

    // Configurar SendGrid temporariamente
    sgMail.setApiKey(apiKey);

    // Enviar email de teste
    const msg = {
      to: fromEmail, // Enviar para o próprio email remetente
      from: {
        email: fromEmail,
        name: 'MediaGrab',
      },
      subject: 'Teste de Email - MediaGrab',
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
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Email de Teste</h1>
            </div>
            <div class="content">
              <h2>Parabéns! 🎉</h2>
              <p>Seu SendGrid está configurado corretamente!</p>
              <p>Este é um email de teste enviado do painel de administração do MediaGrab.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} MediaGrab. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await sgMail.send(msg);

    return NextResponse.json({ 
      success: true,
      message: 'Email de teste enviado com sucesso!' 
    });
  } catch (error: any) {
    console.error('Erro ao enviar email de teste:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao enviar email de teste',
        message: error.response?.body?.errors?.[0]?.message || error.message || 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

