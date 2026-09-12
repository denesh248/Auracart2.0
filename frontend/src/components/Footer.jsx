import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={{
      background: '#0b0f19',
      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '36px 20px',
      marginTop: 'auto'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div>
          <h3 style={{ 
            background: 'linear-gradient(135deg, #60a5fa, #a855f7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '4px', 
            fontSize: '1.25rem',
            fontWeight: '800'
          }}>
            AuraCart 2.0
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Next-Generation AI-Ready E-Commerce Platform.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '24px' }}>
          <Link to="/about" style={{ color: '#94a3b8', fontSize: '0.875rem' }}>About Me</Link>
          <Link to="/return" style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Return Policy</Link>
          <Link to="/disclaimer" style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Disclaimer</Link>
        </div>
        
        <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
          &copy; {new Date().getFullYear()} AuraCart 2.0 by Denesh Kumar. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
