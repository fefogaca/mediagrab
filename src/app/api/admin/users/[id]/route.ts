import { NextResponse } from 'next/server';
import { connectDB } from '@backend/lib/database';
import prisma from '@backend/lib/database';
import User from '@models/User';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await connectDB();
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        emailVerified: true,
        image: true,
      }
    });
    
    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return NextResponse.json({ message: 'Erro ao buscar usuário', error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    
    await connectDB();
    
    // Remover campos que não devem ser atualizados diretamente
    delete updates.password;
    delete updates.id;
    
    const user = await User.findByIdAndUpdate(id, updates);
    
    // Buscar sem password
    const userWithoutPassword = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        emailVerified: true,
        image: true,
      }
    });
    
    if (!userWithoutPassword) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Usuário atualizado', user: userWithoutPassword }, { status: 200 });
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ message: 'Erro ao atualizar usuário', error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await connectDB();
    
    // Primeiro, verificar se o usuário existe e se é admin
    const user = await User.findById(id);
    
    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }
    
    // Impedir exclusão de administradores
    if (user.role === 'admin') {
      return NextResponse.json({ 
        message: 'Não é possível excluir um administrador. Remova o cargo de admin primeiro.' 
      }, { status: 403 });
    }
    
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: 'Usuário excluído com sucesso' }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ message: 'Erro ao excluir usuário', error: (error as Error).message }, { status: 500 });
  }
}
