import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminNav from './AdminNav';

const API_URL = process.env.REACT_APP_API_URL || '';

const AdminUsers = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/auth/users`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [user, navigate]);

  const filteredUsers = users.filter((u) => {
    const nameMatch = (u.name || '').toLowerCase().includes(search.toLowerCase());
    const emailMatch = (u.email || '').toLowerCase().includes(search.toLowerCase());
    const roleMatch = (u.role || '').toLowerCase().includes(search.toLowerCase());
    return nameMatch || emailMatch || roleMatch;
  });

  return (
    <div style={{ maxWidth: '1150px', margin: '24px auto', padding: '0 20px' }}>
      <AdminNav 
        title="Users" 
        subtitle="View registered users and roles"
      />

      {/* Stats bar & Search */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.2rem' }}>👥</span>
          <div>
            <div style={{ color: '#f8fafc', fontWeight: '700', fontSize: '15px' }}>
              {users.length} Registered Accounts
            </div>
            <div style={{ color: '#94a3b8', fontSize: '12px' }}>
              {users.filter(u => u.role === 'admin').length} Admins • {users.filter(u => u.role !== 'admin').length} Customers
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input 
            type="text"
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '8px 14px',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '13px',
              width: '280px',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Main Table Card */}
      <div style={{
        background: '#111827',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
            <div className="spinner" style={{ margin: '0 auto 16px', width: '36px', height: '36px' }}></div>
            Loading user directory...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔍</div>
            <div style={{ fontSize: '1.1rem', color: '#f8fafc', fontWeight: '600' }}>No users found</div>
            <div style={{ fontSize: '0.9rem', marginTop: '4px' }}>Try adjusting your search query.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#0f172a', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <th style={thStyle}>USER</th>
                  <th style={thStyle}>EMAIL</th>
                  <th style={thStyle}>ACCOUNT ID</th>
                  <th style={thStyle}>ROLE</th>
                  <th style={thStyle}>REGISTRATION DATE</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isAdmin = u.role === 'admin';
                  return (
                    <tr 
                      key={u._id} 
                      style={{ 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: isAdmin ? 'linear-gradient(135deg, #6366f1, #a855f7)' : '#1e293b',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '700',
                            fontSize: '14px',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                          }}>
                            {(u.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ color: '#f8fafc', fontWeight: '600' }}>{u.name || 'Unnamed User'}</div>
                            {u._id === user._id && (
                              <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: '600' }}>(Current Session)</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td style={{ ...tdStyle, color: '#94a3b8' }}>
                        {u.email}
                      </td>

                      <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#64748b', fontSize: '12px' }}>
                        {u._id ? `${u._id.substring(0, 10)}...` : 'N/A'}
                      </td>

                      <td style={tdStyle}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          letterSpacing: '0.5px',
                          background: isAdmin ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: isAdmin ? '#818cf8' : '#34d399',
                          border: `1px solid ${isAdmin ? 'rgba(99, 102, 241, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                        }}>
                          {isAdmin ? '🛡️ ADMIN' : '👤 CUSTOMER'}
                        </span>
                      </td>

                      <td style={{ ...tdStyle, color: '#94a3b8', fontSize: '13px' }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'Recent'}
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
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '0.8px',
  textTransform: 'uppercase'
};

const tdStyle = {
  padding: '14px 18px',
  verticalAlign: 'middle'
};

export default AdminUsers;
