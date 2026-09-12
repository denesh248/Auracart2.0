import React from 'react';

const textualStyle = {
  maxWidth: '900px',
  margin: '30px auto',
  padding: '40px',
  background: '#111827',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  lineHeight: '1.7',
  color: '#cbd5e1',
  boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
};

const ReturnPolicy = () => {
  return (
    <div style={textualStyle}>
      <h2 style={{ color: '#f8fafc', marginBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '14px', fontSize: '1.75rem', fontWeight: '700' }}>
        Return & Refund Policy - AuraCart 2.0
      </h2>
      
      <p style={{ marginBottom: '16px' }}>
        At AuraCart 2.0, customer satisfaction is our top priority. We offer flexible order management: free cancellations before warehouse dispatch, transparent in-transit cancellation policies, and an easy 7-day return policy upon delivery.
      </p>

      <h4 style={{ color: '#818cf8', marginTop: '24px', marginBottom: '8px', fontSize: '1.1rem' }}>1. Pre-Shipment Cancellation</h4>
      <p style={{ marginBottom: '16px' }}>
        Orders in "Pending" or "Processing" status can be cancelled instantly with a 100% full refund and ₹0 cancellation fee directly from your "Your Orders" page.
      </p>

      <h4 style={{ color: '#818cf8', marginTop: '24px', marginBottom: '8px', fontSize: '1.1rem' }}>2. In-Transit Cancellation</h4>
      <p style={{ marginBottom: '16px' }}>
        Packages already departed from our warehouse incur a ₹50 courier recovery fee. The remaining balance is refunded to your account immediately.
      </p>

      <h4 style={{ color: '#818cf8', marginTop: '24px', marginBottom: '8px', fontSize: '1.1rem' }}>3. 7-Day Easy Returns</h4>
      <p style={{ marginBottom: '16px' }}>
        Delivered items are eligible for a 7-day reverse courier pickup. Simply select "Request Return" from your orders dashboard.
      </p>
    </div>
  );
};

export default ReturnPolicy;
