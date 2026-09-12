import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AdminNav from './AdminNav';

const API_URL = process.env.REACT_APP_API_URL || '';

const AdminOrders = () => {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      showToast('Error loading orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setOrders(orders.map(order => order._id === id ? { ...order, status } : order));
        showToast(`Order #${id} status updated to ${status}`, 'success');
      } else {
        showToast('Failed to update order status', 'error');
      }
    } catch (e) {
      showToast('Error updating order status', 'error');
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'All') return true;
    return o.status === statusFilter;
  });

  const getStatusBadge = (st) => {
    const isDelivered = st === 'Delivered';
    const isShipped = st === 'Shipped';
    const isCancelled = st === 'Cancelled';
    const isReturn = st === 'Return Requested' || st === 'Returned';
    
    return {
      background: isDelivered ? 'rgba(34, 197, 94, 0.15)' : isShipped ? 'rgba(59, 130, 246, 0.15)' : isCancelled ? 'rgba(239, 68, 68, 0.15)' : isReturn ? 'rgba(168, 85, 247, 0.15)' : 'rgba(245, 158, 11, 0.15)',
      color: isDelivered ? '#4ade80' : isShipped ? '#60a5fa' : isCancelled ? '#f87171' : isReturn ? '#c084fc' : '#fbbf24',
      border: isDelivered ? '1px solid rgba(34, 197, 94, 0.3)' : isShipped ? '1px solid rgba(59, 130, 246, 0.3)' : isCancelled ? '1px solid rgba(239, 68, 68, 0.3)' : isReturn ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
    };
  };

  return (
    <div style={{ maxWidth: '1150px', margin: '24px auto', padding: '0 20px' }}>
      <AdminNav 
        title="Orders" 
        subtitle="View and update customer orders"
      />

      {/* Filter Bar */}
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
        gap: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '6px 14px',
                borderRadius: '16px',
                fontSize: '13px',
                fontWeight: statusFilter === st ? '700' : '500',
                cursor: 'pointer',
                border: statusFilter === st ? '1px solid #6366f1' : '1px solid #334155',
                background: statusFilter === st ? 'rgba(99, 102, 241, 0.25)' : '#0f172a',
                color: statusFilter === st ? '#a5b4fc' : '#94a3b8',
                transition: 'all 0.15s ease'
              }}
            >
              {st}
            </button>
          ))}
        </div>

        <span style={{
          background: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          color: '#a5b4fc',
          padding: '6px 14px',
          borderRadius: '16px',
          fontSize: '0.82rem',
          fontWeight: '600'
        }}>
          {filteredOrders.length} Orders
        </span>
      </div>

      {/* Orders Table */}
      <div style={{
        background: '#111827',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
        overflow: 'hidden'
      }}>
        {loading ? (
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
            <p style={{ margin: 0, color: '#94a3b8' }}>Loading customer orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🚚</div>
            <h3 style={{ color: '#f8fafc', fontSize: '1.25rem', marginBottom: '8px' }}>No orders found</h3>
            <p style={{ fontSize: '0.9rem', margin: 0 }}>No customer orders match the current status filter.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#0f172a', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <th style={thStyle}>ORDER ID</th>
                  <th style={thStyle}>CUSTOMER</th>
                  <th style={thStyle}>TOTAL AMOUNT</th>
                  <th style={thStyle}>PLACED ON</th>
                  <th style={thStyle}>CURRENT STATUS</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>UPDATE STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const badgeStyle = getStatusBadge(order.status);

                  return (
                    <tr
                      key={order._id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#1a2234'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={tdStyle}>
                        <strong style={{ color: '#f8fafc' }}>#{order._id.substring(0, 10)}</strong>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: '600', color: '#f8fafc' }}>
                          {order.userId?.name || (order.address && order.address.fullName) || 'Direct Shopper'}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.78rem' }}>
                          {order.userId?.email || 'Guest Checkout'}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <strong style={{ color: '#10b981', fontSize: '0.98rem' }}>
                          ₹{order.totalAmount.toFixed(2)}
                        </strong>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                          {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          ...badgeStyle
                        }}>
                          <span>●</span> {order.status}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <select 
                          value={order.status} 
                          onChange={(e) => updateStatus(order._id, e.target.value)}
                          style={{
                            background: '#0f172a',
                            color: '#f8fafc',
                            padding: '7px 12px',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            outline: 'none',
                            fontSize: '13px',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
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
  fontSize: '0.78rem',
  fontWeight: '700',
  letterSpacing: '0.6px',
  textTransform: 'uppercase'
};

const tdStyle = {
  padding: '14px 18px',
  verticalAlign: 'middle'
};

export default AdminOrders;
