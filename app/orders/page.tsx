'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface Order {
  id: number;
  total_price: number;
  status: string;
  created_at: string;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => {
        setOrders(data.orders || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="orders-page">
        <div className="order-success">
          <div className="success-icon">🔒</div>
          <h1>Login Required</h1>
          <p>Please sign in to view your orders.</p>
          <Link href="/login" className="btn-primary">Sign In →</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Order Placed': return 'placed';
      case 'Packed': return 'packed';
      case 'Out for Delivery': return 'delivering';
      case 'Delivered': return 'delivered';
      default: return 'placed';
    }
  };

  return (
    <div className="orders-page">
      <h1>My Orders</h1>

      {orders.length === 0 ? (
        <div className="cart-empty">
          <div className="cart-empty-icon">📦</div>
          <h2>No orders yet</h2>
          <p>Start shopping and your orders will appear here.</p>
          <Link href="/products" className="btn-primary">Browse Products</Link>
        </div>
      ) : (
        orders.map((order) => (
          <div className="order-card" key={order.id}>
            <div className="order-header">
              <div>
                <div className="order-id">Order #{order.id}</div>
                <div className="order-date">{new Date(order.created_at).toLocaleDateString('en-IN', {
                  year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}</div>
              </div>
              <span className={`order-status ${getStatusClass(order.status)}`}>
                {order.status}
              </span>
            </div>
            <div className="order-footer">
              <span className="order-total">₹{order.total_price}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link href={`/tracking/${order.id}`} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                  📍 Track Order
                </Link>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
