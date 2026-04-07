'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function SupportPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });

      if (res.ok) {
        setSubmitted(true);
        setSubject('');
        setMessage('');
      }
    } catch {
      alert('Failed to submit. Please try again.');
    }
    setLoading(false);
  };

  const faqs = [
    {
      q: 'How do I track my order?',
      a: 'After placing an order, you\'ll receive a tracking link. Click on it or go to Orders → Track Order to see your delivery moving in real-time on the map.',
    },
    {
      q: 'What happens if an item is out of stock?',
      a: 'We show real-time stock availability. If an item goes out of stock while in your cart, you\'ll be notified and won\'t be able to proceed to checkout until you remove it.',
    },
    {
      q: 'How long does delivery take?',
      a: 'Typically 30-60 minutes depending on your location and order size. You can track the exact progress on the live map.',
    },
    {
      q: 'Can I cancel my order?',
      a: 'Orders can be cancelled before they\'re packed. Once the order is out for delivery, cancellation is not available. Contact support for assistance.',
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We currently support online payment through our secure payment gateway. Cash on delivery will be available soon.',
    },
  ];

  return (
    <div className="support-page">
      <h1>Customer Support</h1>
      <p className="subtitle">We&apos;re here to help. Send us a message or check our FAQs below.</p>

      <div className="support-grid">
        {/* Contact Form */}
        <div className="support-form-card">
          <h2>📬 Send us a Message</h2>

          {submitted ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
              <h3 style={{ marginBottom: '8px' }}>Message Sent!</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
                We&apos;ll get back to you within 24 hours.
              </p>
              <button className="btn-secondary" onClick={() => setSubmitted(false)}>
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="support-name">Your Name</label>
                <input
                  id="support-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="support-email">Email</label>
                <input
                  id="support-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="support-subject">Subject</label>
                <select
                  id="support-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                >
                  <option value="">Select a topic</option>
                  <option value="Order Issue">Order Issue</option>
                  <option value="Delivery Problem">Delivery Problem</option>
                  <option value="Payment Issue">Payment Issue</option>
                  <option value="Product Quality">Product Quality</option>
                  <option value="Account Help">Account Help</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="support-message">Message</label>
                <textarea
                  id="support-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue..."
                  required
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>

        {/* Info Cards */}
        <div className="support-info">
          <div className="support-info-card">
            <h3>📞 Call Us</h3>
            <p>Available Mon-Sat, 9AM - 9PM<br />+91 1800-XXX-XXXX (Toll Free)</p>
          </div>
          <div className="support-info-card">
            <h3>💬 Live Chat</h3>
            <p>Connect with a support agent instantly for real-time assistance.</p>
            <button className="btn-secondary" style={{ marginTop: '12px', fontSize: '0.8rem' }}>
              🟢 Start Live Chat
            </button>
          </div>
          <div className="support-info-card">
            <h3>📧 Email Support</h3>
            <p>Email us at support@freshcart.com and we&apos;ll respond within 24 hours.</p>
          </div>
          <div className="support-info-card">
            <h3>⏰ Business Hours</h3>
            <p>Monday - Saturday: 9:00 AM - 9:00 PM<br />Sunday: 10:00 AM - 6:00 PM</p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="faq-section">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <p className="section-subtitle">Quick answers to common questions</p>

        {faqs.map((faq, index) => (
          <div className="faq-item" key={index}>
            <div
              className="faq-question"
              onClick={() => setOpenFaq(openFaq === index ? null : index)}
            >
              <span>{faq.q}</span>
              <span style={{ fontSize: '1.2rem', transition: 'transform 0.2s', transform: openFaq === index ? 'rotate(180deg)' : 'none' }}>
                ▾
              </span>
            </div>
            {openFaq === index && (
              <div className="faq-answer">{faq.a}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
