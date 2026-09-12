import React, { useEffect, useState, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import AdminNav from './AdminNav';

const API_URL = process.env.REACT_APP_API_URL || '';

const AdminProducts = () => {
  const { user } = useContext(AuthContext);
  const { showToast, showConfirm } = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/products`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load products:', err);
      showToast('Failed to load catalog', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleDelete = (id, name) => {
    showConfirm(`Are you sure you want to delete "${name || 'this product'}"? This action cannot be undone.`, async () => {
      try {
        const res = await fetch(`${API_URL}/api/products/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${user.token}` }
        });
        if (res.ok) {
          setProducts((prev) => prev.filter((p) => p._id !== id));
          showToast(`"${name || 'Product'}" deleted successfully`, 'success');
        } else {
          showToast('Failed to delete product', 'error');
        }
      } catch (error) {
        showToast('Network error while deleting product', 'error');
      }
    });
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCat = selectedCat === 'All' || p.category === selectedCat;
      return matchSearch && matchCat;
    });
  }, [products, searchTerm, selectedCat]);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [products]);

  return (
    <div style={{ maxWidth: '1150px', margin: '24px auto', padding: '0 20px' }}>
      <AdminNav 
        title="Products" 
        subtitle="Manage and view catalog products"
        actionButton={
          <Link 
            to="/admin/add-product" 
            style={{ 
              background: '#2563eb', 
              color: '#ffffff', 
              padding: '8px 16px', 
              borderRadius: '6px', 
              fontSize: '13px', 
              fontWeight: '600', 
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            + Add Product
          </Link>
        }
      />

      {/* Filter & Search Bar */}
      <div style={{
        background: '#111827',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 300px' }}>
          <input
            type="text"
            placeholder="Search products by title or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Category:</span>
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            style={{
              padding: '9px 14px',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <span style={{
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: '#a5b4fc',
            padding: '6px 12px',
            borderRadius: '16px',
            fontSize: '0.82rem',
            fontWeight: '600'
          }}>
            {filteredProducts.length} Items
          </span>
        </div>
      </div>

      {/* Products Table */}
      <div style={{
        background: '#111827',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#818cf8' }}>
            <div style={{
              display: 'inline-block',
              width: '32px',
              height: '32px',
              border: '3px solid #334155',
              borderTopColor: '#6366f1',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              marginBottom: '12px'
            }}></div>
            <p style={{ margin: 0, color: '#94a3b8' }}>Loading product inventory...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📦</div>
            <h3 style={{ color: '#f8fafc', fontSize: '1.25rem', marginBottom: '8px' }}>No products found</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '20px' }}>
              {searchTerm ? `No products match "${searchTerm}".` : 'Your catalog currently has no products.'}
            </p>
            <Link to="/admin/add-product" className="btn" style={{ textDecoration: 'none', padding: '10px 20px' }}>
              + Add First Product
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#0f172a', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <th style={thStyle}>PRODUCT</th>
                  <th style={thStyle}>CATEGORY</th>
                  <th style={thStyle}>PRICE</th>
                  <th style={thStyle}>STOCK STATUS</th>
                  <th style={thStyle}>RATING</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const stock = product.stock || 0;
                  const isLowStock = stock > 0 && stock <= 10;
                  const isOutOfStock = stock === 0;

                  return (
                    <tr
                      key={product._id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#1a2234'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      {/* Product Name & Image */}
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            style={{
                              width: '46px',
                              height: '46px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              background: '#1e293b',
                              border: '1px solid rgba(255, 255, 255, 0.08)'
                            }}
                          />
                          <div>
                            <Link
                              to={`/product/${product._id}`}
                              style={{
                                color: '#f8fafc',
                                fontWeight: '600',
                                textDecoration: 'none',
                                fontSize: '0.92rem'
                              }}
                            >
                              {product.name}
                            </Link>
                            <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '2px' }}>
                              ID: #{product._id ? product._id.substring(0, 10) : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td style={tdStyle}>
                        <span style={{
                          background: '#1e293b',
                          color: '#cbd5e1',
                          padding: '4px 10px',
                          borderRadius: '14px',
                          fontSize: '0.8rem',
                          border: '1px solid rgba(255, 255, 255, 0.07)'
                        }}>
                          {product.category || 'General'}
                        </span>
                      </td>

                      {/* Price */}
                      <td style={tdStyle}>
                        <strong style={{ color: '#10b981', fontSize: '0.98rem' }}>
                          ₹{Number(product.price).toFixed(2)}
                        </strong>
                      </td>

                      {/* Stock Badge */}
                      <td style={tdStyle}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          background: isOutOfStock
                            ? 'rgba(239, 68, 68, 0.15)'
                            : isLowStock
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(16, 185, 129, 0.15)',
                          color: isOutOfStock
                            ? '#f87171'
                            : isLowStock
                            ? '#fbbf24'
                            : '#34d399',
                          border: isOutOfStock
                            ? '1px solid rgba(239, 68, 68, 0.3)'
                            : isLowStock
                            ? '1px solid rgba(245, 158, 11, 0.3)'
                            : '1px solid rgba(16, 185, 129, 0.3)'
                        }}>
                          <span>●</span>
                          {isOutOfStock
                            ? 'Out of Stock'
                            : isLowStock
                            ? `Low Stock (${stock})`
                            : `${stock} in stock`}
                        </span>
                      </td>

                      {/* Rating */}
                      <td style={tdStyle}>
                        <span style={{ color: '#f59e0b', fontSize: '0.9rem' }}>★</span>{' '}
                        <span style={{ color: '#f8fafc', fontWeight: '600', fontSize: '0.85rem' }}>
                          {(product.ratings || 0).toFixed(1)}
                        </span>
                        <span style={{ color: '#64748b', fontSize: '0.78rem', marginLeft: '4px' }}>
                          ({product.numReviews || 0})
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <Link
                            to={`/admin/edit-product/${product._id}`}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              background: 'rgba(99, 102, 241, 0.2)',
                              color: '#a5b4fc',
                              border: '1px solid rgba(99, 102, 241, 0.35)',
                              fontSize: '13px',
                              fontWeight: '600',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            ✏️ Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(product._id, product.name)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              background: 'rgba(239, 68, 68, 0.15)',
                              color: '#f87171',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const thStyle = {
  padding: '14px 18px',
  color: '#94a3b8',
  fontSize: '0.78rem',
  fontWeight: '700',
  letterSpacing: '0.6px',
  textTransform: 'uppercase'
};

const tdStyle = {
  padding: '14px 18px',
  verticalAlign: 'middle'
};

export default AdminProducts;
