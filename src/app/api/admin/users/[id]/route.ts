import { NextResponse } from 'next/server';
import { openDb } from '@/lib/database';
import bcrypt from 'bcryptjs';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id;

  try {
    const db = await openDb();
    const user = await db.get('SELECT id, username, role FROM users WHERE id = ?', id);

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return NextResponse.json({ message: 'Failed to fetch user', error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Extract user ID from the awaited params object
  const { id } = await params;
  // Extract update fields from the request body
  const { username, password, role } = await request.json();

  // Validate if any fields are provided for update
  if (!username && !password && !role) {
    return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
  }

  try {
    const db = await openDb();
    let updateQuery = 'UPDATE users SET';
    const updateParams: (string | number)[] = [];
    const fields: string[] = [];

    // Conditionally add fields to update query
    if (username) {
      fields.push('username = ?');
      updateParams.push(username);
    }
    if (password) {
      // Hash password before updating for security
      const hashedPassword = await bcrypt.hash(password, 10);
      fields.push('password = ?');
      updateParams.push(hashedPassword);
    }
    if (role) {
      fields.push('role = ?');
      updateParams.push(role);
    }

    // Construct the final update query
    updateQuery += ' ' + fields.join(', ') + ' WHERE id = ?';
    updateParams.push(id);

    // Execute the update query
    const result = await db.run(updateQuery, ...updateParams);

    // Check if any rows were affected
    if (result.changes === 0) {
      return NextResponse.json({ message: 'User not found or no changes made' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ message: 'Failed to update user', error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const db = await openDb();
    const result = await db.run('DELETE FROM users WHERE id = ?', id);

    if (result.changes === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ message: 'Failed to delete user', error: (error as Error).message }, { status: 500 });
  }
}
