'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import OrderStatusBar from '@/components/OrderStatusBar';
import { getSocket } from '@/lib/socket';

const DeliveryMap = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)' }}>
      <div className="spinner" />
    </div>
  ),
});

interface OrderDetail {
  id: number;
  total_price: number;
  status: string;
  latitude: number;
  longitude: number;
  created_at: string;
  delivery_address: string;
  delivery_note: string;
}

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

interface DeliveryPartner {
  name: string;
  phone: string;
  vehicle: string;
  rating: number;
}

interface ChatMessage {
  id: number;
  sender: 'customer' | 'partner';
  text: string;
  time: string;
}

const QUICK_MESSAGES = [
  '🚪 Please leave at the door',
  '🔔 Ring the doorbell when you arrive',
  '📞 Call me before arriving',
  '🏗️ I\'m coming down to collect',
  '⬆️ Come to the 3rd floor please',
  '🙏 Handle with care please',
];

export default function TrackingPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliveryPos, setDeliveryPos] = useState<[number, number]>([19.0760, 72.8777]);
  const [storePos, setStorePos] = useState<[number, number]>([19.0760, 72.8777]);
  const [currentStatus, setCurrentStatus] = useState('Order Placed');
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState(5);
  const [partner, setPartner] = useState<DeliveryPartner | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const deliveredRoute = useMemo(() => {
    if (route.length === 0) return [];
    return route.slice(0, Math.min(currentIndex + 1, route.length));
  }, [route, currentIndex]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Fetch order details
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetch(`/api/orders/${orderId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.order) {
          setOrder(data.order);
          setItems(data.items || []);
          setDeliveryPos([data.order.latitude, data.order.longitude]);
          setCurrentStatus(data.order.status);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [orderId, user]);

  // Socket.IO
  useEffect(() => {
    if (!order) return;
    const socket = getSocket();

    socket.emit('start-tracking', {
      orderId: Number(orderId),
      destinationLatitude: order.latitude,
      destinationLongitude: order.longitude,
    });

    socket.on('location-update', (data: {
      orderId: number; latitude: number; longitude: number;
      status: string; progress: number; eta: number;
      partner: DeliveryPartner; route: [number, number][];
      storePosition?: [number, number]; destinationPosition?: [number, number];
    }) => {
      if (data.orderId === Number(orderId)) {
        setDeliveryPos([data.latitude, data.longitude]);
        if (data.storePosition) setStorePos(data.storePosition);
        if (data.destinationPosition) setDeliveryPos([data.latitude, data.longitude]);
        setCurrentStatus(data.status);
        setProgress(data.progress);
        setEta(data.eta);
        if (data.partner) setPartner(data.partner);
        if (data.route && data.route.length > 0) {
          setRoute(data.route);
          // Find the closest index in the full route
          let minDist = Infinity, bestIdx = 0;
          for (let i = 0; i < data.route.length; i++) {
            const d = Math.abs(data.route[i][0] - data.latitude) + Math.abs(data.route[i][1] - data.longitude);
            if (d < minDist) { minDist = d; bestIdx = i; }
          }
          setCurrentIndex(bestIdx);
        }
      }
    });

    socket.on('chat-history', (data: { orderId: number; messages: ChatMessage[] }) => {
      if (data.orderId === Number(orderId)) setChatMessages(data.messages);
    });

    socket.on('chat-message', (data: { orderId: number; messages: ChatMessage[] }) => {
      if (data.orderId === Number(orderId)) setChatMessages(data.messages);
    });

    return () => {
      socket.off('location-update');
      socket.off('chat-history');
      socket.off('chat-message');
    };
  }, [order, orderId]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const socket = getSocket();
    socket.emit('send-message', { orderId: Number(orderId), text: text.trim() });
    setCustomMessage('');
  };

  if (!user) {
    return (
      <div className="tracking-page">
        <div className="order-success">
          <div className="success-icon">🔒</div>
          <h1>Login Required</h1>
          <p>Please sign in to track your order.</p>
          <Link href="/login" className="btn-primary">Sign In →</Link>
        </div>
      </div>
    );
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  if (!order) {
    return (
      <div className="tracking-page">
        <div className="order-success">
          <div className="success-icon">❌</div>
          <h1>Order Not Found</h1>
          <p>We couldn&apos;t find this order.</p>
          <Link href="/orders" className="btn-primary">View Orders</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="tracking-page">
      <h1>📍 Tracking Order #{order.id}</h1>

      <div className="tracking-layout">
        {/* Map */}
        <div className="tracking-map">
          <DeliveryMap
            deliveryPosition={deliveryPos}
            storePosition={storePos}
            destinationPosition={[order.latitude, order.longitude]}
            route={route}
            deliveredRoute={deliveredRoute}
          />
        </div>

        {/* Info Panel */}
        <div className="tracking-info">
          {/* Live ETA */}
          <div className="tracking-card" style={{
            background: currentStatus === 'Delivered'
              ? 'var(--success-bg)' : 'linear-gradient(135deg, var(--primary-50) 0%, white 100%)',
            borderColor: currentStatus === 'Delivered' ? '#A7F3D0' : 'var(--primary-200)',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '4px' }}>
                {currentStatus === 'Delivered' ? '✅' : '🕐'}
              </div>
              <h3 style={{ marginBottom: '4px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {currentStatus === 'Delivered' ? 'Delivered!' : 'Arriving in'}
              </h3>
              <div style={{
                fontSize: '2rem', fontWeight: 800,
                color: currentStatus === 'Delivered' ? 'var(--success)' : 'var(--primary)',
              }}>
                {currentStatus === 'Delivered' ? 'Order Complete' : (
                  eta <= 1 ? 'Less than a minute' : `${eta} min`
                )}
              </div>
              {currentStatus !== 'Delivered' && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Live estimate • updates in real-time
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="tracking-card">
            <h3>Delivery Status</h3>
            <OrderStatusBar status={currentStatus} />
          </div>

          {/* Progress */}
          <div className="tracking-card">
            <h3>Delivery Progress</h3>
            <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{
                width: `${progress}%`, height: '100%',
                background: currentStatus === 'Delivered' ? 'var(--success)' : 'var(--primary)',
                borderRadius: '4px', transition: 'width 0.8s ease',
              }} />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>{progress}% complete</p>
          </div>

          {/* Delivery Partner + Contact */}
          {partner && currentStatus !== 'Order Placed' && (
            <div className="tracking-card">
              <h3>Delivery Partner</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%',
                  background: 'var(--primary-50)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0,
                }}>🧑‍💼</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{partner.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    ⭐ {partner.rating} • {partner.vehicle}
                  </div>
                </div>
              </div>

              {currentStatus === 'Out for Delivery' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <a
                    href={`tel:${partner.phone}`}
                    className="btn-primary"
                    style={{ flex: 1, justifyContent: 'center', padding: '12px', fontSize: '0.85rem', textDecoration: 'none' }}
                  >
                    📞 Call
                  </a>
                  <button
                    className="btn-secondary"
                    style={{ flex: 1, justifyContent: 'center', padding: '12px', fontSize: '0.85rem' }}
                    onClick={() => setShowChat(true)}
                  >
                    💬 Message
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Address */}
          {order.delivery_address && (
            <div className="tracking-card">
              <h3>📍 Delivery Address</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{order.delivery_address}</p>
            </div>
          )}

          {/* Note */}
          {order.delivery_note && (
            <div className="tracking-card" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
              <h3>📝 Note for Partner</h3>
              <p style={{ fontSize: '0.85rem', color: '#92400E', lineHeight: 1.6, fontStyle: 'italic' }}>
                &quot;{order.delivery_note}&quot;
              </p>
            </div>
          )}

          {/* Order Details */}
          <div className="tracking-card">
            <h3>Order Details</h3>
            <div className="delivery-info-row"><span>Order ID</span><span>#{order.id}</span></div>
            <div className="delivery-info-row"><span>Placed At</span><span>{new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></div>
            <div className="delivery-info-row"><span>Items</span><span>{items.length} items</span></div>
            <div className="delivery-info-row"><span>Total</span><span style={{ color: 'var(--primary)', fontWeight: 700 }}>₹{order.total_price}</span></div>
          </div>
        </div>
      </div>

      {/* ═══ Chat Modal ═══ */}
      {showChat && partner && (
        <div className="chat-overlay" onClick={() => setShowChat(false)}>
          <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="chat-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
                }}>🧑‍💼</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{partner.name}</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                    {currentStatus === 'Delivered' ? 'Delivered' : '🟢 Online • Delivering your order'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <a
                  href={`tel:${partner.phone}`}
                  style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
                    textDecoration: 'none', color: 'white',
                  }}
                  title="Call delivery partner"
                >📞</a>
                <button
                  onClick={() => setShowChat(false)}
                  style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
                    border: 'none', cursor: 'pointer', color: 'white',
                  }}
                >✕</button>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {chatMessages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>💬</div>
                  <p style={{ fontSize: '0.85rem' }}>Send a message to your delivery partner</p>
                </div>
              )}
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`chat-bubble ${msg.sender}`}>
                  <div className="chat-bubble-text">{msg.text}</div>
                  <div className="chat-bubble-time">{msg.time}</div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Messages */}
            <div className="chat-quick-messages">
              {QUICK_MESSAGES.map((msg, i) => (
                <button
                  key={i}
                  className="quick-msg-btn"
                  onClick={() => sendMessage(msg)}
                >
                  {msg}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="chat-input-area">
              <input
                type="text"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(customMessage); }}
                placeholder="Type a message..."
                className="chat-input"
              />
              <button
                className="chat-send-btn"
                onClick={() => sendMessage(customMessage)}
                disabled={!customMessage.trim()}
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
