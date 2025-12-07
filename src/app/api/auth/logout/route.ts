import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Logout realizado com sucesso' });
  
  response.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // Expira imediatamente
  });

  return response;
}

