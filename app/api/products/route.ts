import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    const result = db.exec('SELECT id, name, description, price, stock, category, image_url FROM products ORDER BY category, name');

    if (result.length === 0) {
      return NextResponse.json({ products: [] });
    }

    const products = result[0].values.map((row: (string | number | null | Uint8Array)[]) => ({
      id: row[0],
      name: row[1],
      description: row[2],
      price: row[3],
      stock: row[4],
      category: row[5],
      image_url: row[6],
    }));

    return NextResponse.json({ products });
  } catch (error: unknown) {
    console.error('Products error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
