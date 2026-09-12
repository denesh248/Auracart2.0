"""
AuraCart 2.0 LangGraph Tool-Calling Agent with Structured Output & LLM Guardrails.
Concise, robust agent giving all tools to the LLM and returning structured responses.
"""

import os
import re
import logging
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
from pydantic import BaseModel, Field

from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import create_react_agent

from api.chatbot.llm_guard_setup import scan_user_input, scan_agent_output
from api.chatbot.tools import (
    search_catalog,
    get_my_orders,
    get_order_details,
    check_cancellation_policy,
    propose_cancel_order,
    get_faq_policies,
    propose_add_to_cart,
    propose_remove_from_cart,
    propose_update_cart_quantity,
    view_cart
)
from api.models import Order
from api.services import cancel_order_service

load_dotenv()
logger = logging.getLogger(__name__)

# Structured Output Schema for Aura
class AuraBotResponse(BaseModel):
    reply: str = Field(description="Warm, empathetic, professional customer support reply formatted in markdown with emojis")
    quick_replies: List[str] = Field(default_factory=lambda: ["🛍️ Browse Catalog", "📦 My Orders", "🛒 View Cart"], description="2 to 4 recommended quick reply options for the customer")
    order_card: Optional[Dict[str, Any]] = Field(default=None, description="Details of order (order_id, status, total, thumbnail, can_cancel) if discussing an order")
    product_card: Optional[Dict[str, Any]] = Field(default=None, description="Details of product (productId, name, price, imageUrl, in_stock) if discussing a product")
    action_prompt: Optional[Dict[str, Any]] = Field(default=None, description="Action prompt (type: confirm_cancellation, confirm_add_to_cart) if proposing an action")

AURA_TOOLS = [
    search_catalog,
    get_my_orders,
    get_order_details,
    check_cancellation_policy,
    propose_cancel_order,
    get_faq_policies,
    propose_add_to_cart,
    propose_remove_from_cart,
    propose_update_cart_quantity,
    view_cart
]

AURA_SYSTEM_PROMPT = """You are Aura, an empathetic and professional customer support specialist at AuraCart 2.0.
Help customers discover products, track orders, explain cancellation fees, manage cart items, and answer store policies.
ALWAYS use your tools to query database state. When recommending or proposing actions (cancel order, add to cart), provide the confirmation action prompt."""

FALLBACK_MODELS = ["gemini-3.5-flash", "gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash"]


def get_agent(model_name: str = "gemini-3.5-flash"):
    """Builds a ReAct agent with all tools and structured output."""
    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return None
    llm = ChatGoogleGenerativeAI(model=model_name, google_api_key=api_key, temperature=0.2)
    return create_react_agent(model=llm, tools=AURA_TOOLS, response_format=AuraBotResponse)


def run_agent_with_fallbacks(messages: list) -> dict:
    """Executes the agent across fallback models to guarantee high availability."""
    for model in FALLBACK_MODELS:
        try:
            agent = get_agent(model)
            if not agent:
                continue
            res = agent.invoke({"messages": messages})
            structured = res.get("structured_response")
            if structured:
                return structured.model_dump() if hasattr(structured, "model_dump") else dict(structured)
            # Fallback to last message text if structured_response not populated
            last_text = str(res["messages"][-1].content)
            return {
                "reply": last_text,
                "quick_replies": ["🛍️ Browse Catalog", "📦 My Orders", "🛒 View Cart"],
                "order_card": None,
                "product_card": None,
                "action_prompt": None
            }
        except Exception as e:
            logger.warning(f"Model {model} failed in agent loop: {e}")
            continue

    return {
        "reply": "I'm here to help with your orders and shopping cart! You can browse products, check your orders, or review our cancellation policy.",
        "quick_replies": ["🛍️ Browse Catalog", "📦 My Orders", "🛒 View Cart"],
        "order_card": None,
        "product_card": None,
        "action_prompt": None
    }


def process_chat_message(
    user,
    message_text: str,
    confirm_action: Optional[str] = None,
    order_id_ctx: Optional[str] = None,
    cart_items: Optional[list] = None,
    product_data: Optional[dict] = None
) -> dict:
    """
    Main chat controller:
    1. Validates input via LLM-Guard.
    2. Handles instant button confirmations.
    3. Invokes tool-calling LLM with structured output.
    4. Sanitizes output before returning to client.
    """
    user_id = user.id if user and user.is_authenticated else None
    user_name = user.name if user and user.is_authenticated else "Guest"
    cart_items = cart_items or []
    text = (message_text or "").strip()

    # 1. Input Guardrail: llm-guard scanner
    if text:
        guard_check = scan_user_input(text)
        if not guard_check.get("is_safe", True):
            return {
                "reply": "🛡️ I am Aura, your AuraCart 2.0 customer support assistant. I can only assist with shopping cart items, orders, product catalog, and store policies.",
                "quick_replies": ["🛍️ Browse Catalog", "📦 My Orders", "🛒 View Cart"]
            }

    # 2. Instant Human Confirmations (Button clicks from chat widget)
    if confirm_action == "confirm_cancellation" or any(text.lower().startswith(k) for k in ["confirm cancel", "yes, cancel", "yes cancel"]):
        target_id = order_id_ctx or (re.search(r'#?(\d+)', text).group(1) if re.search(r'#?(\d+)', text) else None)
        if not target_id and user_id:
            target = Order.objects.filter(user_id=user_id, status__in=['Pending', 'Processing', 'Shipped']).order_by('-created_at').first()
            if target:
                target_id = str(target.id)

        if not target_id:
            return {"reply": "Please specify the order ID to cancel.", "quick_replies": ["📦 My Orders"]}

        res = cancel_order_service(order_id=target_id, reason="Customer cancelled via chatbot", user=user if user and user.is_authenticated else None)
        if res.get("success"):
            fee, refund = res.get("cancellation_fee", 0.0), res.get("refund_amount", 0.0)
            return {
                "reply": f"✅ **Order #{target_id} has been cancelled!** (Fee: ₹{fee:.2f}, Refund: ₹{refund:.2f})",
                "order_card": {"order_id": str(target_id), "status": "Cancelled", "total": refund},
                "quick_replies": ["📦 My Orders", "🛍️ Keep Shopping"]
            }
        return {"reply": f"⚠️ Could not cancel Order #{target_id}: {res.get('message')}", "quick_replies": ["📦 My Orders"]}

    if confirm_action == "confirm_add_to_cart":
        p_name = product_data.get('name', 'Item') if product_data else 'Product'
        return {"reply": f"✅ **{p_name}** has been added to your shopping cart!", "product_card": product_data, "quick_replies": ["🛒 View Cart", "💳 Checkout"]}

    if confirm_action == "confirm_remove_from_cart":
        p_name = product_data.get('name', 'Item') if product_data else 'Product'
        return {"reply": f"🗑️ **{p_name}** has been removed from your cart.", "quick_replies": ["🛍️ Browse Catalog", "🛒 View Cart"]}

    if confirm_action == "confirm_update_qty":
        p_name = product_data.get('name', 'Item') if product_data else 'Product'
        new_q = product_data.get('new_qty') or 1 if product_data else 1
        return {"reply": f"✅ Quantity for **{p_name}** updated to **{new_q}**.", "product_card": product_data, "quick_replies": ["🛒 View Cart", "💳 Checkout"]}

    # 3. LLM Agent Execution with Structured Output
    context_info = f"Customer: {user_name}" + (f" (User ID: {user_id})" if user_id else " (Guest)")
    if cart_items:
        context_info += f" | Cart: " + ", ".join([f"{i.get('name')} (x{i.get('qty', 1)})" for i in cart_items])
    if order_id_ctx:
        context_info += f" | Context Order #{order_id_ctx}"

    messages = [
        {"role": "system", "content": f"{AURA_SYSTEM_PROMPT}\n\n{context_info}"},
        {"role": "user", "content": text}
    ]

    result = run_agent_with_fallbacks(messages)

    # 4. Output Guardrail: llm-guard scanner
    out_guard = scan_agent_output(text, result.get("reply", ""))
    result["reply"] = out_guard.get("sanitized_output", result.get("reply", ""))

    # Adjust contextual quick replies if confirmation is proposed
    action_prompt = result.get("action_prompt")
    if action_prompt:
        p_type = action_prompt.get("type")
        if p_type == "confirm_add_to_cart":
            result["quick_replies"] = ["✅ Add to Cart", "✕ Cancel", "🛒 View Cart"]
        elif p_type == "confirm_cancellation":
            oid = action_prompt.get("order_id", "")
            result["quick_replies"] = [f"✅ Confirm Cancel #{oid}", "✕ Keep Order"]

    return result
