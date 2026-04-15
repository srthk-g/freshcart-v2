import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = request.cookies.get('session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const db = await getDb();
    const userResult = db.exec('SELECT role FROM users WHERE id = ?', [Number(sessionId)]);
    if (userResult.length === 0 || userResult[0].values[0][0] !== 'partner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { action, status } = await request.json();

    if (action === 'accept') {
      db.run(
        'UPDATE orders SET partner_id = ?, status = ? WHERE id = ? AND partner_id IS NULL',
        [Number(sessionId), 'Packed', Number(params.id)]
      );
      saveDb();
      return NextResponse.json({ success: true });
    }
    
    if (action === 'update_status' && status) {
      db.run(
        'UPDATE orders SET status = ? WHERE id = ? AND partner_id = ?',
        [status, Number(params.id), Number(sessionId)]
      );
      saveDb();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Partner orders update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
