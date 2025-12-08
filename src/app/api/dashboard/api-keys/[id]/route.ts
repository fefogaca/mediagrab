import { NextRequest, NextResponse } from 'next/server';
import { openDb } from '@/lib/database';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/utils';

interface DecodedToken {
  id: number;
  username: string;
  role: string;
}

function getUserIdFromRequest(request: Request): number | null {
  try {
    const jwtSecret = getJwtSecret();
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      // Tentar pegar do cookie
      const cookies = request.headers.get('cookie');
      if (cookies) {
        const tokenMatch = cookies.match(/token=([^;]+)/);
        if (tokenMatch) {
          const decoded = jwt.verify(tokenMatch[1], jwtSecret);
          if (typeof decoded !== 'string' && 'id' in decoded) {
            return (decoded as DecodedToken).id;
          }
        }
      }
      return null;
    }
    const decoded = jwt.verify(token, jwtSecret);
    if (typeof decoded === 'string' || !('id' in decoded)) {
      return null;
    }
    return (decoded as DecodedToken).id;
  } catch (error) {
    return null;
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = await openDb();

    // Verificar se a API key pertence ao usuário
    const apiKey = await db.get('SELECT * FROM api_keys WHERE id = ? AND user_id = ?', id, userId);
    if (!apiKey) {
      return NextResponse.json({ message: 'API key not found or access denied' }, { status: 404 });
    }

    await db.run('DELETE FROM api_keys WHERE id = ?', id);

    return NextResponse.json({ message: 'API key deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete API key:', error);
    return NextResponse.json({ message: 'Failed to delete API key', error: (error as Error).message }, { status: 500 });
  }
}

