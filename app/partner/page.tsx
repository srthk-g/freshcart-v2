'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';
import { io, Socket } from 'socket.io-client';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

interface Order {
  id: number;
  total_price: number;
  status: string;
  latitude: number;
  longitude: number;
  delivery_address: string;
  delivery_note: string;
  created_at: string;
}

export default function PartnerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState<Order[]>([]);
  const [active, setActive] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Real-time tracking data
  const [socket, setSocket] = useState<Socket | null>(null);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'partner') {
      router.push('/login');
      return;
    }
    fetchOrders();

    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('location-update', (data) => {
      setTrackingData(data);
    });

    newSocket.on('chat-history', (data) => {
      setMessages(data.messages);
    });

    newSocket.on('chat-message', (data) => {
      setMessages(data.messages);
    });

    return () => {
      newSocket.close();
    };
  }, [user, authLoading, router]);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/partner/orders');
      const data = await res.json();
      setPending(data.pending || []);
      setActive(data.active || []);
    } catch {
      console.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: number) => {
    try {
      const res = await fetch(`/api/partner/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' }),
      });
      if (res.ok) {
        fetchOrders();
      }
    } catch {
      alert('Failed to accept order');
    }
  };

  const handleNavigate = (order: Order) => {
    if (!socket) return;
    // Tell the server this partner is starting to navigate for this order
    socket.emit('partner-start-tracking', {
      orderId: order.id,
      destinationLatitude: order.latitude,
      destinationLongitude: order.longitude,
    });
  };

  const handleSendMessage = (e: React.FormEvent, orderId: number) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;
    
    // Send as 'partner' in the simulation logic, but we need to tell server who is sending it.
    socket.emit('send-message-from-partner', { orderId, text: newMessage });
    setNewMessage('');
  };

  const completeDelivery = async (id: number) => {
    try {
      if(socket) {
        // Just send a message for visual completeness
        socket.emit('send-message-from-partner', { orderId: id, text: 'Order Delivered!' });
      }
      const res = await fetch(`/api/partner/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', status: 'Delivered' }),
      });
      if (res.ok) {
        fetchOrders();
        setTrackingData(null);
      }
    } catch {
      alert('Failed to complete order');
    }
  }

  if (authLoading || loading) return <div className="page-container"><div className="loading-spinner"/></div>;

  return (
    <div className="page-container" style={{ padding: '20px' }}>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h1>Delivery Partner Hub</h1>
        <div style={{ color: 'var(--text-secondary)' }}>Welcome, {user?.name}</div>
      </div>

      {active.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 350px', gap: '24px' }}>
          <div>
            <h2 style={{ marginBottom: '16px' }}>Active Delivery (Order #{active[0].id})</h2>
            <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
              <div style={{ marginBottom: '15px' }}>
                <strong>Destination:</strong> {active[0].delivery_address}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>Notes:</strong> {active[0].delivery_note || 'None'}
              </div>
              <div className="flex-between" style={{ marginTop: '20px' }}>
                <button className="btn-primary" onClick={() => handleNavigate(active[0])}>
                  Navigate
                </button>
                <button className="btn-outline" onClick={() => completeDelivery(active[0].id)}>
                  Mark as Delivered
                </button>
              </div>
            </div>

            {trackingData && (
              <div style={{ height: '400px', borderRadius: '12px', overflow: 'hidden' }}>
                <Map 
                  deliveryPosition={[trackingData.latitude, trackingData.longitude]}
                  route={trackingData.route}
                  storePosition={trackingData.storePosition}
                  destinationPosition={trackingData.destinationPosition}
                />
              </div>
            )}
            {trackingData && (
              <div style={{ marginTop: '16px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>Status: {trackingData.status}</div>
                <div style={{ color: 'var(--text-secondary)' }}>ETA: {trackingData.eta} mins</div>
              </div>
            )}
          </div>

          <div>
            <h2 style={{ marginBottom: '16px' }}>Chat with Customer</h2>
            <div className="chat-container" style={{ display: 'flex', flexDirection: 'column', background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', height: '600px' }}>
              <div className="chat-messages" style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
                {messages.length === 0 ? (
                  <div className="chat-empty" style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '20px' }}>No messages yet. Say hi!</div>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`chat-message ${msg.sender === 'partner' ? 'user' : 'other'}`}
                    >
                      <div className="chat-bubble">{msg.text}</div>
                      <div className="chat-time">{msg.time}</div>
                    </div>
                  ))
                )}
              </div>
              <form className="chat-input-area" onSubmit={(e) => handleSendMessage(e, active[0].id)} style={{ padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="chat-input"
                  style={{ flex: 1, padding: '10px 16px', borderRadius: '24px', border: '1px solid var(--border-color)' }}
                />
                <button type="submit" className="btn-primary" style={{ borderRadius: '24px', padding: '8px 20px' }}>Send</button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <h2 style={{ marginBottom: '16px' }}>Available Orders</h2>
          {pending.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
              No orders available right now. Please wait for new ones.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
              {pending.map(order => (
                <div key={order.id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <div className="flex-between">
                      <h3 style={{ margin: 0 }}>Order #{order.id}</h3>
                      <span className="badge">Pending</span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '0.9rem' }}>{order.delivery_address}</div>
                    <div style={{ marginTop: '8px', fontWeight: '600', fontSize: '1.1rem' }}>₹{order.total_price}</div>
                  </div>
                  <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => handleAccept(order.id)}>
                    Accept Order
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
