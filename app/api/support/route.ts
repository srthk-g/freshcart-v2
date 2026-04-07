import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const db = await getDb();
    const sessionId = request.cookies.get('session')?.value;

    db.run(
      'INSERT INTO support_tickets (user_id, name, email, subject, message) VALUES (?, ?, ?, ?, ?)',
      [sessionId ? Number(sessionId) : null, name, email, subject, message]
    );
    saveDb();

    return NextResponse.json({ success: true, message: 'Support ticket submitted successfully' }, { status: 201 });
  } catch (error: unknown) {
    console.error('Support error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
