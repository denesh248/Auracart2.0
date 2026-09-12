import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import AdminNav from './AdminNav';

const API_URL = process.env.REACT_APP_API_URL || '';

const AddProduct = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Electronics',
    stock: ''
  });
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user || user.role !== 'admin') {
    return null;
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      showToast('Please select a product image', 'error');
      return;
    }
    
    setLoading(true);
    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('price', formData.price);
    data.append('category', formData.category);
    data.append('stock', formData.stock);
    data.append('image', image);

    try {
      const res = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` },
        body: data
      });
      const responseData = await res.json();
      
      if (res.ok) {
        showToast(`Product "${formData.name}" added successfully!`, 'success');
        navigate('/admin/products');
      } else {
        showToast(responseData.message || 'Failed to add product', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Error uploading product data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Simple form styling (fresher developer style)
  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#cbd5e1'
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '6px',
    color: '#f8fafc',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '0 16px' }}>
      <AdminNav 
        title="Add Product" 
        subtitle="Fill out the details below to add a new product."
      />

      {/* Simple Form Card */}
      <div style={{
        background: '#111827',
        border: '1px solid #334155',
        borderRadius: '8px',
        padding: '24px'
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Product Name */}
          <div>
            <label style={labelStyle}>Product Name *</label>
            <input 
              type="text" 
              placeholder="e.g. Wireless Mouse" 
              required 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
              style={inputStyle} 
            />
          </div>

          {/* Category & Price Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="Electronics">Electronics</option>
                <option value="Furniture">Furniture</option>
                <option value="Footwear">Footwear</option>
                <option value="Accessories">Accessories</option>
                <option value="Home & Kitchen">Home & Kitchen</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Price (₹) *</label>
              <input 
                type="number" 
                step="0.01" 
                placeholder="e.g. 499.00" 
                required 
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})} 
                style={inputStyle} 
              />
            </div>
          </div>

          {/* Stock Quantity */}
          <div>
            <label style={labelStyle}>Stock Quantity *</label>
            <input 
              type="number" 
              placeholder="e.g. 50" 
              required 
              min="0"
              value={formData.stock}
              onChange={(e) => setFormData({...formData, stock: e.target.value})} 
              style={inputStyle} 
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description *</label>
            <textarea 
              placeholder="Enter product description here..." 
              required 
              rows="4"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})} 
              style={{ ...inputStyle, resize: 'vertical' }} 
            />
          </div>

          {/* Product Image File Input */}
          <div>
            <label style={labelStyle}>Product Image *</label>
            <div style={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <input 
                type="file" 
                accept="image/*" 
                required={!previewUrl}
                onChange={handleImageChange}
                style={{ color: '#94a3b8', fontSize: '13px' }}
              />

              {previewUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px' }}>
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    style={{
                      width: '80px',
                      height: '80px',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      border: '1px solid #334155'
                    }} 
                  />
                  <div>
                    <div style={{ color: '#f8fafc', fontSize: '13px', fontWeight: '500' }}>Image Selected</div>
                    <button
                      type="button"
                      onClick={() => { setImage(null); setPreviewUrl(''); }}
                      style={{
                        marginTop: '4px',
                        background: '#dc2626',
                        color: '#ffffff',
                        border: 'none',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Adding Product...' : 'Add Product'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              style={{
                background: '#334155',
                color: '#f8fafc',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddProduct;
