import React, { useEffect, useState, useCallback } from 'react';
import ProductCard from '../components/ProductCard';
import '../styles/product.css';

const API_URL = process.env.REACT_APP_API_URL || '';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [pricePreset, setPricePreset] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Fetch unique categories once
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/api/products/categories`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCategories(['All', ...data]);
            return;
          }
        }
      } catch (e) {}
      // Default fallback categories
      setCategories(['All', 'Electronics', 'Furniture', 'Footwear', 'Accessories', 'Home & Kitchen']);
    };
    fetchCategories();
  }, []);

  // Fetch products with filters
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'All') {
        params.append('category', selectedCategory);
      }
      if (search.trim()) {
        params.append('search', search.trim());
      }
      if (minPrice) {
        params.append('min_price', minPrice);
      }
      if (maxPrice) {
        params.append('max_price', maxPrice);
      }
      if (sortBy) {
        params.append('sort', sortBy);
      }

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${API_URL}/api/products${queryString}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, search, minPrice, maxPrice, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 250); // slight debounce for smooth search
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  // Handle Quick Price Presets
  const handlePricePreset = (preset) => {
    setPricePreset(preset);
    if (preset === 'all') {
      setMinPrice('');
      setMaxPrice('');
    } else if (preset === 'under50') {
      setMinPrice('0');
      setMaxPrice('50');
    } else if (preset === '50to150') {
      setMinPrice('50');
      setMaxPrice('150');
    } else if (preset === '150to300') {
      setMinPrice('150');
      setMaxPrice('300');
    } else if (preset === 'over300') {
      setMinPrice('300');
      setMaxPrice('');
    }
  };

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSearch('');
    setMinPrice('');
    setMaxPrice('');
    setPricePreset('all');
    setSortBy('newest');
  };

  const hasActiveFilters = selectedCategory !== 'All' || search || minPrice || maxPrice || sortBy !== 'newest';

  return (
    <div className="shop-container" style={{ maxWidth: '1200px', margin: '20px auto', padding: '0 20px' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.9rem', fontWeight: '700', color: '#f8fafc', margin: '0 0 4px 0' }}>Explore Catalog</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0 }}>Discover premium items crafted for your modern lifestyle</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Sort By:</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #334155',
              background: '#0f172a',
              color: '#f8fafc',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="newest">Featured & Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div style={{
        background: '#111827',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '28px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
      }}>
        {/* Search & Price Row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', marginBottom: '18px' }}>
          {/* Search Box */}
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Search by title, brand, or category..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 36px 10px 14px',
                borderRadius: '8px',
                border: '1px solid #334155',
                background: '#0f172a',
                color: '#f8fafc',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Price Filter Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#94a3b8', marginRight: '4px' }}>Price:</span>
            {[
              { label: 'All', id: 'all' },
              { label: '< ₹50', id: 'under50' },
              { label: '₹50 - ₹150', id: '50to150' },
              { label: '₹150 - ₹300', id: '150to300' },
              { label: '₹300+', id: 'over300' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePricePreset(p.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '16px',
                  fontSize: '13px',
                  fontWeight: pricePreset === p.id ? '600' : '500',
                  border: pricePreset === p.id ? '1px solid #6366f1' : '1px solid #334155',
                  background: pricePreset === p.id ? 'rgba(99, 102, 241, 0.25)' : '#0f172a',
                  color: pricePreset === p.id ? '#a5b4fc' : '#cbd5e1',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Min/Max Inputs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input 
              type="number" 
              placeholder="Min ₹" 
              value={minPrice} 
              onChange={(e) => { setMinPrice(e.target.value); setPricePreset('custom'); }}
              style={{ width: '80px', padding: '8px 10px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', fontSize: '13px', outline: 'none' }}
            />
            <span style={{ color: '#64748b' }}>-</span>
            <input 
              type="number" 
              placeholder="Max ₹" 
              value={maxPrice} 
              onChange={(e) => { setMaxPrice(e.target.value); setPricePreset('custom'); }}
              style={{ width: '80px', padding: '8px 10px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', fontSize: '13px', outline: 'none' }}
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Category Pills Row */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.07)', paddingTop: '14px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#94a3b8', marginRight: '6px' }}>Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: selectedCategory === cat ? '600' : '400',
                border: selectedCategory === cat ? '1px solid #6366f1' : '1px solid #334155',
                background: selectedCategory === cat ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#0f172a',
                color: selectedCategory === cat ? '#ffffff' : '#cbd5e1',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Result Count Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
          Showing <strong style={{ color: '#f8fafc' }}>{products.length}</strong> {products.length === 1 ? 'product' : 'products'}
          {selectedCategory !== 'All' && <span> in <em style={{ color: '#a5b4fc' }}>{selectedCategory}</em></span>}
          {search && <span> matching "<em style={{ color: '#a5b4fc' }}>{search}</em>"</span>}
        </p>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
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
          <p>Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#111827',
          borderRadius: '12px',
          border: '1px dashed #334155',
          margin: '20px 0'
        }}>
          <h3 style={{ fontSize: '1.3rem', color: '#f8fafc', marginBottom: '8px' }}>No products found</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '20px' }}>
            Try adjusting your search criteria, price range, or category filter.
          </p>
          <button 
            type="button" 
            onClick={handleResetFilters} 
            className="btn" 
            style={{ padding: '10px 20px', fontSize: '14px' }}
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product._id || product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Shop;
