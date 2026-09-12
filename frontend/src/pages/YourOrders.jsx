import React, { useEffect, useState, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || '';

const YourOrders = () => {
  const { user, logout } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'active', 'delivered', 'cancelled'
  const [searchQuery, setSearchQuery] = useState('');

  // Cancellation Modal State
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('Ordered by mistake');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  // Return Modal State
  const [returningOrder, setReturningOrder] = useState(null);
  const [returnReason, setReturnReason] = useState('Defective or damaged item received');
  const [returnNotes, setReturnNotes] = useState('');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  const fetchOrders = async () => {
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
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      showToast('Could not load orders. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Execute Order Cancellation
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
        fetchOrders();
      } else {
        showToast(data.message || 'Cancellation failed', 'error');
      }
    } catch (err) {
      showToast('Network error during cancellation', 'error');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  // Execute Order Return
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
        showToast(data.message || 'Return request registered successfully!', 'success');
        setReturningOrder(null);
        setReturnNotes('');
        fetchOrders();
      } else {
        showToast(data.message || 'Return request failed', 'error');
      }
    } catch (err) {
      showToast('Network error during return request', 'error');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  // Filtered Orders calculation
  const filteredOrders = useMemo(() => {
    let result = orders;

    // Filter by tab
    if (activeTab === 'active') {
      result = result.filter(o => ['Pending', 'Processing', 'Shipped'].includes(o.status));
    } else if (activeTab === 'delivered') {
      result = result.filter(o => o.status === 'Delivered');
    } else if (activeTab === 'cancelled') {
      result = result.filter(o => ['Cancelled', 'Return Requested', 'Returned'].includes(o.status));
    }

    // Filter by search query (order ID or item name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(o => {
        const idMatch = o._id.toLowerCase().includes(q);
        const itemMatch = o.items && o.items.some(i => i.name && i.name.toLowerCase().includes(q));
        return idMatch || itemMatch;
      });
    }

    return result;
  }, [orders, activeTab, searchQuery]);

  // Visual Stepper for Order Status
  // Simple Order Status Display
  const renderStatusTracker = (status) => {
    return (
      <div style={{
        margin: '12px 0 16px 0',
        padding: '10px 14px',
        background: '#0f172a',
        borderRadius: '6px',
        border: '1px solid #334155',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.9rem'
      }}>
        <span style={{ color: '#94a3b8', fontWeight: '500' }}>Order Status:</span>
        <span style={{
          color: status === 'Delivered' ? '#34d399' : status === 'Shipped' ? '#60a5fa' : status === 'Cancelled' ? '#f87171' : '#facc15',
          fontWeight: '700'
        }}>
          {status}
        </span>
      </div>
    );
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
    maxWidth: '540px',
    width: '100%',
    padding: '28px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#f8fafc'
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: '1050px', margin: '24px auto', padding: '0 16px' }}>
      
      {/* Breadcrumb Navigation */}
      <div style={{ color: '#94a3b8', marginBottom: '16px', fontSize: '0.9rem' }}>
        <Link to="/" style={{ color: '#818cf8', textDecoration: 'none' }}>Home</Link> / <span style={{ color: '#f8fafc', fontWeight: '500' }}>Your Orders</span>
      </div>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#f8fafc', margin: '0 0 6px 0' }}>Your Orders</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0 }}>
            Track shipments, review past purchases, and manage cancellations or returns in AuraCart 2.0.
          </p>
        </div>
        <Link to="/shop" className="btn" style={{ padding: '9px 18px', textDecoration: 'none', fontSize: '0.9rem' }}>
          Continue Shopping
        </Link>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', background: '#111827', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `All Orders (${orders.length})` },
            { id: 'active', label: 'Active & In Progress' },
            { id: 'delivered', label: 'Delivered' },
            { id: 'cancelled', label: 'Cancelled & Returns' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '7px 16px',
                borderRadius: '20px',
                border: activeTab === tab.id ? '1px solid #6366f1' : '1px solid #334155',
                background: activeTab === tab.id ? 'rgba(99, 102, 241, 0.25)' : '#0f172a',
                color: activeTab === tab.id ? '#a5b4fc' : '#94a3b8',
                fontWeight: activeTab === tab.id ? '700' : '500',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ minWidth: '240px', flexGrow: 1, maxWidth: '360px' }}>
          <input
            type="text"
            placeholder="Search orders by item or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '9px 16px', borderRadius: '20px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', fontSize: '0.85rem', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Orders List Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#818cf8' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>Loading your orders...</div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ background: '#111827', padding: '50px 20px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📦</div>
          <h3 style={{ color: '#f8fafc', fontSize: '1.25rem', marginBottom: '8px' }}>No orders found</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '20px', maxWidth: '450px', margin: '0 auto 20px auto' }}>
            {searchQuery ? `No orders matched your search "${searchQuery}".` : "You don't have any orders under this category yet."}
          </p>
          <Link to="/shop" className="btn" style={{ padding: '10px 22px', textDecoration: 'none' }}>Start Shopping</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '22px' }}>
          {filteredOrders.map(order => {
            const isPendingOrProcessing = order.status === 'Pending' || order.status === 'Processing';
            const isShipped = order.status === 'Shipped';
            const isDelivered = order.status === 'Delivered';
            const isCancelled = order.status === 'Cancelled';
            const isReturnRequested = order.status === 'Return Requested' || order.status === 'Returned';

            return (
              <div key={order._id} style={{ background: '#111827', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 8px 24px rgba(0,0,0,0.35)', overflow: 'hidden' }}>
                
                {/* Order Card Header */}
                <div style={{ background: '#0f172a', padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '14px' }}>
                  <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '2px' }}>Order Placed</span>
                      <span style={{ color: '#f8fafc', fontWeight: '600', fontSize: '0.88rem' }}>
                        {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <div>
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '2px' }}>Total Amount</span>
                      <strong style={{ color: '#10b981', fontSize: '0.95rem' }}>₹{order.totalAmount.toFixed(2)}</strong>
                    </div>

                    <div>
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '2px' }}>Ship To</span>
                      <span style={{ color: '#f8fafc', fontSize: '0.88rem', fontWeight: '500' }}>
                        {order.address ? order.address.fullName : 'Customer'}
                      </span>
                    </div>

                    <div>
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '2px' }}>Payment</span>
                      <span style={{ color: '#34d399', fontSize: '0.85rem', fontWeight: '600' }}>
                        ✓ Paid Directly
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Order #{order._id}</span>
                    <span style={{
                      background: isDelivered ? 'rgba(34, 197, 94, 0.2)' : isShipped ? 'rgba(59, 130, 246, 0.2)' : isCancelled ? 'rgba(239, 68, 68, 0.2)' : isReturnRequested ? 'rgba(168, 85, 247, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                      color: isDelivered ? '#4ade80' : isShipped ? '#60a5fa' : isCancelled ? '#f87171' : isReturnRequested ? '#c084fc' : '#facc15',
                      padding: '5px 14px', borderRadius: '16px', fontWeight: '700', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px'
                    }}>
                      <span>●</span> {order.status}
                    </span>
                  </div>
                </div>

                {/* Order Body */}
                <div style={{ padding: '20px' }}>
                  
                  {/* Step Tracker for Active / Delivered Orders */}
                  {renderStatusTracker(order.status)}

                  {/* Cancelled Order Policy Summary */}
                  {isCancelled && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '14px 16px', marginBottom: '18px', fontSize: '0.88rem', color: '#fca5a5' }}>
                      <div style={{ fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>✕</span> Order Cancelled {order.cancelledAt ? `on ${new Date(order.cancelledAt).toLocaleDateString()}` : ''}
                      </div>
                      <div style={{ margin: '4px 0' }}>
                        Cancellation Fee Charged: <strong style={{ color: '#f87171' }}>₹{(order.cancellationFee || 0).toFixed(2)}</strong> | Net Refund Initiated: <strong style={{ color: '#34d399' }}>₹{(order.refundAmount || order.totalAmount).toFixed(2)}</strong>
                      </div>
                      {order.cancellationReason && (
                        <div style={{ fontSize: '0.82rem', color: '#f87171', marginTop: '4px' }}>
                          Reason: <em>"{order.cancellationReason}"</em>
                        </div>
                      )}
                      <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '6px' }}>
                        Full refund of ₹{(order.refundAmount || order.totalAmount).toFixed(2)} has been credited to your payment method.
                      </div>
                    </div>
                  )}

                  {/* Return Requested Summary */}
                  {isReturnRequested && (
                    <div style={{ background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px', padding: '14px 16px', marginBottom: '18px', fontSize: '0.88rem', color: '#d8b4fe' }}>
                      <div style={{ fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>↺</span> Return Request Registered ({order.returnStatus || 'Pickup Scheduled'})
                      </div>
                      <div style={{ margin: '4px 0' }}>
                        Reason for return: <strong>"{order.returnReason}"</strong>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#c084fc', marginTop: '4px' }}>
                        Our logistics courier will collect the package from your address. Total refund of ₹{order.totalAmount.toFixed(2)} will be initiated once inspected.
                      </div>
                    </div>
                  )}

                  {/* Items list */}
                  <div style={{ display: 'grid', gap: '14px', marginBottom: '18px' }}>
                    {order.items && order.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: idx < order.items.length - 1 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }} />
                          ) : (
                            <div style={{ width: '56px', height: '56px', background: '#0f172a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>📦</div>
                          )}
                          <div>
                            <Link to={`/product/${item.productId}`} style={{ color: '#f8fafc', fontWeight: '600', textDecoration: 'none', fontSize: '0.95rem' }}>
                              {item.name}
                            </Link>
                            <div style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '2px' }}>
                              Qty: {item.qty} × ₹{item.price.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>₹{(item.qty * item.price).toFixed(2)}</strong>
                          <div>
                            <Link to={`/product/${item.productId}`} style={{ fontSize: '0.8rem', color: '#818cf8', textDecoration: 'none', fontWeight: '500' }}>
                              View Item →
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Address & Actions Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    {/* Shipping Address details */}
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8', maxWidth: '420px' }}>
                      <strong style={{ color: '#cbd5e1' }}>Delivery Destination: </strong>
                      {order.address ? `${order.address.fullName}, ${order.address.street}, ${order.address.city} (${order.address.postalCode}), ${order.address.country}` : 'Provided at checkout'}
                    </div>

                    {/* Scenario Actions */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {/* Scenario 1: Before Shipping (Free Cancellation) */}
                      {isPendingOrProcessing && (
                        <button
                          onClick={() => setCancellingOrder(order)}
                          className="btn"
                          style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.35)', padding: '8px 18px', fontSize: '0.88rem', fontWeight: '600' }}
                        >
                          Cancel Order (Free ₹0 Fee)
                        </button>
                      )}

                      {/* Scenario 2: After Shipping (In Transit - ₹50 Fee) */}
                      {isShipped && (
                        <button
                          onClick={() => setCancellingOrder(order)}
                          className="btn"
                          style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#fb923c', border: '1px solid rgba(249, 115, 22, 0.35)', padding: '8px 18px', fontSize: '0.88rem', fontWeight: '600' }}
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
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.25rem' }}>
                Cancel Order #{cancellingOrder._id}
              </h3>
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
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.25rem' }}>
                Request Return for Order #{returningOrder._id}
              </h3>
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

export default YourOrders;
