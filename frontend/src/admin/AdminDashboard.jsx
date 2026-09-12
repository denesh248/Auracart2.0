import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminNav from './AdminNav';

const API_URL = process.env.REACT_APP_API_URL || '';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/api/analytics`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setStats(data);
        } else {
          if (res.status === 401) {
            navigate('/login');
          }
          setStats({ totalOrders: 0, totalProducts: 0, totalUsers: 0, totalRevenue: 0 });
        }
      } catch (error) {
        console.error('Error fetching admin analytics:', error);
        setStats({ totalOrders: 0, totalProducts: 0, totalUsers: 0, totalRevenue: 0 });
      }
    };
    fetchStats();
  }, [user, navigate]);

  const statCards = stats ? [
    {
      label: 'Total Orders',
      value: stats.totalOrders,
      icon: '🛍️',
      color: '#818cf8',
      link: '/admin/orders',
      change: 'Active & Historical'
    },
    {
      label: 'Total Products',
      value: stats.totalProducts,
      icon: '📦',
      color: '#38bdf8',
      link: '/admin/products',
      change: 'In Catalog'
    },
    {
      label: 'Registered Users',
      value: stats.totalUsers,
      icon: '👥',
      color: '#a78bfa',
      link: '/admin/users',
      change: 'Verified Accounts'
    },
    {
      label: 'Total Revenue',
      value: `₹${(stats.totalRevenue || 0).toFixed(2)}`,
      icon: '💰',
      color: '#34d399',
      link: '/admin/orders',
      change: 'Direct Net Sales'
    }
  ] : [];

  return (
    <div style={{ maxWidth: '1100px', margin: '24px auto', padding: '0 20px' }}>
      <AdminNav 
        title="Dashboard" 
        subtitle={`Welcome, ${user?.name || 'Admin'}. Here is your store summary.`}
      />

      {/* Analytics Metric Cards Grid */}
      {!stats ? (
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
          <p style={{ margin: 0, fontSize: '0.95rem', color: '#94a3b8' }}>Loading store analytics...</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          {statCards.map((card, idx) => (
            <div
              key={idx}
              onClick={() => navigate(card.link)}
              style={{
                background: '#111827',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '22px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {card.label}
                </span>
                <span style={{ fontSize: '1.6rem' }}>{card.icon}</span>
              </div>

              <div>
                <div style={{ fontSize: '2.1rem', fontWeight: '800', color: card.color, lineHeight: 1.1, marginBottom: '6px' }}>
                  {card.value}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {card.change}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Action Navigation Panels */}
      <div style={{
        background: '#111827',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '28px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
      }}>
        <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', fontWeight: '700', color: '#f8fafc' }}>
          Quick Actions
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '0 0 16px 0' }}>
          Quickly navigate to products, orders, or users.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}>
          <button
            onClick={() => navigate('/admin/add-product')}
            className="btn"
            style={{
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '12px',
              fontSize: '0.95rem'
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>➕</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: '700' }}>Add New Product</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Publish catalog listing</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/products')}
            className="btn btn-secondary"
            style={{
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '12px',
              fontSize: '0.95rem'
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>📦</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: '700', color: '#f8fafc' }}>Manage Products</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Edit pricing & stock</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/orders')}
            className="btn btn-secondary"
            style={{
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '12px',
              fontSize: '0.95rem'
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>🚚</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: '700', color: '#f8fafc' }}>Manage Orders</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Shipments & status updates</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/users')}
            className="btn btn-secondary"
            style={{
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '12px',
              fontSize: '0.95rem'
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>👥</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: '700', color: '#f8fafc' }}>User Directory</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Roles & registered accounts</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
