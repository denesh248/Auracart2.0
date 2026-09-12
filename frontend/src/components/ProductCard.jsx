import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart, removeFromCart } from '../redux/cartSlice';
import '../styles/product.css';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.cartItems || []);
  
  const rating = product.ratings || 0;
  const numReviews = product.numReviews || 0;
  const productId = product._id || product.id;

  const cartItem = cartItems.find((x) => String(x.productId) === String(productId));
  const inCartQty = cartItem ? cartItem.qty : 0;

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToCart({
      productId: productId,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      qty: 1,
      countInStock: product.stock
    }));
  };

  const handleIncrease = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.stock || inCartQty < product.stock) {
      dispatch(addToCart({ ...cartItem, qty: inCartQty + 1 }));
    }
  };

  const handleDecrease = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCartQty > 1) {
      dispatch(addToCart({ ...cartItem, qty: inCartQty - 1 }));
    } else {
      dispatch(removeFromCart(productId));
    }
  };

  return (
    <div className="product-card">
      <Link to={`/product/${productId}`}>
        <img src={product.imageUrl} alt={product.name} className="product-image" />
      </Link>
      <div className="product-info">
        <h3>
          <Link to={`/product/${productId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            {product.name}
          </Link>
        </h3>
        
        {/* Rating stars and count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '6px 0', fontSize: '0.85rem' }}>
          <span style={{ color: '#f59e0b', fontSize: '0.95rem' }}>★</span>
          <span style={{ fontWeight: '700', color: '#f8fafc' }}>{rating.toFixed(1)}</span>
          <span style={{ color: '#94a3b8' }}>({numReviews})</span>
        </div>

        <p className="price">₹{Number(product.price).toFixed(2)}</p>

        {/* Dynamic Add to Cart / Quantity Stepper Button */}
        <div className="product-card-actions">
          {inCartQty > 0 ? (
            <div className="card-qty-stepper">
              <button 
                type="button" 
                className="stepper-btn decrease"
                onClick={handleDecrease}
                title="Decrease quantity"
              >
                −
              </button>
              <span className="stepper-qty-display">{inCartQty} in Cart</span>
              <button 
                type="button" 
                className="stepper-btn increase"
                onClick={handleIncrease}
                disabled={product.stock && inCartQty >= product.stock}
                title="Increase quantity"
              >
                +
              </button>
            </div>
          ) : (
            <button 
              type="button" 
              className="btn-add-cart"
              onClick={handleAdd}
              disabled={product.stock <= 0}
            >
              {product.stock <= 0 ? 'Out of Stock' : '+ Add to Cart'}
            </button>
          )}
          
          <Link to={`/product/${productId}`} className="btn-card-details">
            Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
