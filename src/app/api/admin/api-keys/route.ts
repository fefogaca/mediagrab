import { NextResponse } from 'next/server';
import connectDB from '@backend/lib/mongodb';
import ApiKey from '@backend/models/ApiKey';
import mongoose from 'mongoose';
import User from '@models/User';

export async function GET() {
  try {
    await connectDB();
    
    // Buscar API keys com informações do usuário
    const apiKeys = await ApiKey.find()
      .populate('userId', 'name email plan role')
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json({ apiKeys }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch API keys:', error);
    return NextResponse.json({ message: 'Failed to fetch API keys', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, name, usageLimit } = await request.json();

    // Validações
    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    if (!name || name.trim() === '') {
      return NextResponse.json({ message: 'Key name is required' }, { status: 400 });
    }

    // Validar se userId é um ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
    }

    await connectDB();
    
    // Verificar se o usuário existe
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Gerar a key
    const key = `mg_${require('crypto').randomBytes(32).toString('hex')}`;
    const finalUsageLimit = usageLimit && usageLimit > 0 ? usageLimit : 1000;

    // Criar a API Key
    const apiKey = await ApiKey.create({
      key,
      name: name.trim(),
      userId: new mongoose.Types.ObjectId(userId),
      usageLimit: finalUsageLimit,
      isActive: true,
      usageCount: 0,
    });

    // Popular o userId para retornar dados completos
    await apiKey.populate('userId', 'name email plan role');

    return NextResponse.json({ 
      message: 'API key created successfully', 
      apiKey: {
        _id: apiKey._id,
        key: apiKey.key,
        name: apiKey.name,
        userId: apiKey.userId,
        usageLimit: apiKey.usageLimit,
        usageCount: apiKey.usageCount,
        isActive: apiKey.isActive,
        createdAt: apiKey.createdAt,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create API key:', error);
    
    // Tratar erros específicos do MongoDB
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({ 
        message: 'Validation error', 
        error: Object.values(error.errors).map(e => e.message).join(', ')
      }, { status: 400 });
    }

    if (error instanceof mongoose.Error.CastError) {
      return NextResponse.json({ 
        message: 'Invalid data format', 
        error: error.message 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      message: 'Failed to create API key', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}
