'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { totalItems } = useCart();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-logo">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="#2563EB" />
            <path d="M8 12h16l-2 10H10L8 12z" fill="white" opacity="0.9" />
            <circle cx="13" cy="25" r="1.5" fill="white" />
            <circle cx="21" cy="25" r="1.5" fill="white" />
            <path d="M6 8h3l1 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          FreshCart
        </Link>

        <div className="navbar-links">
          {(!user || user.role === 'customer') && (
            <>
              <Link href="/products" className={pathname === '/products' ? 'active' : ''}>
                Products
              </Link>
              {user && (
                <Link href="/orders" className={pathname === '/orders' ? 'active' : ''}>
                  Orders
                </Link>
              )}
            </>
          )}

          {user?.role === 'manager' && (
            <Link href="/manager" className={pathname === '/manager' ? 'active' : ''}>
              Inventory
            </Link>
          )}

          {user?.role === 'partner' && (
            <Link href="/partner" className={pathname === '/partner' ? 'active' : ''}>
              Deliveries
            </Link>
          )}

          <Link href="/support" className={pathname === '/support' ? 'active' : ''}>
            Support
          </Link>
          
          {(!user || user.role === 'customer') && (
            <Link href="/cart" className={pathname === '/cart' ? 'active' : ''}>
              <span className="cart-badge">
                🛒
                {totalItems > 0 && <span className="cart-count">{totalItems}</span>}
              </span>
            </Link>
          )}
          {user ? (
            <>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '8px' }}>
                Hi, {user.name.split(' ')[0]}
              </span>
              <button onClick={logout} className="btn-outline" style={{ padding: '6px 14px' }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={pathname === '/login' ? 'active' : ''}>
                Login
              </Link>
              <Link href="/signup">
                <span className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>Sign Up</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
