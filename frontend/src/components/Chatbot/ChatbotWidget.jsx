import React, { useState, useEffect, useRef, useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart, removeFromCart } from '../../redux/cartSlice';
import { AuthContext } from '../../context/AuthContext';
import './chatbot.css';

const API_URL = process.env.REACT_APP_API_URL || '';

const ChatbotWidget = () => {
  const { user } = useContext(AuthContext);
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.cartItems || []);

  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "Hello! 👋 I'm Aura, your AuraCart 2.0 customer support & shopping assistant.\n\nI can help you with:\n• 🛍️ Adding, updating, or removing items in your cart\n• 📦 Tracking your order delivery status\n• ❌ Calculating cancellation fees & cancelling active orders\n• 🔄 Explaining returns & refund policies\n\nHow can I help you today?",
      time: 'Just now',
      quickReplies: ["🛍️ Browse Catalog", "🛒 View Cart", "📦 My Orders", "💰 Cancellation Fees"]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState([
    "🛍️ Browse Catalog",
    "🛒 View Cart",
    "📦 My Orders",
    "💰 Cancellation Fees"
  ]);
  const [contextOrderId, setContextOrderId] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setShowTooltip(false);
    }
  }, [isOpen, messages]);

  const getTimeString = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = async (textToSend, confirmAction = null, orderId = null, productData = null) => {
    const text = textToSend || inputText.trim();
    if (!text && !confirmAction) return;

    const userTime = getTimeString();
    
    // Add user message if typing
    if (text) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), sender: 'user', text, time: userTime }
      ]);
      setInputText('');
    }

    setLoading(true);

    const botMsgId = Date.now() + 1;
    const botTime = getTimeString();

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (user && user.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }

      const payload = {
        message: text,
        confirm_action: confirmAction,
        order_id: orderId || contextOrderId,
        cart_items: cartItems,
        product: productData
      };

      const res = await fetch(`${API_URL}/api/chat/message`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          sender: 'bot',
          text: data.reply || "I'm here to help with your orders and shopping cart.",
          time: botTime,
          orderCard: data.order_card,
          productCard: data.product_card,
          actionPrompt: data.action_prompt
        }
      ]);

      if (data.quick_replies && Array.isArray(data.quick_replies)) {
        setQuickReplies(data.quick_replies);
      }
      if (data.context_order_id) {
        setContextOrderId(data.context_order_id);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          sender: 'bot',
          text: "I'm having trouble connecting to the support server right now. Please verify your connection or try again in a moment.",
          time: getTimeString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending':
      case 'Processing':
        return 'badge-pending';
      case 'Shipped':
        return 'badge-shipped';
      case 'Delivered':
        return 'badge-delivered';
      case 'Cancelled':
        return 'badge-cancelled';
      default:
        return 'badge-pending';
    }
  };

  // Cart action helpers
  const handleAddProductFromChat = (product, qty = 1) => {
    const prodId = product.productId || product._id || product.id;
    dispatch(addToCart({
      productId: String(prodId),
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      qty: qty,
      countInStock: product.stock
    }));
    handleSendMessage(`Add ${product.name} to cart`, 'confirm_add_to_cart', null, product);
  };

  const handleRemoveProductFromChat = (product) => {
    const prodId = product.productId || product._id || product.id;
    dispatch(removeFromCart(String(prodId)));
    handleSendMessage(`Remove ${product.name} from cart`, 'confirm_remove_from_cart', null, product);
  };

  const handleUpdateQtyFromChat = (product, newQty) => {
    const prodId = product.productId || product._id || product.id;
    if (newQty <= 0) {
      handleRemoveProductFromChat(product);
    } else {
      dispatch(addToCart({
        productId: String(prodId),
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        qty: newQty,
        countInStock: product.stock
      }));
      handleSendMessage(`Update ${product.name} quantity to ${newQty}`, 'confirm_update_qty', null, { ...product, new_qty: newQty });
    }
  };

  return (
    <div className="auracart-chat-root">
      {/* Floating launcher trigger */}
      {!isOpen && (
        <div className="auracart-chat-launcher">
          {showTooltip && (
            <div 
              className="auracart-chat-tooltip"
              onClick={() => setIsOpen(true)}
            >
              <span>💬 Need help with orders or shopping? Chat with Aura</span>
            </div>
          )}
          <button 
            type="button"
            className="auracart-chat-btn" 
            onClick={() => setIsOpen(true)}
            title="Chat with AuraCart Support"
            aria-label="Open support chat"
          >
            <span style={{ fontSize: '24px' }}>💬</span>
            <span className="auracart-chat-badge" />
          </button>
        </div>
      )}

      {/* Main chat window */}
      {isOpen && (
        <div className="auracart-chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar-wrap">
                <span>🤖</span>
                <span className="chat-status-dot" />
              </div>
              <div>
                <div className="chat-header-title">AuraCart Support</div>
                <div className="chat-header-subtitle">
                  <span style={{ color: '#10b981' }}>●</span> Online • AI Shopping & Order Assistant
                </div>
              </div>
            </div>

            <div className="chat-header-actions">
              <button 
                type="button"
                className="chat-icon-btn" 
                onClick={() => setIsOpen(false)}
                title="Close chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages stream */}
          <div className="chat-body">
            {messages.map((msg) => {
              // Check if product card in this message is currently in cart
              let inCartItem = null;
              let inCartQty = 0;
              if (msg.productCard) {
                const pId = String(msg.productCard.productId || msg.productCard._id || msg.productCard.id || '');
                inCartItem = cartItems.find((x) => String(x.productId) === pId);
                inCartQty = inCartItem ? inCartItem.qty : 0;
              }

              return (
                <div key={msg.id} className={`chat-msg-row ${msg.sender}`}>
                  <div className="chat-msg-bubble">
                    {msg.text}

                    {/* Embedded In-Chat Product Card */}
                    {msg.productCard && (
                      <div className="chat-product-card">
                        <div className="chat-product-card-body">
                          {msg.productCard.imageUrl && (
                            <img 
                              src={msg.productCard.imageUrl} 
                              alt={msg.productCard.name} 
                              className="chat-product-thumb" 
                            />
                          )}
                          <div className="chat-product-details">
                            <div className="chat-product-name">{msg.productCard.name}</div>
                            <div className="chat-product-meta">
                              ₹{Number(msg.productCard.price || 0).toFixed(2)}
                            </div>
                            <div className="chat-product-stock">
                              {msg.productCard.stock > 0 ? `● ${msg.productCard.stock} in stock` : '● Out of stock'}
                            </div>
                          </div>
                        </div>

                        {/* Dynamic Quantity Button on Chat Product Card */}
                        <div className="chat-product-actions">
                          {inCartQty > 0 ? (
                            <div className="chat-qty-stepper">
                              <button 
                                type="button" 
                                className="chat-stepper-btn"
                                onClick={() => handleUpdateQtyFromChat(msg.productCard, inCartQty - 1)}
                                title="Decrease quantity"
                              >
                                −
                              </button>
                              <span className="chat-stepper-text">{inCartQty} in Cart</span>
                              <button 
                                type="button" 
                                className="chat-stepper-btn"
                                onClick={() => handleUpdateQtyFromChat(msg.productCard, inCartQty + 1)}
                                disabled={msg.productCard.stock && inCartQty >= msg.productCard.stock}
                                title="Increase quantity"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button 
                              type="button" 
                              className="chat-add-btn"
                              onClick={() => handleAddProductFromChat(msg.productCard, 1)}
                              disabled={msg.productCard.stock <= 0}
                            >
                              {msg.productCard.stock <= 0 ? 'Out of Stock' : '+ Add to Cart'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Embedded Order Card */}
                    {msg.orderCard && (
                      <div className="chat-order-card">
                        <div className="chat-order-card-top">
                          <span className="chat-order-title">
                            Order #{msg.orderCard.order_id}
                          </span>
                          <span className={`chat-order-status-badge ${getStatusBadgeClass(msg.orderCard.status)}`}>
                            {msg.orderCard.status}
                          </span>
                        </div>

                        <div className="chat-order-meta">
                          <span>{msg.orderCard.date || 'Recent'}</span>
                          <span style={{ color: '#059669', fontWeight: '700' }}>
                            ₹{Number(msg.orderCard.total || 0).toFixed(2)}
                          </span>
                        </div>

                        {msg.orderCard.can_cancel && (
                          <button
                            type="button"
                            className="chat-chip"
                            style={{ alignSelf: 'flex-start', marginTop: '6px', background: '#fee2e2', color: '#b91c1c', borderColor: '#fecaca' }}
                            onClick={() => handleSendMessage(`Cancel Order #${msg.orderCard.order_id}`)}
                          >
                            ❌ Request Cancellation
                          </button>
                        )}
                      </div>
                    )}

                    {/* Human-in-the-loop: Confirm Order Cancellation */}
                    {msg.actionPrompt && msg.actionPrompt.type === 'confirm_cancellation' && (
                      <div className="chat-confirm-box">
                        <div style={{ color: '#b91c1c', fontWeight: '700', fontSize: '13px' }}>
                          ⚠️ Confirm Order #{msg.actionPrompt.order_id} Cancellation
                        </div>
                        <div className="chat-confirm-details">
                          <div>• Cancellation Fee: <strong>₹{Number(msg.actionPrompt.fee || 0).toFixed(2)}</strong></div>
                          <div>• Refund to Account: <strong style={{ color: '#059669' }}>₹{Number(msg.actionPrompt.refund || 0).toFixed(2)}</strong></div>
                        </div>
                        <div className="chat-confirm-actions">
                          <button
                            type="button"
                            className="btn-confirm-cancel"
                            onClick={() => handleSendMessage(
                              `Confirm Cancel #${msg.actionPrompt.order_id}`, 
                              'confirm_cancellation', 
                              msg.actionPrompt.order_id
                            )}
                          >
                            ✅ Yes, Cancel Order
                          </button>
                          <button
                            type="button"
                            className="btn-abort-cancel"
                            onClick={() => handleSendMessage(`Keep Order #${msg.actionPrompt.order_id}`)}
                          >
                            ✕ Keep Order
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Human-in-the-loop: Confirm Add to Cart */}
                    {msg.actionPrompt && msg.actionPrompt.type === 'confirm_add_to_cart' && (
                      <div className="chat-confirm-box add-box">
                        <div style={{ color: '#1d4ed8', fontWeight: '700', fontSize: '13px' }}>
                          🛍️ Add to Shopping Cart?
                        </div>
                        <div className="chat-confirm-details">
                          <div>• Product: <strong>{msg.actionPrompt.product.name}</strong></div>
                          <div>• Price: <strong style={{ color: '#059669' }}>₹{Number(msg.actionPrompt.product.price || 0).toFixed(2)}</strong></div>
                          <div>• Stock: <span>{msg.actionPrompt.product.stock || 'Available'} units</span></div>
                        </div>
                        <div className="chat-confirm-actions">
                          <button
                            type="button"
                            className="btn-confirm-add"
                            onClick={() => handleAddProductFromChat(msg.actionPrompt.product, msg.actionPrompt.qty || 1)}
                          >
                            ✅ Add to Cart
                          </button>
                          <button
                            type="button"
                            className="btn-abort-cancel"
                            onClick={() => handleSendMessage('Cancel adding to cart')}
                          >
                            ✕ Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Human-in-the-loop: Confirm Remove from Cart */}
                    {msg.actionPrompt && msg.actionPrompt.type === 'confirm_remove_from_cart' && (
                      <div className="chat-confirm-box remove-box">
                        <div style={{ color: '#b91c1c', fontWeight: '700', fontSize: '13px' }}>
                          🗑️ Confirm Remove from Cart
                        </div>
                        <div className="chat-confirm-details">
                          <div>• Product: <strong>{msg.actionPrompt.product.name}</strong></div>
                          <div>• Current Quantity: <strong>{msg.actionPrompt.product.qty || 1}</strong></div>
                        </div>
                        <div className="chat-confirm-actions">
                          <button
                            type="button"
                            className="btn-confirm-remove"
                            onClick={() => handleRemoveProductFromChat(msg.actionPrompt.product)}
                          >
                            🗑️ Yes, Remove
                          </button>
                          <button
                            type="button"
                            className="btn-abort-cancel"
                            onClick={() => handleSendMessage('Keep item in cart')}
                          >
                            ✕ Keep in Cart
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Human-in-the-loop: Confirm Update Quantity */}
                    {msg.actionPrompt && msg.actionPrompt.type === 'confirm_update_qty' && (
                      <div className="chat-confirm-box update-box">
                        <div style={{ color: '#047857', fontWeight: '700', fontSize: '13px' }}>
                          🔢 Confirm Quantity Update
                        </div>
                        <div className="chat-confirm-details">
                          <div>• Product: <strong>{msg.actionPrompt.product.name}</strong></div>
                          <div>• Quantity: <strong>{msg.actionPrompt.current_qty}</strong> ➔ <strong style={{ color: '#059669' }}>{msg.actionPrompt.new_qty}</strong></div>
                          <div>• Subtotal: <strong>₹{(Number(msg.actionPrompt.new_qty) * Number(msg.actionPrompt.product.price || 0)).toFixed(2)}</strong></div>
                        </div>
                        <div className="chat-confirm-actions">
                          <button
                            type="button"
                            className="btn-confirm-update"
                            onClick={() => handleUpdateQtyFromChat(msg.actionPrompt.product, msg.actionPrompt.new_qty)}
                          >
                            ✅ Update to {msg.actionPrompt.new_qty}
                          </button>
                          <button
                            type="button"
                            className="btn-abort-cancel"
                            onClick={() => handleSendMessage('Cancel quantity update')}
                          >
                            ✕ Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="chat-msg-time">{msg.time}</div>
                </div>
              );
            })}

            {loading && (
              <div className="chat-msg-row bot">
                <div className="chat-msg-bubble">
                  <div className="typing-dots">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick reply suggestion chips */}
          {quickReplies.length > 0 && (
            <div className="chat-chips-container">
              {quickReplies.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="chat-chip"
                  onClick={() => handleSendMessage(chip)}
                  disabled={loading}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input field */}
          <div className="chat-footer">
            <input
              type="text"
              className="chat-input"
              placeholder="Search products, manage cart, track orders..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              type="button"
              className="chat-send-btn"
              onClick={() => handleSendMessage()}
              disabled={loading || !inputText.trim()}
              title="Send message"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotWidget;
