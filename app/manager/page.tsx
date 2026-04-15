'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
}

export default function ManagerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ price: 0, stock: 0 });

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'manager') {
      router.push('/login');
      return;
    }
    fetchProducts();
  }, [user, authLoading, router]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (e) {
      console.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingId(product.id);
    setEditForm({ price: product.price, stock: product.stock });
  };

  const handleSave = async (id: number) => {
    try {
      const res = await fetch(`/api/manager/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setProducts(products.map(p => (p.id === id ? { ...p, ...editForm } : p)));
        setEditingId(null);
      } else {
        alert('Failed to update product');
      }
    } catch (e) {
      alert('Error updating product');
    }
  };

  if (authLoading || loading) {
    return <div className="page-container"><div className="loading-spinner" /></div>;
  }

  return (
    <div className="page-container">
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h1>Inventory Dashboard</h1>
        <div style={{ color: 'var(--text-secondary)' }}>Welcome, Manager</div>
      </div>

      <div className="table-container" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '16px' }}>ID</th>
              <th style={{ padding: '16px' }}>Name</th>
              <th style={{ padding: '16px' }}>Category</th>
              <th style={{ padding: '16px' }}>Price (₹)</th>
              <th style={{ padding: '16px' }}>Stock</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>#{product.id}</td>
                <td style={{ padding: '16px', fontWeight: '500' }}>{product.name}</td>
                <td style={{ padding: '16px' }}>
                  <span className="badge">{product.category}</span>
                </td>
                <td style={{ padding: '16px' }}>
                  {editingId === product.id ? (
                    <input
                      type="number"
                      value={editForm.price}
                      onChange={(e) => setEditForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                      style={{ width: '80px', padding: '4px 8px' }}
                    />
                  ) : (
                    `₹${product.price}`
                  )}
                </td>
                <td style={{ padding: '16px' }}>
                  {editingId === product.id ? (
                    <input
                      type="number"
                      value={editForm.stock}
                      onChange={(e) => setEditForm(prev => ({ ...prev, stock: Number(e.target.value) }))}
                      style={{ width: '80px', padding: '4px 8px' }}
                    />
                  ) : (
                    <span style={{ color: product.stock < 10 ? 'var(--error)' : 'inherit', fontWeight: product.stock < 10 ? '600' : 'normal' }}>
                      {product.stock}
                    </span>
                  )}
                </td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  {editingId === product.id ? (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => handleSave(product.id)}>Save</button>
                      <button className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <button className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => handleEditClick(product)}>
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
