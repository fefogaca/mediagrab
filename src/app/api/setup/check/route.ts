import { NextResponse } from 'next/server';
import connectDB from '@backend/lib/mongodb';
import User from '@backend/models/User';

// GET - Verifica se o setup inicial foi feito (se existe algum admin)
export async function GET() {
  try {
    await connectDB();
    
    // Verificar se existe pelo menos um usuário admin
    const adminExists = await User.findOne({ role: 'admin' });
    
    return NextResponse.json({
      needsSetup: !adminExists,
      message: adminExists 
        ? 'Sistema já configurado' 
        : 'Nenhum administrador encontrado. Configure o sistema.'
    });
  } catch (error) {
    console.error('Erro ao verificar setup:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar configuração do sistema' },
      { status: 500 }
    );
  }
}
