import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
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

    // Pending: No partner assigned, Order Placed
    // Active: Partner assigned, not Delivered
    const pendingResult = db.exec(`
      SELECT id, total_price, status, latitude, longitude, delivery_address, delivery_note, created_at 
      FROM orders 
      WHERE partner_id IS NULL AND status = 'Order Placed'
      ORDER BY created_at DESC
    `);
    
    const activeResult = db.exec(`
      SELECT id, total_price, status, latitude, longitude, delivery_address, delivery_note, created_at 
      FROM orders 
      WHERE partner_id = ? AND status != 'Delivered'
    `, [Number(sessionId)]);

    const formatOrders = (result: any) => {
      if (result.length === 0) return [];
      return result[0].values.map((row: any) => ({
        id: row[0],
        total_price: row[1],
        status: row[2],
        latitude: row[3],
        longitude: row[4],
        delivery_address: row[5],
        delivery_note: row[6],
        created_at: row[7]
      }));
    };

    return NextResponse.json({
      pending: formatOrders(pendingResult),
      active: formatOrders(activeResult)
    });
  } catch (error: unknown) {
    console.error('Partner orders fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
