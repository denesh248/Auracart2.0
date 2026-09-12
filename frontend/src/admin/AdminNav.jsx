import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const AdminNav = ({ title, subtitle, actionButton }) => {
  const location = useLocation();

  const navLinks = [
    { path: '/admin', label: 'Dashboard', exact: true },
    { path: '/admin/products', label: 'Products' },
    { path: '/admin/add-product', label: 'Add Product' },
    { path: '/admin/orders', label: 'Orders' },
    { path: '/admin/users', label: 'Users' },
  ];

  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Simple Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#f8fafc',
            margin: 0
          }}>
            {title || 'Admin Panel'}
          </h2>
          {subtitle && (
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
              {subtitle}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {actionButton}
          <Link
            to="/shop"
            style={{
              padding: '7px 14px',
              borderRadius: '6px',
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#cbd5e1',
              fontSize: '13px',
              fontWeight: '500',
              textDecoration: 'none'
            }}
          >
            ← View Store
          </Link>
        </div>
      </div>

      {/* Simple Navigation Tabs */}
      <div style={{
        background: '#111827',
        border: '1px solid #334155',
        borderRadius: '8px',
        padding: '5px',
        display: 'flex',
        gap: '6px',
        flexWrap: 'wrap'
      }}>
        {navLinks.map((link) => {
          const isActive = link.exact
            ? location.pathname === link.path
            : location.pathname.startsWith(link.path);

          return (
            <Link
              key={link.path}
              to={link.path}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: isActive ? '600' : '500',
                textDecoration: 'none',
                background: isActive ? '#2563eb' : 'transparent',
                color: isActive ? '#ffffff' : '#94a3b8',
                transition: 'background 0.15s ease'
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default AdminNav;
