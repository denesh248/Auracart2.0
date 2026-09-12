import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || '';

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cancellation Modal State
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('Ordered by mistake');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  // Return Modal State
  const [returningOrder, setReturningOrder] = useState(null);
  const [returnReason, setReturnReason] = useState('Defective or damaged item received');
  const [returnNotes, setReturnNotes] = useState('');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  const fetchMyOrders = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/orders/myorders`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(Array.isArray(data) ? data : []);
      } else {
        if (res.status === 401) {
          logout();
          navigate('/login');
        }
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchMyOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Submit Order Cancellation
  const handleConfirmCancel = async () => {
    if (!cancellingOrder) return;
    setIsSubmittingCancel(true);
    try {
      const res = await fetch(`${API_URL}/api/orders/${cancellingOrder._id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({ reason: cancelReason })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Order cancelled successfully!', 'success');
        setCancellingOrder(null);
        fetchMyOrders();
      } else {
        showToast(data.message || 'Cancellation failed', 'error');
      }
    } catch (err) {
      showToast('Network error during cancellation', 'error');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  // Submit Order Return
  const handleConfirmReturn = async () => {
    if (!returningOrder) return;
    setIsSubmittingReturn(true);
    try {
      const res = await fetch(`${API_URL}/api/orders/${returningOrder._id}/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({
          reason: returnReason,
          notes: returnNotes
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Return request submitted successfully!', 'success');
        setReturningOrder(null);
        setReturnNotes('');
        fetchMyOrders();
      } else {
        showToast(data.message || 'Return request failed', 'error');
      }
    } catch (err) {
      showToast('Network error during return request', 'error');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  const containerStyle = { 
    maxWidth: '1000px', 
    margin: '24px auto', 
    padding: '32px', 
    background: '#111827', 
    borderRadius: '16px', 
    border: '1px solid rgba(255, 255, 255, 0.08)', 
    boxShadow: '0 12px 36px rgba(0,0,0,0.45)'
  };

  const badgeStyle = { 
    background: 'rgba(99, 102, 241, 0.2)', 
    color: '#a5b4fc', 
    padding: '4px 12px', 
    borderRadius: '20px', 
    fontSize: '0.85rem', 
    fontWeight: '600', 
    display: 'inline-block', 
    border: '1px solid rgba(99, 102, 241, 0.35)'
  };

  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 8, 15, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(6px)',
    padding: '16px'
  };

  const modalContentStyle = {
    background: '#111827',
    borderRadius: '14px',
    maxWidth: '520px',
    width: '100%',
    padding: '28px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#f8fafc'
  };

  if (!user) return null;

  return (
    <div style={containerStyle}>
      {/* Header Profile Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} style={{ width: '68px', height: '68px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #6366f1' }} />
          ) : (
            <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: '26px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}>
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </div>
          )}
          <div>
            <h2 style={{ color: '#f8fafc', fontSize: '1.6rem', fontWeight: '700', marginBottom: '4px' }}>{user.name}</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '8px' }}>{user.email}</p>
            <span style={badgeStyle}>Role: {user.role.toUpperCase()}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="btn" style={{ background: '#ef4444', borderColor: '#ef4444', color: '#fff', padding: '8px 18px' }}>Sign Out</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ color: '#f8fafc', fontSize: '1.3rem', fontWeight: '700', margin: 0 }}>Order History & Management</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link to="/orders" style={{ color: '#818cf8', fontWeight: '600', fontSize: '0.9rem', textDecoration: 'none' }}>
            Open Full Orders Page →
          </Link>
          <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>({orders.length} orders)</span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: '#818cf8' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>Loading your orders...</div>
        </div>
      ) : orders.length === 0 ? (
        <div style={{ background: '#0f172a', padding: '40px 20px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <p style={{ color: '#94a3b8', marginBottom: '18px', fontSize: '1.05rem' }}>You haven't placed any orders yet.</p>
          <Link to="/shop" className="btn" style={{ textDecoration: 'none', display: 'inline-block' }}>Explore Products</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {orders.map(order => {
            const isPendingOrProcessing = order.status === 'Pending' || order.status === 'Processing';
            const isShipped = order.status === 'Shipped';
            const isDelivered = order.status === 'Delivered';
            const isCancelled = order.status === 'Cancelled';
            const isReturnRequested = order.status === 'Return Requested' || order.status === 'Returned';

            return (
              <div key={order._id} style={{ background: '#0f172a', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 6px 18px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
                {/* Order Top Bar */}
                <div style={{ background: '#1e293b', padding: '14px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>Order ID</span>
                      <strong style={{ color: '#f8fafc', fontSize: '0.9rem' }}>#{order._id}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>Date</span>
                      <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>{new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div>
                      <span style={{ color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>Total</span>
                      <strong style={{ color: '#10b981', fontSize: '0.95rem' }}>₹{order.totalAmount.toFixed(2)}</strong>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    <span style={{ 
                      background: isDelivered ? 'rgba(34, 197, 94, 0.2)' : isShipped ? 'rgba(59, 130, 246, 0.2)' : isCancelled ? 'rgba(239, 68, 68, 0.2)' : isReturnRequested ? 'rgba(168, 85, 247, 0.2)' : 'rgba(234, 179, 8, 0.2)', 
                      color: isDelivered ? '#4ade80' : isShipped ? '#60a5fa' : isCancelled ? '#f87171' : isReturnRequested ? '#c084fc' : '#facc15',
                      padding: '5px 14px', borderRadius: '16px', fontWeight: '700', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px'
                    }}>
                      <span>●</span> {order.status}
                    </span>
                  </div>
                </div>

                {/* Order Content */}
                <div style={{ padding: '18px 20px' }}>
                  {/* Items List */}
                  {order.items && order.items.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                        {order.items.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#111827', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                            {item.imageUrl && (
                              <img src={item.imageUrl} alt={item.name} style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '6px' }} />
                            )}
                            <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#f8fafc' }}>{item.name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Qty: {item.qty} × ₹{item.price}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status Notice & Policy Feedback */}
                  {isCancelled && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '14px', fontSize: '0.88rem', color: '#fca5a5' }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>Order Cancelled</div>
                      <div>Cancellation Fee: <strong style={{ color: '#f87171' }}>₹{(order.cancellationFee || 0).toFixed(2)}</strong> | Refund Amount: <strong style={{ color: '#34d399' }}>₹{(order.refundAmount || order.totalAmount).toFixed(2)}</strong></div>
                      {order.cancellationReason && <div style={{ marginTop: '4px', fontSize: '0.82rem', color: '#f87171' }}>Reason: {order.cancellationReason}</div>}
                    </div>
                  )}

                  {isReturnRequested && (
                    <div style={{ background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '14px', fontSize: '0.88rem', color: '#d8b4fe' }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>Return Request Status: {order.returnStatus || 'Under Review'}</div>
                      <div>Reason: <strong>{order.returnReason}</strong></div>
                      <div style={{ fontSize: '0.82rem', marginTop: '4px', color: '#c084fc' }}>Our reverse courier will schedule a pickup within 2 business days. Full refund will be credited upon receipt.</div>
                    </div>
                  )}

                  {/* Action Buttons based on scenario */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center' }}>
                    {/* Scenario 1: Before Shipping (Free Cancellation) */}
                    {isPendingOrProcessing && (
                      <button 
                        onClick={() => setCancellingOrder(order)}
                        className="btn" 
                        style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.35)', padding: '8px 16px', fontSize: '0.88rem', fontWeight: '600' }}
                      >
                        Cancel Order (Free ₹0 Fee)
                      </button>
                    )}

                    {/* Scenario 2: After Shipping (₹50 Recovery Fee) */}
                    {isShipped && (
                      <button 
                        onClick={() => setCancellingOrder(order)}
                        className="btn" 
                        style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#fb923c', border: '1px solid rgba(249, 115, 22, 0.35)', padding: '8px 16px', fontSize: '0.88rem', fontWeight: '600' }}
                      >
                        Cancel In Transit (₹50 Fee)
                      </button>
                    )}

                    {/* Scenario 3: After Delivery (7-Day Return Option) */}
                    {isDelivered && (
                      <button 
                        onClick={() => setReturningOrder(order)}
                        className="btn" 
                        style={{ padding: '8px 18px', fontSize: '0.88rem', fontWeight: '600' }}
                      >
                        Request Return / Refund
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= CANCELLATION MODAL ================= */}
      {cancellingOrder && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.25rem' }}>Cancel Order #{cancellingOrder._id}</h3>
              <button 
                onClick={() => setCancellingOrder(null)} 
                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}
              >
                &times;
              </button>
            </div>

            {/* Policy Scenario Explanation */}
            {cancellingOrder.status === 'Shipped' ? (
              <div style={{ background: 'rgba(249, 115, 22, 0.12)', border: '1px solid rgba(249, 115, 22, 0.3)', borderRadius: '8px', padding: '14px', marginBottom: '18px' }}>
                <div style={{ color: '#fb923c', fontWeight: '700', fontSize: '0.9rem', marginBottom: '4px' }}>
                  ⚠️ In-Transit Cancellation Policy
                </div>
                <p style={{ color: '#fdba74', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
                  Your package has already departed our warehouse. A standard courier logistics recovery fee of <strong>₹50.00</strong> will be deducted from your total.
                </p>
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed rgba(249, 115, 22, 0.4)', display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span style={{ color: '#fed7aa' }}>Net Refund Amount:</span>
                  <strong style={{ color: '#34d399' }}>₹{Math.max(0, cancellingOrder.totalAmount - 50).toFixed(2)}</strong>
                </div>
              </div>
            ) : (
              <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '14px', marginBottom: '18px' }}>
                <div style={{ color: '#34d399', fontWeight: '700', fontSize: '0.9rem', marginBottom: '4px' }}>
                  ✓ 100% Free Pre-Shipment Cancellation
                </div>
                <p style={{ color: '#6ee7b7', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
                  Your order has not been dispatched yet. You are eligible for a <strong>100% full refund</strong> with <strong>₹0 cancellation fee</strong>.
                </p>
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed rgba(16, 185, 129, 0.4)', display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span style={{ color: '#a7f3d0' }}>Total Refund Amount:</span>
                  <strong style={{ color: '#34d399' }}>₹{cancellingOrder.totalAmount.toFixed(2)}</strong>
                </div>
              </div>
            )}

            {/* Reason Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#cbd5e1', fontWeight: '600', fontSize: '0.88rem', marginBottom: '8px' }}>
                Please select a cancellation reason:
              </label>
              <select 
                value={cancelReason} 
                onChange={(e) => setCancelReason(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', fontSize: '0.9rem', color: '#f8fafc', background: '#0f172a' }}
              >
                <option value="Ordered by mistake">Ordered by mistake</option>
                <option value="Found a better price elsewhere">Found a better price elsewhere</option>
                <option value="Estimated delivery time is too long">Estimated delivery time is too long</option>
                <option value="Need to change shipping address">Need to change shipping address</option>
                <option value="Changed my mind">Changed my mind</option>
                <option value="Other">Other reason</option>
              </select>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                onClick={() => setCancellingOrder(null)} 
                className="btn" 
                style={{ background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155' }}
              >
                Keep Order
              </button>
              <button 
                type="button" 
                disabled={isSubmittingCancel} 
                onClick={handleConfirmCancel} 
                className="btn" 
                style={{ background: '#ef4444', color: '#fff', border: 'none' }}
              >
                {isSubmittingCancel ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= RETURN MODAL ================= */}
      {returningOrder && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.25rem' }}>Request Return for Order #{returningOrder._id}</h3>
              <button 
                onClick={() => setReturningOrder(null)} 
                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}
              >
                &times;
              </button>
            </div>

            <div style={{ background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '8px', padding: '14px', marginBottom: '18px' }}>
              <div style={{ color: '#a5b4fc', fontWeight: '700', fontSize: '0.9rem', marginBottom: '4px' }}>
                7-Day Easy Return Policy
              </div>
              <p style={{ color: '#c7d2fe', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
                Our courier will schedule reverse pickup from your address within 2-3 business days. A full refund of <strong>₹{returningOrder.totalAmount.toFixed(2)}</strong> will be credited once the package is picked up.
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#cbd5e1', fontWeight: '600', fontSize: '0.88rem', marginBottom: '8px' }}>
                Reason for return:
              </label>
              <select 
                value={returnReason} 
                onChange={(e) => setReturnReason(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', fontSize: '0.9rem', color: '#f8fafc', background: '#0f172a' }}
              >
                <option value="Defective or damaged item received">Defective or damaged item received</option>
                <option value="Wrong item or incorrect size/color">Wrong item or incorrect size/color</option>
                <option value="Item does not match product description">Item does not match product description</option>
                <option value="Quality not as expected">Quality not as expected</option>
                <option value="No longer needed / Changed mind">No longer needed / Changed mind</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#cbd5e1', fontWeight: '600', fontSize: '0.88rem', marginBottom: '8px' }}>
                Additional Notes (Optional):
              </label>
              <textarea 
                rows="3" 
                value={returnNotes} 
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="Provide details about the issue or pickup instructions..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', fontSize: '0.9rem', color: '#f8fafc', background: '#0f172a', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                onClick={() => setReturningOrder(null)} 
                className="btn" 
                style={{ background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155' }}
              >
                Close
              </button>
              <button 
                type="button" 
                disabled={isSubmittingReturn} 
                onClick={handleConfirmReturn} 
                className="btn" 
                style={{ padding: '8px 18px' }}
              >
                {isSubmittingReturn ? 'Submitting...' : 'Submit Return Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
