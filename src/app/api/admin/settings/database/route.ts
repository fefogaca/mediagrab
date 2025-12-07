import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import connectDB from '@/backend/lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET || '';

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

export async function GET() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    // Conectar ao banco
    await connectDB();

    // Verificar status da conexão
    const isConnected = mongoose.connection.readyState === 1;
    
    if (!isConnected) {
      return NextResponse.json({
        connected: false,
        type: 'MongoDB',
        collections: 0,
        collectionNames: [],
      });
    }

    // Obter lista de coleções
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({
        connected: true,
        type: 'MongoDB',
        collections: 0,
        collectionNames: [],
        message: 'Conexão ativa, mas banco não disponível',
      });
    }

    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    // Obter estatísticas básicas
    const stats = await db.stats();

    return NextResponse.json({
      connected: true,
      type: 'MongoDB',
      collections: collectionNames.length,
      collectionNames,
      stats: {
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        objects: stats.objects,
      },
    });

  } catch (error) {
    console.error('Erro ao verificar banco:', error);
    return NextResponse.json({
      connected: false,
      type: 'MongoDB',
      collections: 0,
      collectionNames: [],
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
}

