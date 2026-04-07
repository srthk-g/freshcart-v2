import Link from 'next/link';

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>
            Fresh Groceries,
            <br />
            <span>Delivered Fast</span>
          </h1>
          <p>
            Browse from a wide selection of fresh fruits, vegetables, dairy, and more. 
            Place your order and track your delivery in real-time on our live map.
          </p>
          <div className="hero-buttons">
            <Link href="/products" className="btn-primary" style={{ padding: '14px 32px', fontSize: '1rem' }}>
              🛒 Shop Now
            </Link>
            <Link href="/support" className="btn-secondary" style={{ padding: '14px 32px', fontSize: '1rem' }}>
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <h2 className="section-title">Browse by Category</h2>
        <p className="section-subtitle">Find exactly what you need from our fresh selection</p>
        <div className="categories-grid">
          {[
            { icon: '🍎', name: 'Fruits' },
            { icon: '🥬', name: 'Vegetables' },
            { icon: '🥛', name: 'Dairy' },
            { icon: '🍞', name: 'Bakery' },
            { icon: '🧃', name: 'Beverages' },
            { icon: '🍫', name: 'Snacks' },
            { icon: '🏪', name: 'Essentials' },
          ].map((cat) => (
            <Link href="/products" key={cat.name}>
              <div className="category-card">
                <span className="category-icon">{cat.icon}</span>
                <span className="category-name">{cat.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Real-Time Stock Visibility</h3>
            <p>Always know what is available before you add to cart. No more surprises at checkout with live stock updates.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📍</div>
            <h3>Live Delivery Tracking</h3>
            <p>Watch your delivery move in real-time on an interactive map. Know exactly when your groceries will arrive.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Fast & Reliable</h3>
            <p>Quick checkout process with instant order confirmation. Our delivery partners ensure your groceries arrive fresh.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>24/7 Support</h3>
            <p>Have a question? Our support team is always ready to help you with any order or delivery issues.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ textAlign: 'center', padding: '64px 24px' }}>
        <h2 className="section-title" style={{ marginBottom: '12px' }}>Ready to get started?</h2>
        <p className="section-subtitle" style={{ marginBottom: '24px' }}>
          Join thousands of happy customers who trust FreshCart for their daily grocery needs.
        </p>
        <Link href="/signup" className="btn-primary" style={{ padding: '14px 40px', fontSize: '1rem' }}>
          Create Free Account →
        </Link>
      </section>
    </>
  );
}
