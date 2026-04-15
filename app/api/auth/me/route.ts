import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const db = await getDb();
    const result = db.exec('SELECT id, name, email, phone, role FROM users WHERE id = ?', [Number(sessionId)]);

    if (result.length === 0 || result[0].values.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const row = result[0].values[0];
    return NextResponse.json({
      user: { id: row[0], name: row[1], email: row[2], phone: row[3], role: row[4] },
    });
  } catch (error: unknown) {
    console.error('Auth check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
