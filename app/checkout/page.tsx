'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, totalPrice, clearCart, hasOutOfStock } = useCart();
  const [processing, setProcessing] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  // Address fields (Instamart style)
  const [flatNo, setFlatNo] = useState('');
  const [floor, setFloor] = useState('');
  const [building, setBuilding] = useState('');
  const [landmark, setLandmark] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [addressType, setAddressType] = useState('Home');

  // Delivery note
  const [deliveryNote, setDeliveryNote] = useState('');

  if (!user) {
    return (
      <div className="checkout-page">
        <div className="order-success">
          <div className="success-icon">🔒</div>
          <h1>Login Required</h1>
          <p>Please sign in to complete your purchase.</p>
          <Link href="/login" className="btn-primary">
            Sign In →
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !orderId) {
    return (
      <div className="checkout-page">
        <div className="order-success">
          <div className="success-icon">🛒</div>
          <h1>Cart is Empty</h1>
          <p>Add some products to your cart before checking out.</p>
          <Link href="/products" className="btn-primary">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  if (orderId) {
    return (
      <div className="checkout-page">
        <div className="order-success">
          <div className="success-icon">🎉</div>
          <h1>Order Placed Successfully!</h1>
          <p>Your order #{orderId} has been confirmed. Estimated delivery in <strong>30–45 minutes</strong>.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={`/tracking/${orderId}`} className="btn-primary" style={{ padding: '14px 32px' }}>
              📍 Track Order
            </Link>
            <Link href="/orders" className="btn-secondary" style={{ padding: '14px 32px' }}>
              View All Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const fullAddress = [flatNo, floor ? `Floor ${floor}` : '', building, landmark ? `Near ${landmark}` : '', area, city]
    .filter(Boolean)
    .join(', ');

  const isAddressValid = flatNo.trim() && area.trim();

  const handlePayment = async () => {
    if (!isAddressValid) {
      alert('Please fill in at least Flat/House No and Area/Locality');
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          deliveryAddress: fullAddress,
          deliveryNote,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrderId(data.orderId);
        clearCart();
      } else {
        alert(data.error || 'Order failed');
      }
    } catch {
      alert('Network error. Please try again.');
    }
    setProcessing(false);
  };

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>

      {hasOutOfStock && (
        <div className="out-of-stock-warning">
          ⚠️ Cannot proceed — some items are out of stock. <Link href="/cart" style={{ color: 'var(--primary)', fontWeight: 600 }}>Go to cart</Link>
        </div>
      )}

      {/* Order Summary */}
      <div className="checkout-section">
        <h2>📋 Order Summary</h2>
        {items.map((item) => (
          <div className="checkout-item" key={item.id}>
            <span>{item.name} × {item.quantity}</span>
            <span>₹{item.price * item.quantity}</span>
          </div>
        ))}
        <div className="checkout-total">
          <span>Total</span>
          <span>₹{totalPrice}</span>
        </div>
      </div>

      {/* Delivery Address — Instamart style */}
      <div className="checkout-section">
        <h2>📍 Delivery Address</h2>

        {/* Address Type Tags */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {['Home', 'Work', 'Hotel', 'Other'].map((type) => (
            <button
              key={type}
              className={addressType === type ? 'filter-tab active' : 'filter-tab'}
              onClick={() => setAddressType(type)}
              type="button"
            >
              {type === 'Home' ? '🏠' : type === 'Work' ? '🏢' : type === 'Hotel' ? '🏨' : '📍'} {type}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="flat-no">Flat / House No / Office No *</label>
            <input
              id="flat-no"
              type="text"
              value={flatNo}
              onChange={(e) => setFlatNo(e.target.value)}
              placeholder="e.g. Flat 301, B-Wing"
              required
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="floor">Floor (Optional)</label>
            <input
              id="floor"
              type="text"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              placeholder="e.g. 3rd Floor"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="building">Building / Society / Company Name</label>
          <input
            id="building"
            type="text"
            value={building}
            onChange={(e) => setBuilding(e.target.value)}
            placeholder="e.g. Sunshine Apartments"
          />
        </div>

        <div className="form-group">
          <label htmlFor="landmark">Landmark (Helps us find your address)</label>
          <input
            id="landmark"
            type="text"
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            placeholder="e.g. Near City Mall, Opposite SBI Bank"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="area">Area / Locality *</label>
            <input
              id="area"
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Andheri West"
              required
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="city">City</label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Mumbai"
            />
          </div>
        </div>

        {fullAddress && (
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            background: 'var(--primary-50)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--primary-200)',
            fontSize: '0.85rem',
          }}>
            <strong style={{ color: 'var(--primary)' }}>📍 {addressType}:</strong> {fullAddress}
          </div>
        )}
      </div>

      {/* Delivery Note */}
      <div className="checkout-section">
        <h2>📝 Note for Delivery Partner</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Add any special instructions for your delivery partner
        </p>
        <div className="form-group" style={{ margin: 0 }}>
          <textarea
            id="delivery-note"
            value={deliveryNote}
            onChange={(e) => setDeliveryNote(e.target.value)}
            placeholder="e.g. Ring the doorbell twice, Leave at the door, Call before arriving, Don't ring the bell — baby sleeping..."
            style={{ minHeight: '80px' }}
          />
        </div>
      </div>

      {/* Estimated Delivery */}
      <div className="checkout-section" style={{ textAlign: 'center', background: 'var(--success-bg)', border: '1px solid #A7F3D0' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🕐</div>
        <h3 style={{ marginBottom: '4px' }}>Estimated Delivery Time</h3>
        <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>30 – 45 minutes</p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Track your order live on the map after payment</p>
      </div>

      {/* Customer Info */}
      <div className="checkout-section">
        <h2>👤 Contact Details</h2>
        <div className="checkout-item">
          <span>Name</span>
          <span>{user.name}</span>
        </div>
        <div className="checkout-item">
          <span>Email</span>
          <span>{user.email}</span>
        </div>
        <div className="checkout-item">
          <span>Phone</span>
          <span>{user.phone || 'Not provided'}</span>
        </div>
      </div>

      {/* Payment */}
      <div className="payment-card">
        <h3>Complete Payment</h3>
        <p>Simulated payment for demo purposes</p>
        <div className="amount">₹{totalPrice}</div>
        <button
          className="pay-btn"
          onClick={handlePayment}
          disabled={processing || hasOutOfStock || !isAddressValid}
        >
          {processing ? 'Processing...' : '💳 Pay Now'}
        </button>
        {!isAddressValid && (
          <p style={{ marginTop: '12px', opacity: 0.8, fontSize: '0.8rem' }}>
            Fill in delivery address to proceed
          </p>
        )}
      </div>
    </div>
  );
}
