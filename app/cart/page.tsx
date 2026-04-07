'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, hasOutOfStock } = useCart();

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-empty">
          <div className="cart-empty-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven&apos;t added anything to your cart yet.</p>
          <Link href="/products" className="btn-primary">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Shopping Cart ({items.length} items)</h1>

      {hasOutOfStock && (
        <div className="out-of-stock-warning">
          ⚠️ Some items in your cart are out of stock. Please remove them before checkout.
        </div>
      )}

      <div className="cart-items">
        {items.map((item) => (
          <div className="cart-item" key={item.id}>
            <img
              src={item.image_url}
              alt={item.name}
              className="cart-item-image"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '';
                target.style.background = 'linear-gradient(135deg, #f0f4ff, #dbe6ff)';
                target.style.objectFit = 'contain';
                target.alt = item.name;
              }}
            />
            <div className="cart-item-details">
              <div className="cart-item-name">{item.name}</div>
              <div className="cart-item-price">₹{item.price} each</div>
              {item.stock <= 0 && (
                <span className="stock-badge out-of-stock" style={{ marginTop: '4px' }}>● Out of Stock</span>
              )}
            </div>
            <div className="quantity-controls">
              <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
              <span className="qty-value">{item.quantity}</span>
              <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock}>+</button>
            </div>
            <div className="cart-item-total">₹{item.price * item.quantity}</div>
            <button className="remove-btn" onClick={() => removeItem(item.id)} title="Remove item">✕</button>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="cart-summary-row">
          <span>Subtotal</span>
          <span>₹{totalPrice}</span>
        </div>
        <div className="cart-summary-row">
          <span>Delivery Fee</span>
          <span style={{ color: 'var(--success)' }}>Free</span>
        </div>
        <div className="cart-summary-row total">
          <span>Total</span>
          <span>₹{totalPrice}</span>
        </div>
        <div style={{ marginTop: '20px' }}>
          <Link
            href={hasOutOfStock ? '#' : '/checkout'}
            className="btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '14px',
              fontSize: '1rem',
              pointerEvents: hasOutOfStock ? 'none' : 'auto',
              opacity: hasOutOfStock ? 0.5 : 1,
            }}
          >
            Proceed to Checkout →
          </Link>
        </div>
      </div>
    </div>
  );
}
