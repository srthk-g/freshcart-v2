import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const db = await getDb();

    // Check if user exists
    const existing = db.exec('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0 && existing[0].values.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(password, 10);
    db.run(
      'INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
      [name, email, phone || '', password_hash]
    );
    saveDb();

    // Get the inserted user
    const result = db.exec('SELECT id, name, email, phone FROM users WHERE email = ?', [email]);
    const row = result[0].values[0];
    const user = { id: row[0], name: row[1], email: row[2], phone: row[3] };

    const response = NextResponse.json({ user }, { status: 201 });
    response.cookies.set('session', String(user.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
