import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'grocery.db');

let db: Database | null = null;

function saveDb() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

async function getDb(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  initializeDb(db);
  return db;
}

function initializeDb(database: Database) {
  database.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'customer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      category TEXT NOT NULL,
      image_url TEXT
    );
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      partner_id INTEGER,
      total_price REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Order Placed',
      latitude REAL DEFAULT 19.0760,
      longitude REAL DEFAULT 72.8777,
      delivery_address TEXT DEFAULT '',
      delivery_note TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (partner_id) REFERENCES users(id)
    );
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'Open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed products if table is empty
  const result = database.exec('SELECT COUNT(*) as count FROM products');
  const count = result[0]?.values[0]?.[0] as number;

  const userResult = database.exec('SELECT COUNT(*) as count FROM users WHERE role = "manager"');
  const managerCount = userResult[0]?.values[0]?.[0] as number;

  if (managerCount === 0) {
    // Generate a simple bcrypt hash for "manager123"
    // $2a$10$T1qS4dI.T5H9k8Fj1T4R8OrZ3qV2z7yL8O8bXv5T.w.V/9Y4U3JOS
    database.run(
      'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      ['Inventory Manager', 'manager@freshcart.com', '0000000000', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDI/vCGXq6nUq7b6', 'manager']
    );
  }

  if (count === 0) {
    const products = [
      // ── Fruits ──
      ['Fresh Bananas', 'Ripe yellow bananas, perfect for smoothies and snacking', 40, 50, 'Fruits', 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=300&fit=crop'],
      ['Red Apples', 'Crispy and sweet Fuji apples', 180, 35, 'Fruits', 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=300&fit=crop'],
      ['Fresh Oranges', 'Juicy Nagpur oranges rich in Vitamin C', 120, 40, 'Fruits', 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400&h=300&fit=crop'],
      ['Strawberries', 'Sweet and fresh premium strawberries', 250, 15, 'Fruits', 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&h=300&fit=crop'],
      ['Green Grapes', 'Seedless green grapes, great for salads', 160, 30, 'Fruits', 'https://images.unsplash.com/photo-1595868846399-52e00e84b8dd?w=400&h=300&fit=crop'],
      ['Watermelon', 'Sweet and juicy watermelon - per kg', 35, 20, 'Fruits', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=300&fit=crop'],
      ['Mangoes', 'Alphonso mangoes - premium quality', 350, 12, 'Fruits', 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400&h=300&fit=crop'],
      ['Pineapple', 'Fresh tropical pineapple - whole', 90, 18, 'Fruits', 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&h=300&fit=crop'],

      // ── Vegetables ──
      ['Fresh Tomatoes', 'Farm fresh red tomatoes for everyday cooking', 35, 60, 'Vegetables', '/images/tomatoes.png'],
      ['Onions', 'Premium quality cooking onions', 30, 80, 'Vegetables', 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&h=300&fit=crop'],
      ['Fresh Spinach', 'Organic baby spinach leaves', 45, 25, 'Vegetables', 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=300&fit=crop'],
      ['Potatoes', 'Versatile cooking potatoes, great for curries', 28, 70, 'Vegetables', '/images/potatoes.png'],
      ['Carrots', 'Crunchy fresh carrots - 500g', 40, 45, 'Vegetables', 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&h=300&fit=crop'],
      ['Capsicum', 'Mixed bell peppers - red, yellow, green', 120, 30, 'Vegetables', 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&h=300&fit=crop'],
      ['Broccoli', 'Fresh green broccoli florets - 400g', 85, 20, 'Vegetables', 'https://images.unsplash.com/photo-1583663848850-46af132dc08e?w=400&h=300&fit=crop'],
      ['Cucumber', 'Cool and crispy cucumbers - 500g', 25, 55, 'Vegetables', 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400&h=300&fit=crop'],
      ['Green Chillies', 'Spicy green chillies - 100g', 15, 60, 'Vegetables', 'https://images.unsplash.com/photo-1601002573216-2e865f1ee533?w=400&h=300&fit=crop'],

      // ── Dairy ──
      ['Full Cream Milk', 'Fresh pasteurized full cream milk - 1L', 68, 30, 'Dairy', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=300&fit=crop'],
      ['Greek Yogurt', 'Creamy probiotic Greek yogurt - 400g', 120, 20, 'Dairy', 'https://images.unsplash.com/photo-1571212450892-be224e75618b?w=400&h=300&fit=crop'],
      ['Cheddar Cheese', 'Aged cheddar cheese block - 200g', 220, 15, 'Dairy', 'https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=400&h=300&fit=crop'],
      ['Farm Fresh Eggs', 'Free range eggs - Pack of 12', 96, 40, 'Dairy', 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&h=300&fit=crop'],
      ['Butter', 'Amul salted butter - 500g', 280, 35, 'Dairy', 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&h=300&fit=crop'],
      ['Paneer', 'Fresh cottage cheese paneer - 200g', 90, 25, 'Dairy', 'https://images.unsplash.com/photo-1584909139825-bf0436814982?w=400&h=300&fit=crop'],
      ['Toned Milk', 'Low-fat toned milk - 1L', 52, 40, 'Dairy', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=300&fit=crop'],

      // ── Bakery ──
      ['Whole Wheat Bread', 'Freshly baked whole wheat bread loaf', 45, 25, 'Bakery', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop'],
      ['Croissants', 'Buttery French croissants - Pack of 4', 180, 12, 'Bakery', '/images/croissants.png'],
      ['Chocolate Muffins', 'Rich double chocolate muffins - Pack of 6', 220, 10, 'Bakery', 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400&h=300&fit=crop'],
      ['Garlic Bread', 'Cheesy garlic bread sticks - Pack of 8', 150, 15, 'Bakery', '/images/garlic_bread.png'],
      ['Pav Buns', 'Soft ladi pav dinner rolls - Pack of 6', 35, 40, 'Bakery', '/images/pav_buns.png'],

      // ── Beverages ──
      ['Orange Juice', '100% pure orange juice - 1L', 150, 20, 'Beverages', 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=300&fit=crop'],
      ['Green Tea', 'Premium Japanese green tea - 25 bags', 260, 30, 'Beverages', 'https://images.unsplash.com/photo-1594631252845-29fc4cc8c011?w=400&h=300&fit=crop'],
      ['Coffee Beans', 'Arabica roasted coffee beans - 250g', 450, 18, 'Beverages', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=300&fit=crop'],
      ['Coconut Water', 'Fresh tender coconut water - 1L', 80, 25, 'Beverages', 'https://images.unsplash.com/photo-1600868832560-6c0b991da8b5?w=400&h=300&fit=crop'],
      ['Mango Lassi', 'Creamy mango lassi drink - 250ml', 45, 30, 'Beverages', 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400&h=300&fit=crop'],
      ['Cold Coffee', 'Ready-to-drink iced coffee - 250ml', 60, 35, 'Beverages', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop'],

      // ── Snacks ──
      ['Mixed Nuts', 'Premium assorted dry fruits and nuts - 200g', 350, 22, 'Snacks', 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=400&h=300&fit=crop'],
      ['Dark Chocolate', '70% cocoa dark chocolate bar', 180, 0, 'Snacks', 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&h=300&fit=crop'],
      ['Potato Chips', 'Classic salted potato chips - 150g', 60, 45, 'Snacks', 'https://images.unsplash.com/photo-1621504938321-4d1fb22e96ea?w=400&h=300&fit=crop'],
      ['Granola Bars', 'Oats and honey granola bars - Pack of 6', 190, 28, 'Snacks', '/images/granola_bars.png'],
      ['Biscuits', 'Digestive wheat biscuits - 250g', 45, 50, 'Snacks', 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=300&fit=crop'],
      ['Popcorn', 'Butter flavored microwave popcorn - 3 bags', 120, 20, 'Snacks', 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400&h=300&fit=crop'],
      ['Trail Mix', 'Energy trail mix with seeds and berries', 220, 18, 'Snacks', 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&h=300&fit=crop'],

      // ── Essentials ──
      ['Basmati Rice', 'Aged premium basmati rice - 1kg', 180, 40, 'Essentials', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop'],
      ['Atta (Wheat Flour)', 'Whole wheat chakki atta - 5kg', 280, 30, 'Essentials', 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop'],
      ['Cooking Oil', 'Refined sunflower oil - 1L', 160, 35, 'Essentials', '/images/cooking_oil.png'],
      ['Sugar', 'White crystal sugar - 1kg', 48, 50, 'Essentials', 'https://images.unsplash.com/photo-1581441363689-1f3c3c414636?w=400&h=300&fit=crop'],
      ['Salt', 'Iodized table salt - 1kg', 22, 60, 'Essentials', 'https://images.unsplash.com/photo-1624467364115-38c4c77ea1a6?w=400&h=300&fit=crop'],
      ['Toor Dal', 'Premium toor dal - 1kg', 150, 35, 'Essentials', '/images/toor_dal.png'],
      ['Turmeric Powder', 'Pure turmeric powder - 200g', 65, 40, 'Essentials', '/images/turmeric.png'],
      ['Tea Powder', 'Premium CTC tea powder - 500g', 220, 30, 'Essentials', 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=300&fit=crop'],
    ];

    for (const p of products) {
      database.run(
        'INSERT INTO products (name, description, price, stock, category, image_url) VALUES (?, ?, ?, ?, ?, ?)',
        p
      );
    }

    saveDb();
  }
}

export { getDb, saveDb };
