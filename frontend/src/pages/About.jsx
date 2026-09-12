import React from 'react';

const About = () => {
  const containerStyle = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '36px',
    background: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    textAlign: 'center'
  };

  const socialBtnStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    margin: '8px',
    padding: '10px 18px',
    background: '#f8fafc',
    color: '#334155',
    borderRadius: '6px',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    fontWeight: '500'
  };

  return (
    <div style={containerStyle}>
      <div style={{
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: '#2563eb',
        color: '#ffffff',
        fontSize: '44px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px auto',
        boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)'
      }}>
        DK
      </div>
      <h2 style={{ fontSize: '2rem', marginBottom: '6px', color: '#0f172a' }}>Denesh Kumar</h2>
      <h3 style={{ fontSize: '1.1rem', color: '#2563eb', marginBottom: '16px', fontWeight: '500' }}>
        Full-Stack Software Engineer
      </h3>

      <p style={{ color: '#475569', fontSize: '1rem', lineHeight: '1.7', maxWidth: '600px', margin: '0 auto 24px auto' }}>
        Passionate software engineer focused on building clean, scalable, high-performance web applications using modern full-stack architectures, Python/Django, React, and secure JWT authentication pipelines.
      </p>

      <div style={{
        padding: '16px',
        background: '#f1f5f9',
        borderRadius: '8px',
        marginBottom: '24px',
        display: 'inline-block',
        fontSize: '15px',
        color: '#1e293b'
      }}>
        📧 <strong>Email:</strong> <a href="mailto:deneshkumar248@gmail.com" style={{ color: '#2563eb' }}>deneshkumar248@gmail.com</a>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginTop: '10px' }}>
        <a href="mailto:deneshkumar248@gmail.com" style={{ ...socialBtnStyle, background: '#2563eb', color: '#ffffff', borderColor: '#2563eb' }}>✉️ Contact Me</a>
        <a href="https://github.com/denesh248" target="_blank" rel="noreferrer" style={socialBtnStyle}>💻 GitHub Profile</a>
        <a href="https://www.linkedin.com/in/denesh-kumar-344304275/" target="_blank" rel="noreferrer" style={socialBtnStyle}>💼 LinkedIn</a>
      </div>
    </div>
  );
};

export default About;
