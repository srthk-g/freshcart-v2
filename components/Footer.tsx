import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <h3>🛒 FreshCart</h3>
          <p>
            Your favorite groceries delivered fresh to your doorstep. 
            Track your orders in real-time with our live delivery tracking.
          </p>
        </div>
        <div className="footer-section">
          <h4>Shop</h4>
          <Link href="/products">All Products</Link>
          <Link href="/products">Fruits & Vegetables</Link>
          <Link href="/products">Dairy & Bakery</Link>
          <Link href="/products">Beverages</Link>
        </div>
        <div className="footer-section">
          <h4>Account</h4>
          <Link href="/orders">My Orders</Link>
          <Link href="/cart">My Cart</Link>
          <Link href="/login">Login</Link>
          <Link href="/signup">Sign Up</Link>
        </div>
        <div className="footer-section">
          <h4>Help</h4>
          <Link href="/support">Contact Support</Link>
          <Link href="/support">FAQs</Link>
          <Link href="/support">Shipping Info</Link>
        </div>
      </div>
      <div className="footer-bottom">
        © 2026 FreshCart. All rights reserved. Built with ❤️ for fresh deliveries.
      </div>
    </footer>
  );
}
