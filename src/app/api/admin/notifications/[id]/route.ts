import { NextResponse } from 'next/server';
import connectDB from '@backend/lib/mongodb';
import Notification from '@models/Notification';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await connectDB();
    
    const notification = await Notification.findByIdAndDelete(id);
    
    if (!notification) {
      return NextResponse.json({ message: 'Notificação não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Notificação excluída com sucesso' }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete notification:', error);
    return NextResponse.json({ message: 'Erro ao excluir notificação', error: (error as Error).message }, { status: 500 });
  }
}
