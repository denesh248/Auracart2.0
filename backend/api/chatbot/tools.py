"""
AuraCart 2.0 Customer Support Tools
Defined as LangChain Tools to be bound directly to Gemini 3.8 Flash in LangGraph.
"""

import json
import re
from typing import Optional, List
from langchain_core.tools import tool
from api.models import Order, User, Product
from django.db.models import Q
from api.services import get_cancellation_policy as svc_get_cancellation_policy, cancel_order_service


@tool
def search_catalog(query: str, limit: int = 4) -> str:
    """
    Search the AuraCart 2.0 product catalog by product name, category, or description keywords.
    Use this tool whenever the customer is looking for products, asking about stock, or browsing items.
    """
    try:
        clean_q = str(query).strip()
        if not clean_q:
            products = Product.objects.all().order_by('-created_at')[:limit]
        else:
            products = Product.objects.filter(
                Q(name__icontains=clean_q) | Q(category__icontains=clean_q) | Q(description__icontains=clean_q)
            ).order_by('-ratings', '-created_at')[:limit]

            if not products.exists():
                stop_words = {'the', 'and', 'with', 'for', 'want', 'buy', 'need', 'cart', 'add', 'please', 'can', 'item', 'product', 'to'}
                words = [w for w in clean_q.split() if len(w) > 2 and w.lower() not in stop_words]
                if words:
                    sub_q = Q()
                    for w in words:
                        sub_q |= Q(name__icontains=w) | Q(category__icontains=w)
                    products = Product.objects.filter(sub_q).order_by('-ratings')[:limit]

        if not products.exists():
            return json.dumps({"status": "not_found", "message": f"No products found matching '{query}'.", "products": []})

        items = []
        for p in products:
            items.append({
                "productId": str(p.id),
                "_id": str(p.id),
                "id": str(p.id),
                "name": p.name,
                "price": round(float(p.price), 2),
                "category": p.category,
                "stock": p.stock,
                "in_stock": p.stock > 0,
                "imageUrl": p.image_url,
                "ratings": p.ratings,
                "description": p.description[:100] + ("..." if len(p.description) > 100 else "")
            })

        return json.dumps({"status": "success", "products": items})
    except Exception as e:
        return json.dumps({"status": "error", "message": str(e), "products": []})


@tool
def get_my_orders(user_id: Optional[int] = None) -> str:
    """
    Fetch the list of recent active and past orders for the customer.
    Use this tool when the customer asks 'Where are my orders?', 'My orders', 'Order history', or 'Track my packages'.
    """
    if not user_id:
        return json.dumps({
            "status": "unauthenticated",
            "message": "The customer is not logged in. Please politely ask them to sign in to view and track their orders."
        })

    try:
        orders = Order.objects.filter(user_id=user_id).order_by('-created_at')[:6]
        if not orders.exists():
            return json.dumps({
                "status": "empty",
                "message": "You do not have any orders placed yet.",
                "orders": []
            })

        result = []
        for o in orders:
            items_summary = [f"{i.name} (x{i.qty})" for i in o.items.all()]
            first_item_img = o.items.first().image_url if o.items.exists() else ""
            result.append({
                "order_id": str(o.id),
                "date": o.created_at.strftime("%b %d, %Y"),
                "status": o.status,
                "total_amount": round(o.total_amount, 2),
                "items_count": o.items.count(),
                "items_summary": items_summary,
                "thumbnail": first_item_img,
                "can_cancel": o.status in ['Pending', 'Processing', 'Shipped'],
                "can_return": o.status == 'Delivered',
                "cancellation_fee": o.cancellation_fee,
                "refund_amount": o.refund_amount
            })
        return json.dumps({"status": "success", "orders": result})
    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)})


@tool
def get_order_details(order_id: str, user_id: Optional[int] = None) -> str:
    """
    Retrieve itemized details, shipping address, status, and refund eligibility for a specific order number.
    Use this tool when the customer provides a specific order ID or asks 'Status of order 8', 'Details for #4', etc.
    """
    try:
        clean_id = str(order_id).strip().replace('#', '')
        qs = Order.objects.filter(id=clean_id)
        if user_id:
            qs = qs.filter(user_id=user_id)

        order = qs.first()
        if not order:
            return json.dumps({"status": "not_found", "message": f"Order #{clean_id} could not be found under your account."})

        items = []
        for it in order.items.all():
            items.append({
                "name": it.name,
                "qty": it.qty,
                "price": round(float(it.price), 2),
                "image_url": it.image_url
            })

        return json.dumps({
            "status": "success",
            "order": {
                "order_id": str(order.id),
                "created_at": order.created_at.strftime("%b %d, %Y, %I:%M %p"),
                "order_status": order.status,
                "total_amount": round(order.total_amount, 2),
                "items": items,
                "address": {
                    "full_name": order.address_full_name,
                    "city": order.address_city,
                    "country": order.address_country
                },
                "can_cancel": order.status in ['Pending', 'Processing', 'Shipped'],
                "can_return": order.status == 'Delivered',
                "cancellation_fee": order.cancellation_fee,
                "refund_amount": order.refund_amount,
                "thumbnail": items[0]["image_url"] if items else ""
            }
        })
    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)})


@tool
def check_cancellation_policy(order_id: str, user_id: Optional[int] = None) -> str:
    """
    Check the cancellation eligibility, cancellation fee, and estimated refund amount for a specific order.
    Use this tool when a customer asks if they can cancel an order and how much refund they will receive.
    """
    try:
        clean_id = str(order_id).strip().replace('#', '')
        user = User.objects.filter(id=user_id).first() if user_id else None
        policy = svc_get_cancellation_policy(clean_id, user=user)
        return json.dumps(policy)
    except Exception as e:
        return json.dumps({"success": False, "message": str(e)})


@tool
def propose_cancel_order(order_id: str, reason: str = "", user_id: Optional[int] = None) -> str:
    """
    Evaluate cancellation for an order and prepare the confirmation prompt with fee and refund calculation.
    Use this tool when the customer expresses intent to cancel an order (e.g., 'Cancel order #8').
    """
    try:
        clean_id = str(order_id).strip().replace('#', '')
        user = User.objects.filter(id=user_id).first() if user_id else None
        policy = svc_get_cancellation_policy(clean_id, user=user)

        if not policy.get("success"):
            return json.dumps({
                "status": "error",
                "message": f"Could not find Order #{clean_id}. Please check your order ID or select from 'My Orders'."
            })

        can_cancel = policy.get("can_cancel", False)
        status = policy.get("status")
        total = policy.get("total_amount", 0.0)
        fee = policy.get("cancellation_fee", 0.0)
        refund = policy.get("refund_amount", total)

        if not can_cancel:
            return json.dumps({
                "status": "cannot_cancel",
                "message": f"Order #{clean_id} is currently '{status}' and cannot be cancelled. {policy.get('policy_description', '')}",
                "order_id": clean_id,
                "status": status
            })

        return json.dumps({
            "status": "confirmation_required",
            "action": "confirm_cancellation",
            "order_id": clean_id,
            "current_status": status,
            "total_amount": total,
            "cancellation_fee": fee,
            "refund_amount": refund,
            "action_prompt": {
                "type": "confirm_cancellation",
                "order_id": str(clean_id),
                "fee": fee,
                "refund": refund
            },
            "order_card": {
                "order_id": str(clean_id),
                "status": status,
                "total": total,
                "cancellation_fee": fee,
                "refund_amount": refund,
                "can_cancel": True
            }
        })
    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)})


@tool
def get_faq_policies(topic: str = "all") -> str:
    """
    Retrieve official AuraCart 2.0 cancellation policy, fee schedule, and return guidelines.
    Use this tool when a customer asks general policy questions like 'What is the cancellation fee?', 'Can I return an item?'.
    """
    policies = {
        "cancellation": {
            "title": "Order Cancellation Policy & Fees",
            "pre_dispatch": "Orders in 'Pending' or 'Processing' status can be cancelled with a 100% full refund and ₹0.00 cancellation fee.",
            "in_transit": "Orders in 'Shipped' status incur a standard ₹50.00 logistics recovery fee to cover shipping costs. The remainder is refunded automatically.",
            "post_delivery": "Orders in 'Delivered' status cannot be cancelled, but you can request a return within 7 calendar days."
        },
        "returns": {
            "title": "Return Policy & Window",
            "window": "7-day return window from delivery date for unused items with original tags.",
            "refund_timeline": "Refunds are processed within 3-5 business days back to your original payment method."
        }
    }
    return json.dumps(policies)


@tool
def propose_add_to_cart(product_name_or_query: str, quantity: int = 1) -> str:
    """
    Search for a product in the catalog and prepare the human confirmation prompt to add it to the cart.
    Use this tool when the customer says 'Add wireless headphones to cart', 'I want to buy headphones', etc.
    """
    try:
        clean = str(product_name_or_query).strip()
        stop_p = ['add to cart', 'add to my cart', 'add', 'buy', 'purchase', 'please', 'to cart', 'in cart']
        for s in stop_p:
            clean = clean.replace(s, ' ')
        clean = clean.strip() or product_name_or_query.strip()

        prods_raw = search_catalog.invoke({"query": clean, "limit": 3})
        prods_data = json.loads(prods_raw)

        if prods_data.get("status") != "success" or not prods_data.get("products"):
            return json.dumps({
                "status": "not_found",
                "message": f"Could not find '{product_name_or_query}' in our catalog."
            })

        top = prods_data["products"][0]
        if not top.get("in_stock"):
            return json.dumps({
                "status": "out_of_stock",
                "message": f"'{top['name']}' is currently out of stock.",
                "product": top
            })

        qty = max(1, int(quantity))
        return json.dumps({
            "status": "confirmation_required",
            "action": "confirm_add_to_cart",
            "product": top,
            "qty": qty,
            "action_prompt": {
                "type": "confirm_add_to_cart",
                "product": top,
                "qty": qty
            },
            "product_card": top
        })
    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)})


@tool
def propose_remove_from_cart(product_name: str) -> str:
    """
    Find an item in the user's shopping cart and prepare the human confirmation prompt to remove it.
    Use this tool when the customer says 'Remove headphones from cart', 'Delete item from cart', etc.
    """
    return json.dumps({
        "status": "needs_cart_item_context",
        "product_name": product_name
    })


@tool
def propose_update_cart_quantity(product_name: str, new_quantity: int) -> str:
    """
    Find an item in the user's shopping cart and prepare the human confirmation prompt to update its quantity.
    Use this tool when the customer says 'Change headphones quantity to 3', 'Update qty to 2', etc.
    """
    return json.dumps({
        "status": "needs_cart_item_context",
        "product_name": product_name,
        "new_quantity": new_quantity
    })


@tool
def view_cart() -> str:
    """
    View the customer's current shopping cart items, quantities, and subtotal.
    Use this tool when the customer asks 'View cart', 'What's in my cart?', 'Show my bag', or 'Cart total'.
    """
    return json.dumps({
        "status": "read_from_cart_state"
    })
