import React, { useState, useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { clearCart } from '../redux/cartSlice';

const API_URL = process.env.REACT_APP_API_URL || '';

const Checkout = () => {
  const { user } = useContext(AuthContext);
  const cartItems = useSelector((state) => state.cart.cartItems);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);
  const [address, setAddress] = useState({
    fullName: user ? user.name : '',
    street: '',
    city: '',
    postalCode: '',
    country: ''
  });

  const totalPrice = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

  const handleDirectPaymentAndOrder = async () => {
    if (cartItems.length === 0) {
      showToast("Your cart is empty.", 'info');
      return;
    }

    setIsProcessing(true);

    try {
      // Direct payment confirmation & order placement
      const paymentId = `DIRECT_PAID_${Date.now()}`;
      
      const authHeaders = user?.token ? { Authorization: `Bearer ${user.token}` } : {};
      
      const saveOrderRes = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify({
          items: cartItems,
          totalAmount: totalPrice,
          address,
          paymentId
        })
      });

      const data = await saveOrderRes.json();

      if (saveOrderRes.ok) {
        dispatch(clearCart());
        showToast('Payment successful! Order processed to next state.', 'success');
        navigate('/ordersuccess');
      } else {
        showToast(data.message || 'Failed to process order.', 'error');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Order processing error:', error);
      showToast('Error processing payment and order. Please try again.', 'error');
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleDirectPaymentAndOrder();
  };

  const inputStyle = {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #334155',
    background: '#0f172a',
    color: '#f8fafc',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    marginBottom: '14px',
    boxSizing: 'border-box'
  };

  return (
    <div className="checkout-container" style={{ maxWidth: '600px', margin: '30px auto', padding: '0 16px' }}>
      <div style={{
        background: '#111827',
        borderRadius: '16px',
        boxShadow: '0 12px 36px rgba(0,0,0,0.45)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '32px'
      }}>
        <h2 style={{ fontSize: '1.65rem', fontWeight: '700', marginBottom: '8px', color: '#f8fafc' }}>Checkout Order</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '24px' }}>
          Complete your delivery details. Instant order confirmation with AuraCart 2.0.
        </p>

        {cartItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 20px', background: '#0f172a', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <p style={{ color: '#94a3b8', marginBottom: '16px', fontSize: '1rem' }}>Your shopping cart is currently empty.</p>
            <button type="button" onClick={() => navigate('/shop')} className="btn" style={{ padding: '10px 24px' }}>
              Browse Products to Add Items
            </button>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="shipping-form" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '16px', color: '#f8fafc', fontWeight: '600' }}>Shipping Details</h3>
          
          <input 
            type="text" 
            placeholder="Full Name" 
            required 
            disabled={isProcessing}
            value={address.fullName} 
            onChange={(e) => setAddress({...address, fullName: e.target.value})} 
            style={inputStyle} 
          />
          <input 
            type="text" 
            placeholder="Street Address" 
            required 
            disabled={isProcessing}
            value={address.street} 
            onChange={(e) => setAddress({...address, street: e.target.value})} 
            style={inputStyle} 
          />
          <input 
            type="text" 
            placeholder="City" 
            required 
            disabled={isProcessing}
            value={address.city} 
            onChange={(e) => setAddress({...address, city: e.target.value})} 
            style={inputStyle} 
          />
          <input 
            type="text" 
            placeholder="Postal Code" 
            required 
            disabled={isProcessing}
            value={address.postalCode} 
            onChange={(e) => setAddress({...address, postalCode: e.target.value})} 
            style={inputStyle} 
          />
          <input 
            type="text" 
            placeholder="Country" 
            required 
            disabled={isProcessing}
            value={address.country} 
            onChange={(e) => setAddress({...address, country: e.target.value})} 
            style={inputStyle} 
          />
          
          <div className="checkout-summary" style={{ 
            marginTop: '16px', 
            background: '#0f172a', 
            padding: '22px', 
            borderRadius: '12px', 
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Items in cart:</span>
              <span style={{ fontWeight: '600', color: '#f8fafc' }}>{cartItems.reduce((acc, item) => acc + item.qty, 0)}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Payment Method:</span>
              <span style={{ 
                background: 'rgba(16, 185, 129, 0.2)', 
                color: '#34d399', 
                fontSize: '0.82rem', 
                fontWeight: '600', 
                padding: '4px 12px', 
                borderRadius: '16px',
                border: '1px solid rgba(16, 185, 129, 0.35)'
              }}>
                Direct Instant Payment
              </span>
            </div>

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '14px', marginBottom: '18px' }}>
              <h4 style={{ fontSize: '1.25rem', margin: 0, color: '#f8fafc', display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Amount:</span>
                <span style={{ color: '#10b981', fontWeight: '700' }}>₹{totalPrice.toFixed(2)}</span>
              </h4>
            </div>

            <button 
              type="submit" 
              className="btn" 
              disabled={isProcessing || cartItems.length === 0}
              style={{ 
                width: '100%', 
                padding: '14px', 
                fontSize: '15px',
                fontWeight: '600',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                opacity: isProcessing ? 0.75 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isProcessing ? (
                <>
                  <span style={{
                    display: 'inline-block',
                    width: '16px',
                    height: '16px',
                    border: '2px solid #ffffff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }}></span>
                  Processing Payment & Order...
                </>
              ) : (
                'Pay & Complete Order'
              )}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default Checkout;
