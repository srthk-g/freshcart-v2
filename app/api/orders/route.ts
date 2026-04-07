import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const db = await getDb();
    const result = db.exec(
      'SELECT id, total_price, status, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [Number(sessionId)]
    );

    if (result.length === 0) {
      return NextResponse.json({ orders: [] });
    }

    const orders = result[0].values.map((row: (string | number | null | Uint8Array)[]) => ({
      id: row[0],
      total_price: row[1],
      status: row[2],
      created_at: row[3],
    }));

    return NextResponse.json({ orders });
  } catch (error: unknown) {
    console.error('Orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { items, deliveryAddress, deliveryNote, deliveryLatitude, deliveryLongitude } = await request.json();
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in order' }, { status: 400 });
    }

    const orderLatitude = typeof deliveryLatitude === 'number' && !Number.isNaN(deliveryLatitude)
      ? deliveryLatitude
      : 19.0760;
    const orderLongitude = typeof deliveryLongitude === 'number' && !Number.isNaN(deliveryLongitude)
      ? deliveryLongitude
      : 72.8777;

    const db = await getDb();

    // Verify stock availability
    for (const item of items) {
      const result = db.exec('SELECT stock FROM products WHERE id = ?', [item.id]);
      if (result.length === 0 || result[0].values.length === 0) {
        return NextResponse.json({ error: `Product ${item.name} not found` }, { status: 400 });
      }
      const stock = result[0].values[0][0] as number;
      if (stock < item.quantity) {
        return NextResponse.json({ error: `${item.name} is out of stock` }, { status: 400 });
      }
    }

    // Calculate total
    const totalPrice = items.reduce((sum: number, item: { price: number; quantity: number }) =>
      sum + item.price * item.quantity, 0
    );

    // Create order with address, selected delivery coordinates, and note
    db.run(
      'INSERT INTO orders (user_id, total_price, status, latitude, longitude, delivery_address, delivery_note) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        Number(sessionId),
        totalPrice,
        'Order Placed',
        orderLatitude,
        orderLongitude,
        deliveryAddress || '',
        deliveryNote || '',
      ]
    );

    // Get the order ID
    const orderResult = db.exec('SELECT last_insert_rowid()');
    const orderId = orderResult[0].values[0][0] as number;

    // Insert items and update stock
    for (const item of items) {
      db.run(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.id, item.quantity, item.price]
      );
      db.run(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.id]
      );
    }

    saveDb();

    return NextResponse.json({ orderId, totalPrice }, { status: 201 });
  } catch (error: unknown) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
