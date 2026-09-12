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

const Disclaimer = () => {
  return (
    <div style={textualStyle}>
      <h2 style={{ color: '#f8fafc', marginBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '14px', fontSize: '1.75rem', fontWeight: '700' }}>
        Legal & Site Disclaimer - AuraCart 2.0
      </h2>
      
      <p style={{ marginBottom: '16px' }}>
        The data, interfaces, and components represented across the AuraCart 2.0 platform serve as a full-stack e-commerce portfolio demonstration built by Denesh Kumar.
      </p>

      <h4 style={{ color: '#818cf8', marginTop: '24px', marginBottom: '8px', fontSize: '1.1rem' }}>1. Accuracy of Materials</h4>
      <p style={{ marginBottom: '16px' }}>
        Product imagery and sample data are populated via Unsplash photography and generic content for demonstration purposes.
      </p>

      <h4 style={{ color: '#818cf8', marginTop: '24px', marginBottom: '8px', fontSize: '1.1rem' }}>2. Payment Processing</h4>
      <p style={{ marginBottom: '16px' }}>
        All payment features operate via direct instant payment processing mode. No external payment gateways are required.
      </p>

      <p style={{ marginTop: '24px', fontStyle: 'italic', fontSize: '0.875rem', color: '#94a3b8' }}>
        Designed & developed by Denesh Kumar (deneshkumar248@gmail.com).
      </p>
    </div>
  );
};

export default Disclaimer;
