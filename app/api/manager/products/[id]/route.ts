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
    
    // Verify user is manager
    const userResult = db.exec('SELECT role FROM users WHERE id = ?', [Number(sessionId)]);
    if (userResult.length === 0 || userResult[0].values[0][0] !== 'manager') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { price, stock } = await request.json();

    if (price === undefined || stock === undefined) {
      return NextResponse.json({ error: 'Price and stock are required' }, { status: 400 });
    }

    db.run(
      'UPDATE products SET price = ?, stock = ? WHERE id = ?',
      [Number(price), Number(stock), Number(params.id)]
    );
    saveDb();

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Manager product update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
