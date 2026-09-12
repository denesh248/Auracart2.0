from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from api.authentication import JWTAuthentication
from api.chatbot.graph import process_chat_message

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([AllowAny])
def chat_message(request):
    """
    Primary conversational endpoint for AuraCart 2.0 Customer Support Assistant.
    Powered by LangGraph, LangChain, and Gemini 3.6 Flash.
    """
    message_text = request.data.get('message', '').strip()
    confirm_action = request.data.get('confirm_action')
    order_id = request.data.get('order_id')
    cart_items = request.data.get('cart_items', [])
    product_data = request.data.get('product')

    if not message_text and not confirm_action:
        return Response({'message': 'Please provide a message or confirm_action.'}, status=status.HTTP_400_BAD_REQUEST)

    user = request.user if getattr(request, 'user', None) and getattr(request.user, 'is_authenticated', False) else None

    try:
        result = process_chat_message(
            user=user,
            message_text=message_text,
            confirm_action=confirm_action,
            order_id_ctx=order_id,
            cart_items=cart_items,
            product_data=product_data
        )
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'reply': f"I apologize, I encountered an unexpected error: {str(e)}. Please try asking again.",
            'quick_replies': ["📦 My Orders", "💰 Cancellation Fees"]
        }, status=status.HTTP_200_OK)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([AllowAny])
def chat_quick_help(request):
    """
    Provides initial greeting and suggested starter prompts for the human-designed chat widget.
    """
    is_auth = getattr(request, 'user', None) and getattr(request.user, 'is_authenticated', False)
    user_name = request.user.name if is_auth else None
    greeting = f"Hello {user_name}! 👋" if user_name else "Hello! 👋"
    
    return Response({
        'greeting': f"{greeting} I'm Aura, your AuraCart 2.0 customer support assistant. How can I help you today?",
        'quick_replies': [
            "🛍️ Browse Products",
            "📦 Where is my order?",
            "❌ Cancel an order",
            "💰 Cancellation fees & policy",
            "🔄 How do returns work?"
        ]
    })
