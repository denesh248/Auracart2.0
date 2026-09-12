"""
AuraCart Core Service Layer
Modular, decoupled business logic designed to power:
1. Standard DRF API endpoints and Views
2. Future LangChain / LangGraph AI agent tools and nodes
"""

from datetime import datetime
from django.utils import timezone
from django.db.models import Avg, Count
from .models import Order, OrderItem, Product, Review, User


def get_cancellation_policy(order_id: int | str, user=None) -> dict:
    """
    Evaluates order status and returns cancellation/return eligibility, fees, and explanations.
    Ready to be used as a tool by LangGraph AI agents or frontend quote API.
    """
    try:
        order = Order.objects.get(id=order_id)
    except (Order.DoesNotExist, ValueError):
        return {
            'success': False,
            'message': f'Order #{order_id} not found',
            'can_cancel': False,
            'can_return': False
        }

    # Verify user ownership if user passed and not admin
    if user and getattr(user, 'role', '') != 'admin' and order.user_id != user.id:
        return {
            'success': False,
            'message': 'Unauthorized to access this order policy',
            'can_cancel': False,
            'can_return': False
        }

    total = float(order.total_amount)
    status = order.status

    if status in ['Pending', 'Processing']:
        fee = 0.0
        refund = round(total, 2)
        return {
            'success': True,
            'order_id': str(order.id),
            'status': status,
            'total_amount': total,
            'can_cancel': True,
            'can_return': False,
            'cancellation_fee': fee,
            'refund_amount': refund,
            'policy_type': 'pre_shipment',
            'policy_description': 'Order has not shipped yet. 100% full refund with ₹0 cancellation fee.'
        }
    elif status == 'Shipped':
        fee = min(50.0, total)
        refund = round(max(0.0, total - fee), 2)
        return {
            'success': True,
            'order_id': str(order.id),
            'status': status,
            'total_amount': total,
            'can_cancel': True,
            'can_return': False,
            'cancellation_fee': fee,
            'refund_amount': refund,
            'policy_type': 'in_transit',
            'policy_description': f'Order is currently in transit with courier. A standard logistics recovery fee of ₹{fee:.2f} applies. Refund: ₹{refund:.2f}.'
        }
    elif status == 'Delivered':
        return {
            'success': True,
            'order_id': str(order.id),
            'status': status,
            'total_amount': total,
            'can_cancel': False,
            'can_return': True,
            'cancellation_fee': 0.0,
            'refund_amount': round(total, 2),
            'policy_type': 'post_delivery',
            'return_window_days': 7,
            'policy_description': 'Order has been delivered. Eligible for return and refund within our 7-day return window.'
        }
    elif status == 'Cancelled':
        return {
            'success': True,
            'order_id': str(order.id),
            'status': status,
            'total_amount': total,
            'can_cancel': False,
            'can_return': False,
            'cancellation_fee': float(order.cancellation_fee),
            'refund_amount': float(order.refund_amount),
            'policy_type': 'already_cancelled',
            'policy_description': f'Order #{order.id} was already cancelled. Refund: ₹{order.refund_amount:.2f}.'
        }
    elif status in ['Return Requested', 'Returned']:
        return {
            'success': True,
            'order_id': str(order.id),
            'status': status,
            'total_amount': total,
            'can_cancel': False,
            'can_return': False,
            'cancellation_fee': 0.0,
            'refund_amount': round(total, 2),
            'policy_type': 'return_in_progress',
            'policy_description': f'Return request is currently in progress ({order.return_status or "Requested"}).'
        }
    else:
        return {
            'success': False,
            'order_id': str(order.id),
            'status': status,
            'can_cancel': False,
            'can_return': False,
            'policy_description': f'Order status {status} does not permit cancellation or return.'
        }


def cancel_order_service(order_id: int | str, reason: str, user=None) -> dict:
    """
    Executes order cancellation with fee calculation and stock restoration.
    Callable by DRF views and future LangChain AI agents.
    """
    policy = get_cancellation_policy(order_id, user=user)
    if not policy.get('success'):
        return policy
    if not policy.get('can_cancel'):
        return {
            'success': False,
            'message': f'Cannot cancel order #{order_id}: {policy.get("policy_description")}'
        }

    order = Order.objects.get(id=order_id)
    order.status = 'Cancelled'
    order.cancellation_reason = reason or 'Cancelled by user'
    order.cancellation_fee = policy['cancellation_fee']
    order.refund_amount = policy['refund_amount']
    order.cancelled_at = timezone.now()
    order.save()

    # Restock inventory for each order item
    for item in order.items.all():
        if item.product:
            item.product.stock += item.qty
            item.product.save(update_fields=['stock'])

    return {
        'success': True,
        'message': f'Order #{order.id} cancelled successfully.',
        'order_id': str(order.id),
        'status': order.status,
        'cancellation_fee': order.cancellation_fee,
        'refund_amount': order.refund_amount,
        'cancellation_reason': order.cancellation_reason,
        'cancelled_at': order.cancelled_at.isoformat()
    }


def return_order_service(order_id: int | str, reason: str, notes: str = '', user=None) -> dict:
    """
    Registers an order return request for delivered orders.
    Callable by DRF views and future LangChain AI agents.
    """
    policy = get_cancellation_policy(order_id, user=user)
    if not policy.get('success'):
        return policy
    if not policy.get('can_return'):
        return {
            'success': False,
            'message': f'Cannot return order #{order_id}: {policy.get("policy_description")}'
        }

    order = Order.objects.get(id=order_id)
    full_reason = reason.strip()
    if notes.strip():
        full_reason = f'{full_reason} - Note: {notes.strip()}'

    order.status = 'Return Requested'
    order.return_reason = full_reason or 'Customer return request'
    order.return_status = 'Requested'
    order.returned_at = timezone.now()
    order.save()

    return {
        'success': True,
        'message': f'Return request submitted for Order #{order.id}. Reverse pickup will be arranged.',
        'order_id': str(order.id),
        'status': order.status,
        'return_reason': order.return_reason,
        'return_status': order.return_status,
        'returned_at': order.returned_at.isoformat()
    }


def get_product_reviews(product_id: int | str) -> dict:
    """
    Fetches all reviews and statistical breakdown for a product.
    """
    try:
        product = Product.objects.get(id=product_id)
    except (Product.DoesNotExist, ValueError):
        return {'success': False, 'message': 'Product not found', 'reviews': []}

    reviews = product.reviews.all().order_by('-created_at')
    review_list = []
    star_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}

    for r in reviews:
        rating = max(1, min(5, int(r.rating)))
        star_counts[rating] = star_counts.get(rating, 0) + 1
        review_list.append({
            '_id': str(r.id),
            'id': str(r.id),
            'name': r.name,
            'rating': r.rating,
            'comment': r.comment,
            'userId': str(r.user_id),
            'createdAt': r.created_at.isoformat()
        })

    return {
        'success': True,
        'product_id': str(product.id),
        'product_name': product.name,
        'average_rating': round(product.ratings, 1),
        'num_reviews': product.num_reviews,
        'star_counts': star_counts,
        'reviews': review_list
    }


def add_product_review(product_id: int | str, user, rating: int, comment: str) -> dict:
    """
    Adds or updates a review for a product by an authenticated user and recalculates averages.
    """
    try:
        product = Product.objects.get(id=product_id)
    except (Product.DoesNotExist, ValueError):
        return {'success': False, 'message': 'Product not found'}

    try:
        rating_int = int(rating)
        if rating_int < 1 or rating_int > 5:
            return {'success': False, 'message': 'Rating must be an integer between 1 and 5'}
    except (ValueError, TypeError):
        return {'success': False, 'message': 'Valid rating between 1 and 5 is required'}

    if not comment or not comment.strip():
        return {'success': False, 'message': 'Review comment cannot be empty'}

    # Check if user already reviewed this product
    review, created = Review.objects.update_or_create(
        product=product,
        user=user,
        defaults={
            'name': user.name,
            'rating': rating_int,
            'comment': comment.strip()
        }
    )

    # Recalculate aggregates on Product
    stats = product.reviews.aggregate(avg_rating=Avg('rating'), total_count=Count('id'))
    product.ratings = round(stats['avg_rating'] or 0.0, 1)
    product.num_reviews = stats['total_count'] or 0
    product.save(update_fields=['ratings', 'num_reviews'])

    return {
        'success': True,
        'message': 'Review posted successfully' if created else 'Review updated successfully',
        'review': {
            '_id': str(review.id),
            'id': str(review.id),
            'name': review.name,
            'rating': review.rating,
            'comment': review.comment,
            'createdAt': review.created_at.isoformat()
        },
        'new_average_rating': product.ratings,
        'new_num_reviews': product.num_reviews
    }


def search_catalog(query: str = '', category: str = '', min_price: float = None, max_price: float = None, sort: str = '') -> list:
    """
    Full catalog search helper. Designed for LangGraph tools.
    """
    products = Product.objects.all()
    if query:
        products = products.filter(name__icontains=query) | products.filter(description__icontains=query)
    if category and category.lower() != 'all':
        products = products.filter(category__iexact=category)
    if min_price is not None:
        products = products.filter(price__gte=min_price)
    if max_price is not None:
        products = products.filter(price__lte=max_price)

    if sort == 'price_low':
        products = products.order_by('price')
    elif sort == 'price_high':
        products = products.order_by('-price')
    elif sort == 'rating':
        products = products.order_by('-ratings')
    else:
        products = products.order_by('-created_at')

    return [
        {
            '_id': str(p.id),
            'id': str(p.id),
            'name': p.name,
            'category': p.category,
            'price': p.price,
            'stock': p.stock,
            'ratings': p.ratings,
            'numReviews': p.num_reviews,
            'imageUrl': p.image_url
        }
        for p in products
    ]


def get_order_details(order_id: int | str, user=None) -> dict:
    """
    Comprehensive order details getter for LangGraph nodes and view responses.
    """
    try:
        order = Order.objects.get(id=order_id)
    except (Order.DoesNotExist, ValueError):
        return {'success': False, 'message': 'Order not found'}

    if user and getattr(user, 'role', '') != 'admin' and order.user_id != user.id:
        return {'success': False, 'message': 'Unauthorized'}

    items = [
        {
            'productId': item.product_id_str,
            'name': item.name,
            'qty': item.qty,
            'price': item.price,
            'imageUrl': item.image_url
        }
        for item in order.items.all()
    ]

    return {
        'success': True,
        'order': {
            '_id': str(order.id),
            'id': str(order.id),
            'status': order.status,
            'totalAmount': order.total_amount,
            'paymentId': order.payment_id,
            'items': items,
            'cancellationReason': order.cancellation_reason,
            'cancellationFee': order.cancellation_fee,
            'refundAmount': order.refund_amount,
            'cancelledAt': order.cancelled_at.isoformat() if order.cancelled_at else None,
            'returnReason': order.return_reason,
            'returnStatus': order.return_status,
            'returnedAt': order.returned_at.isoformat() if order.returned_at else None,
            'address': {
                'fullName': order.address_full_name,
                'street': order.address_street,
                'city': order.address_city,
                'postalCode': order.address_postal_code,
                'country': order.address_country
            },
            'createdAt': order.created_at.isoformat()
        }
    }
