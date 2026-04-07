import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = request.cookies.get('session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const db = await getDb();
    const orderId = Number(params.id);

    const orderResult = db.exec(
      'SELECT id, user_id, total_price, status, latitude, longitude, created_at, delivery_address, delivery_note FROM orders WHERE id = ? AND user_id = ?',
      [orderId, Number(sessionId)]
    );

    if (orderResult.length === 0 || orderResult[0].values.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const row = orderResult[0].values[0];
    const order = {
      id: row[0],
      user_id: row[1],
      total_price: row[2],
      status: row[3],
      latitude: row[4],
      longitude: row[5],
      created_at: row[6],
      delivery_address: row[7] || '',
      delivery_note: row[8] || '',
    };

    // Get order items
    const itemsResult = db.exec(
      `SELECT oi.id, oi.quantity, oi.price, p.name, p.image_url
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    let items: { id: number; quantity: number; price: number; name: string; image_url: string }[] = [];
    if (itemsResult.length > 0) {
      items = itemsResult[0].values.map((r: (string | number | null | Uint8Array)[]) => ({
        id: r[0] as number,
        quantity: r[1] as number,
        price: r[2] as number,
        name: r[3] as string,
        image_url: r[4] as string,
      }));
    }

    return NextResponse.json({ order, items });
  } catch (error: unknown) {
    console.error('Order detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
