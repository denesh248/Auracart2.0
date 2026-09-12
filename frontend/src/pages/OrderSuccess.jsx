import React from 'react';
import { Link } from 'react-router-dom';

const OrderSuccess = () => {
  const containerStyle = {
    maxWidth: '620px',
    margin: '60px auto',
    padding: '48px 36px',
    background: '#111827',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
    textAlign: 'center'
  };

  return (
    <div style={containerStyle}>
      <div style={{
        width: '72px',
        height: '72px',
        borderRadius: '50%',
        background: 'rgba(16, 185, 129, 0.15)',
        border: '2px solid rgba(16, 185, 129, 0.4)',
        color: '#10b981',
        fontSize: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px auto'
      }}>
        ✓
      </div>
      <h2 style={{ fontSize: '2.2rem', marginBottom: '14px', color: '#f8fafc', fontWeight: '800' }}>Payment & Order Successful!</h2>
      <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '36px' }}>
        Thank you for shopping with AuraCart 2.0. We have received your payment and our fulfillment team is preparing your package.
      </p>
      <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/orders" className="btn" style={{ padding: '12px 26px', fontSize: '0.95rem' }}>
          Track in Your Orders →
        </Link>
        <Link to="/shop" className="btn" style={{ padding: '12px 26px', fontSize: '0.95rem', background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1' }}>
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccess;
