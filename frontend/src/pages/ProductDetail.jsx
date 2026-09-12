import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart, removeFromCart } from '../redux/cartSlice';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import '../styles/product.css';

const API_URL = process.env.REACT_APP_API_URL || '';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewsData, setReviewsData] = useState({ reviews: [], star_counts: {}, average_rating: 0, num_reviews: 0 });
  
  // New review form states
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const { user } = useContext(AuthContext);
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const fetchProduct = async () => {
    try {
      const res = await fetch(`${API_URL}/api/products/${id}`);
      const data = await res.json();
      setProduct(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_URL}/api/products/${id}/reviews`);
      const data = await res.json();
      if (res.ok && data.success) {
        setReviewsData(data);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  useEffect(() => {
    fetchProduct();
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const cartItems = useSelector((state) => state.cart.cartItems || []);
  const productId = product?._id || product?.id;
  const cartItem = cartItems.find((x) => String(x.productId) === String(productId));
  const inCartQty = cartItem ? cartItem.qty : 0;

  const handleAddToCart = () => {
    if (product) {
      dispatch(addToCart({
        productId: productId,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        qty: 1,
        countInStock: product.stock
      }));
      showToast(`${product.name} added to cart!`, 'success');
    }
  };

  const handleIncreaseQty = () => {
    if (!product.stock || inCartQty < product.stock) {
      dispatch(addToCart({ ...cartItem, qty: inCartQty + 1 }));
    } else {
      showToast('Maximum available stock reached', 'info');
    }
  };

  const handleDecreaseQty = () => {
    if (inCartQty > 1) {
      dispatch(addToCart({ ...cartItem, qty: inCartQty - 1 }));
    } else {
      dispatch(removeFromCart(productId));
      showToast('Removed from cart', 'info');
    }
  };


  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to submit a review', 'error');
      return;
    }
    if (!comment.trim()) {
      showToast('Please enter a review comment', 'error');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await fetch(`${API_URL}/api/products/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({ rating, comment: comment.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Review submitted successfully!', 'success');
        setComment('');
        setRating(5);
        fetchReviews();
        fetchProduct(); // Refresh product avg rating
      } else {
        showToast(data.message || 'Failed to submit review', 'error');
      }
    } catch (err) {
      showToast('Network error while posting review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Helper for rendering star icons
  const renderStars = (score) => {
    const rounded = Math.round(score);
    return (
      <span style={{ color: '#f59e0b', fontSize: '1.1rem', letterSpacing: '2px' }}>
        {'★'.repeat(Math.min(5, Math.max(0, rounded))) + '☆'.repeat(Math.max(0, 5 - rounded))}
      </span>
    );
  };

  if (loading) return <div style={{ textAlign: 'center', margin: '60px', color: '#2563eb' }}>Loading product details...</div>;
  if (!product) return <div style={{ textAlign: 'center', margin: '60px', color: '#dc2626' }}>Product Not Found</div>;

  const currentAvg = reviewsData.average_rating || product.ratings || 0;
  const currentTotal = reviewsData.num_reviews || product.numReviews || 0;

  return (
    <div className="product-detail-wrapper" style={{ maxWidth: '1100px', margin: '0 auto', padding: '16px' }}>
      
      {/* Breadcrumb Navigation */}
      <div style={{ color: '#94a3b8', marginBottom: '20px', fontSize: '0.9rem' }}>
        <Link to="/" style={{ color: '#818cf8', textDecoration: 'none' }}>Home</Link> / <Link to="/shop" style={{ color: '#818cf8', textDecoration: 'none' }}>Shop</Link> / {product.category} / <span style={{ color: '#f8fafc', fontWeight: '500' }}>{product.name}</span>
      </div>

      <div className="product-detail">
        {/* Left Side: Image */}
        <div className="detail-image-container">
          <img src={product.imageUrl} alt={product.name} className="detail-image" />
        </div>

        {/* Right Side: Information Block */}
        <div className="detail-info">
          
          <h2 style={{ fontSize: '1.8rem', marginBottom: '10px', color: '#f8fafc' }}>{product.name}</h2>

          {/* Rating summary in header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            {renderStars(currentAvg)}
            <span style={{ fontWeight: '700', color: '#f8fafc', fontSize: '0.95rem' }}>{currentAvg.toFixed(1)}</span>
            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>({currentTotal} review{currentTotal === 1 ? '' : 's'})</span>
          </div>

          <p className="detail-price" style={{ fontSize: '1.7rem', margin: '10px 0', color: '#10b981', fontWeight: '700' }}>
            ₹{product.price.toFixed(2)}
          </p>

          {/* Description */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#f8fafc', marginBottom: '8px', fontSize: '1rem' }}>Product Description</h4>
            <p style={{ color: '#cbd5e1', lineHeight: '1.6' }}>{product.description}</p>
          </div>

          {/* Cart & Stock Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {inCartQty > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#1e293b', padding: '10px 18px', borderRadius: '10px', border: '1px solid #3b82f6', flexGrow: 1 }}>
                <button 
                  type="button" 
                  className="stepper-btn decrease"
                  style={{ width: '40px', height: '40px', fontSize: '1.4rem' }}
                  onClick={handleDecreaseQty}
                  title="Decrease quantity"
                >
                  −
                </button>
                <div style={{ flexGrow: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#60a5fa' }}>{inCartQty} in Cart</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Subtotal: ₹{(inCartQty * product.price).toFixed(2)}</div>
                </div>
                <button 
                  type="button" 
                  className="stepper-btn increase"
                  style={{ width: '40px', height: '40px', fontSize: '1.4rem' }}
                  onClick={handleIncreaseQty}
                  disabled={product.stock && inCartQty >= product.stock}
                  title="Increase quantity"
                >
                  +
                </button>
                <Link to="/cart" className="btn" style={{ padding: '10px 18px', background: '#10b981', textDecoration: 'none', marginLeft: '8px' }}>
                  View Cart 🛒
                </Link>
              </div>
            ) : (
              <button 
                onClick={handleAddToCart} 
                className="btn" 
                style={{ flexGrow: '1', padding: '14px', fontSize: '1rem' }}
                disabled={product.stock <= 0}
              >
                {product.stock <= 0 ? 'Out of Stock' : 'Add to Shopping Cart'}
              </button>
            )}
          </div>
          
          <p style={{ marginTop: '16px', color: product.stock > 0 ? '#10b981' : '#f87171', fontWeight: '600', fontSize: '0.9rem' }}>
            {product.stock > 0 ? `● In Stock (${product.stock} available)` : `● Out of Stock`}
          </p>

        </div>
      </div>

      {/* ================= RATINGS & REVIEWS SECTION ================= */}
      <div style={{ marginTop: '50px', paddingTop: '30px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#f8fafc', marginBottom: '24px' }}>
          Customer Ratings & Reviews
        </h3>

        {/* Rating Overview Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', background: '#111827', padding: '24px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '32px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
          {/* Average Score */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '3rem', fontWeight: '800', color: '#f8fafc', lineHeight: '1' }}>{currentAvg.toFixed(1)}</div>
            <div style={{ margin: '8px 0' }}>{renderStars(currentAvg)}</div>
            <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Based on {currentTotal} verified review{currentTotal === 1 ? '' : 's'}</div>
          </div>

          {/* Rating Breakdown Bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
            {[5, 4, 3, 2, 1].map(star => {
              const count = (reviewsData.star_counts && reviewsData.star_counts[star]) || 0;
              const percent = currentTotal > 0 ? Math.round((count / currentTotal) * 100) : 0;
              return (
                <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                  <span style={{ width: '45px', color: '#94a3b8', fontWeight: '500' }}>{star} Star</span>
                  <div style={{ flexGrow: 1, height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${percent}%`, height: '100%', background: '#f59e0b', borderRadius: '4px' }} />
                  </div>
                  <span style={{ width: '35px', textAlign: 'right', color: '#94a3b8' }}>{percent}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Review Form */}
        <div style={{ background: '#111827', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '24px', marginBottom: '36px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
          <h4 style={{ fontSize: '1.15rem', fontWeight: '600', color: '#f8fafc', marginBottom: '16px' }}>
            Write a Customer Review
          </h4>

          {user ? (
            <form onSubmit={handleSubmitReview}>
              {/* Star selector */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#cbd5e1', fontWeight: '600', fontSize: '0.88rem', marginBottom: '8px' }}>
                  Your Rating:
                </label>
                <div style={{ display: 'flex', gap: '6px', cursor: 'pointer' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span 
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      style={{ 
                        fontSize: '1.8rem', 
                        color: (hoverRating || rating) >= star ? '#f59e0b' : '#334155',
                        transition: 'color 0.15s ease'
                      }}
                    >
                      ★
                    </span>
                  ))}
                  <span style={{ marginLeft: '10px', fontSize: '0.9rem', color: '#94a3b8', alignSelf: 'center' }}>
                    {rating} of 5 Stars
                  </span>
                </div>
              </div>

              {/* Comment text */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#cbd5e1', fontWeight: '600', fontSize: '0.88rem', marginBottom: '8px' }}>
                  Your Feedback:
                </label>
                <textarea 
                  rows="4" 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell other shoppers what you like or dislike about this product..."
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={submittingReview} 
                className="btn" 
                style={{ padding: '10px 24px', fontSize: '0.95rem' }}
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          ) : (
            <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8', fontSize: '0.95rem' }}>
              Want to review this product? <Link to="/login" style={{ color: '#818cf8', fontWeight: '600', textDecoration: 'none' }}>Sign in to your account</Link> to share your review.
            </div>
          )}
        </div>

        {/* Existing Reviews List */}
        <div>
          <h4 style={{ fontSize: '1.15rem', fontWeight: '600', color: '#f8fafc', marginBottom: '16px' }}>
            Customer Reviews ({reviewsData.reviews ? reviewsData.reviews.length : 0})
          </h4>

          {(!reviewsData.reviews || reviewsData.reviews.length === 0) ? (
            <div style={{ padding: '30px', textAlign: 'center', background: '#111827', borderRadius: '8px', color: '#94a3b8', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              No reviews yet for this product. Be the first to share your thoughts!
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {reviewsData.reviews.map(r => (
                <div key={r._id || r.id} style={{ background: '#111827', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '18px 20px', boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
                        {r.name ? r.name[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#f8fafc', fontSize: '0.95rem' }}>{r.name}</div>
                        <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '600' }}>✓ Verified Buyer</span>
                      </div>
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div style={{ marginBottom: '8px' }}>
                    {renderStars(r.rating)}
                  </div>

                  <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: '1.5', margin: 0 }}>
                    {r.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default ProductDetail;
