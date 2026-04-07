'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image_url: string;
}

export default function ProductCard({ product }: { product: Product }) {
  const { addItem, items } = useCart();
  const [added, setAdded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const inCart = items.find((item) => item.id === product.id);
  const isOutOfStock = product.stock <= 0;

  const handleAdd = () => {
    if (isOutOfStock) return;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      stock: product.stock,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="product-card">
      {imgError ? (
        <div className="product-image" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f0f4ff 0%, #dbe6ff 100%)',
          color: 'var(--primary)',
          fontSize: '0.85rem',
          fontWeight: 600,
          textAlign: 'center',
          padding: '16px',
        }}>
          {product.name}
        </div>
      ) : (
        <img
          src={product.image_url}
          alt={product.name}
          className="product-image"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      )}
      <div className="product-info">
        <div className="product-category">{product.category}</div>
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span className={`stock-badge ${isOutOfStock ? 'out-of-stock' : 'in-stock'}`}>
            {isOutOfStock ? '● Out of Stock' : `● In Stock (${product.stock})`}
          </span>
        </div>
        <div className="product-footer">
          <span className="product-price">₹{product.price}</span>
          <button
            className={`add-to-cart-btn ${added ? 'added' : ''}`}
            onClick={handleAdd}
            disabled={isOutOfStock}
          >
            {added ? '✓ Added' : inCart ? `In Cart (${inCart.quantity})` : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
