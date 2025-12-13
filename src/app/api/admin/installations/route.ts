import { NextResponse } from 'next/server';
import { connectDB } from '@backend/lib/database';
import prisma from '@backend/lib/database';
import jwt from 'jsonwebtoken';
import { getJWTSecret } from '@backend/lib/secrets';
import { cookies } from 'next/headers';

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

// POST - Receber dados de instalação do bot
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bot_phone, developer_name, developer_phone, installation_date, bot_name, version } = body;

    // Validação de campos obrigatórios
    if (!bot_phone || !developer_name || !installation_date) {
      return NextResponse.json(
        { success: false, error: 'bot_phone, developer_name e installation_date são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar formato do número de telefone (apenas dígitos)
    const phoneRegex = /^\d+$/;
    if (!phoneRegex.test(bot_phone)) {
      return NextResponse.json(
        { success: false, error: 'bot_phone deve conter apenas dígitos' },
        { status: 400 }
      );
    }

    if (developer_phone && !phoneRegex.test(developer_phone)) {
      return NextResponse.json(
        { success: false, error: 'developer_phone deve conter apenas dígitos' },
        { status: 400 }
      );
    }

    // Validar formato da data ISO 8601
    const installationDate = new Date(installation_date);
    if (isNaN(installationDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'installation_date deve ser uma data válida no formato ISO 8601' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verificar se já existe instalação com o mesmo bot_phone
    const existing = await prisma.botInstallation.findUnique({
      where: { botPhone: bot_phone }
    });

    if (existing) {
      // Atualizar registro existente
      const updated = await prisma.botInstallation.update({
        where: { botPhone: bot_phone },
        data: {
          developerName: developer_name,
          developerPhone: developer_phone || null,
          installationDate: installationDate,
          botName: bot_name || 'MediaGrab',
          version: version || '1.0.0',
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Installation tracked successfully',
        id: updated.id
      }, { status: 200 });
    }

    // Criar novo registro
    const installation = await prisma.botInstallation.create({
      data: {
        botPhone: bot_phone,
        developerName: developer_name,
        developerPhone: developer_phone || null,
        installationDate: installationDate,
        botName: bot_name || 'MediaGrab',
        version: version || '1.0.0',
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Installation tracked successfully',
      id: installation.id
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error tracking installation:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Listar instalações (apenas admin)
export async function GET(request: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const developer = searchParams.get('developer') || '';
    const dateFrom = searchParams.get('date_from') || '';
    const dateTo = searchParams.get('date_to') || '';

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    if (search) {
      where.OR = [
        { botPhone: { contains: search } },
        { developerName: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (developer) {
      where.developerName = { contains: developer, mode: 'insensitive' };
    }

    if (dateFrom || dateTo) {
      where.installationDate = {};
      if (dateFrom) {
        where.installationDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.installationDate.lte = new Date(dateTo);
      }
    }

    // Buscar instalações
    // Fazer queries separadas e sequenciais para evitar problemas com Session Pooler
    let installations;
    let total;
    
    try {
      installations = await prisma.botInstallation.findMany({
        where,
        orderBy: { installationDate: 'desc' },
        skip,
        take: limit,
      });
    } catch (error) {
      console.error('Error in findMany:', error);
      // Tentar novamente com uma query mais simples
      installations = await prisma.botInstallation.findMany({
        orderBy: { installationDate: 'desc' },
        skip,
        take: limit,
      });
    }
    
    // Fazer count separadamente com pequeno delay para evitar problemas com prepared statements
    await new Promise(resolve => setTimeout(resolve, 100));
    try {
      total = await prisma.botInstallation.count({ where });
    } catch (error) {
      console.error('Error in count:', error);
      // Fallback: contar manualmente
      const allInstallations = await prisma.botInstallation.findMany();
      total = allInstallations.length;
    }

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: installations.map(inst => ({
        id: inst.id,
        bot_phone: inst.botPhone,
        developer_name: inst.developerName,
        developer_phone: inst.developerPhone,
        installation_date: inst.installationDate.toISOString(),
        bot_name: inst.botName,
        version: inst.version,
        created_at: inst.createdAt.toISOString(),
        updated_at: inst.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages
      }
    });
  } catch (error: any) {
    console.error('Error fetching installations:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

