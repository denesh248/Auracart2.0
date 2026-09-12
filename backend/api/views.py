import time
import os
import cloudinary
import cloudinary.uploader
from django.core.files.storage import default_storage
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from .models import User, Product, Order, OrderItem
from .serializers import UserSerializer, ProductSerializer, OrderSerializer
from .authentication import JWTAuthentication, IsAdminRole, generate_token

def upload_image_to_cloudinary(image_file):
    """
    Uploads an image file to Cloudinary using credentials from environment variables.
    Falls back gracefully to local default_storage if Cloudinary is unavailable or fails.
    """
    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
    api_key = os.getenv('CLOUDINARY_API_KEY')
    api_secret = os.getenv('CLOUDINARY_API_SECRET')

    if cloud_name and api_key and api_secret:
        try:
            cloudinary.config(
                cloud_name=cloud_name,
                api_key=api_key,
                api_secret=api_secret,
                secure=True
            )
            if hasattr(image_file, 'seek'):
                image_file.seek(0)
            upload_result = cloudinary.uploader.upload(
                image_file,
                folder="auracart_products",
                resource_type="image"
            )
            secure_url = upload_result.get('secure_url')
            if secure_url:
                return secure_url
        except Exception as err:
            print(f"[Cloudinary] Upload failed: {err}. Falling back to local storage.")

    # Local storage fallback
    if hasattr(image_file, 'seek'):
        image_file.seek(0)
    path = default_storage.save(f"uploads/{image_file.name}", image_file)
    return f"{settings.MEDIA_URL}{path}"


# ================= AUTH CONTROLLERS =================

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    try:
        name = request.data.get('name')
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password or not name:
            return Response({'message': 'Please provide all required fields'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({'message': 'User already exists'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            email=email,
            name=name,
            password=password,
            auth_provider='local',
            role='admin' if email == 'deneshkumar248@gmail.com' else 'user'
        )

        token = generate_token(user.id)
        return Response({
            '_id': user._id,
            'id': user._id,
            'name': user.name,
            'email': user.email,
            'role': user.role,
            'avatar': user.avatar,
            'token': token
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    try:
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({'message': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'message': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)

        if user.check_password(password):
            token = generate_token(user.id)
            return Response({
                '_id': user._id,
                'id': user._id,
                'name': user.name,
                'email': user.email,
                'role': user.role,
                'avatar': user.avatar,
                'token': token
            })
        else:
            return Response({'message': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


from .services import (
    get_cancellation_policy,
    cancel_order_service,
    return_order_service,
    get_product_reviews,
    add_product_review
)


# ================= PRODUCT REVIEWS =================

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def product_reviews(request, pk):
    """
    GET: List reviews and star rating breakdown for a product.
    POST: Authenticated users submit a rating (1-5) and review.
    """
    if request.method == 'GET':
        data = get_product_reviews(pk)
        if not data.get('success'):
            return Response({'message': data.get('message', 'Product not found')}, status=status.HTTP_404_NOT_FOUND)
        return Response(data)

    elif request.method == 'POST':
        # Authenticate user from JWT token
        jwt_auth = JWTAuthentication()
        auth_res = jwt_auth.authenticate(request)
        if not auth_res:
            return Response({'message': 'Please login to submit a review'}, status=status.HTTP_401_UNAUTHORIZED)
        user, _ = auth_res

        rating = request.data.get('rating')
        comment = request.data.get('comment')
        result = add_product_review(pk, user, rating, comment)

        if not result.get('success'):
            return Response({'message': result.get('message')}, status=status.HTTP_400_BAD_REQUEST)
        return Response(result, status=status.HTTP_201_CREATED)


# ================= ORDER ACTIONS (CANCEL / RETURN / POLICY) =================

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def order_policy_quote(request, pk):
    """
    Returns real-time cancellation or return policy quote (fees, refund breakdown, eligibility).
    Designed to serve both the frontend modal and future LangChain / LangGraph chatbot tools.
    """
    quote = get_cancellation_policy(pk, user=request.user)
    if not quote.get('success'):
        return Response({'message': quote.get('message', 'Order not found')}, status=status.HTTP_400_BAD_REQUEST)
    return Response(quote)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def cancel_order(request, pk):
    """
    Executes order cancellation with fee calculation:
    - Before Shipping (Pending / Processing): ₹0 fee, 100% full refund
    - After Shipping (Shipped): Logistics fee deducted, net refund processed
    - Delivered: Not cancellable (must use return endpoint)
    """
    reason = request.data.get('reason', 'Cancelled by customer')
    res = cancel_order_service(pk, reason=reason, user=request.user)
    if not res.get('success'):
        return Response({'message': res.get('message')}, status=status.HTTP_400_BAD_REQUEST)
    return Response(res, status=status.HTTP_200_OK)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def return_order(request, pk):
    """
    Submits return request for delivered orders.
    """
    reason = request.data.get('reason', '')
    notes = request.data.get('notes', '')
    if not reason:
        return Response({'message': 'Return reason is required'}, status=status.HTTP_400_BAD_REQUEST)

    res = return_order_service(pk, reason=reason, notes=notes, user=request.user)
    if not res.get('success'):
        return Response({'message': res.get('message')}, status=status.HTTP_400_BAD_REQUEST)
    return Response(res, status=status.HTTP_200_OK)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated, IsAdminRole])
def get_users(request):
    try:
        users = User.objects.all().order_by('-created_at')
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ================= PRODUCT CONTROLLERS =================

@api_view(['GET', 'POST'])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def product_list_create(request):
    if request.method == 'GET':
        products = Product.objects.all()

        category = request.GET.get('category')
        if category and category.lower() != 'all':
            products = products.filter(category__iexact=category)

        min_price = request.GET.get('min_price')
        if min_price:
            try:
                products = products.filter(price__gte=float(min_price))
            except ValueError:
                pass

        max_price = request.GET.get('max_price')
        if max_price:
            try:
                products = products.filter(price__lte=float(max_price))
            except ValueError:
                pass

        search = request.GET.get('search') or request.GET.get('q')
        if search:
            from django.db.models import Q
            products = products.filter(
                Q(name__icontains=search) | Q(description__icontains=search) | Q(category__icontains=search)
            )

        sort = request.GET.get('sort', 'newest')
        if sort in ('price_asc', 'price-low', 'price'):
            products = products.order_by('price')
        elif sort in ('price_desc', 'price-high', '-price'):
            products = products.order_by('-price')
        elif sort in ('rating', 'rating-high', '-rating'):
            products = products.order_by('-ratings')
        else:
            products = products.order_by('-created_at')

        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        # Admin only
        if not request.user or not request.user.is_authenticated or request.user.role != 'admin':
            return Response({'message': 'Not authorized as an admin'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            data = request.data.copy()
            image_file = request.FILES.get('image')
            if image_file:
                # Save uploaded file to Cloudinary
                data['imageUrl'] = upload_image_to_cloudinary(image_file)
            
            serializer = ProductSerializer(data=data)
            if serializer.is_valid():
                product = serializer.save()
                return Response(ProductSerializer(product).data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PUT', 'DELETE'])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def product_detail_update_delete(request, pk):
    try:
        product = Product.objects.get(id=pk)
    except (Product.DoesNotExist, ValueError):
        return Response({'message': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = ProductSerializer(product)
        return Response(serializer.data)

    # Admin check for PUT and DELETE
    if not request.user or not request.user.is_authenticated or request.user.role != 'admin':
        return Response({'message': 'Not authorized as an admin'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'PUT':
        try:
            data = request.data.copy()
            image_file = request.FILES.get('image')
            if image_file:
                # Save uploaded file to Cloudinary
                data['imageUrl'] = upload_image_to_cloudinary(image_file)

            serializer = ProductSerializer(product, data=data, partial=True)
            if serializer.is_valid():
                updated = serializer.save()
                return Response(ProductSerializer(updated).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method == 'DELETE':
        try:
            product.delete()
            return Response({'message': 'Product removed'})
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_categories(request):
    """
    Returns unique categories list.
    """
    try:
        categories = list(Product.objects.values_list('category', flat=True).distinct())
        return Response(categories)
    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ================= ORDER CONTROLLERS =================

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def order_list_create(request):
    if request.method == 'POST':
        try:
            items_data = request.data.get('items', [])
            total_amount = float(request.data.get('totalAmount', 0))
            address_data = request.data.get('address', {})
            payment_id = request.data.get('paymentId', f"DIRECT_PAY_{int(time.time())}")

            if not items_data or len(items_data) == 0:
                return Response({'message': 'No order items in cart'}, status=status.HTTP_400_BAD_REQUEST)

            # Support both authenticated user and instant guest checkout
            if request.user and request.user.is_authenticated:
                order_user = request.user
            else:
                customer_email = address_data.get('email') or f"customer_{int(time.time())}@auracart.com"
                customer_name = address_data.get('fullName') or 'AuraCart Customer'
                order_user, _ = User.objects.get_or_create(
                    email=customer_email,
                    defaults={'name': customer_name, 'role': 'user'}
                )

            # Direct order processing: set status to Processing
            order = Order.objects.create(
                user=order_user,
                total_amount=total_amount,
                payment_id=payment_id,
                status='Processing',
                address_full_name=address_data.get('fullName', ''),
                address_street=address_data.get('street', ''),
                address_city=address_data.get('city', ''),
                address_postal_code=address_data.get('postalCode', ''),
                address_country=address_data.get('country', '')
            )

            for item in items_data:
                p_id = item.get('productId') or item.get('_id') or item.get('id')
                product_obj = None
                if p_id:
                    try:
                        product_obj = Product.objects.get(id=p_id)
                    except (Product.DoesNotExist, ValueError):
                        pass

                OrderItem.objects.create(
                    order=order,
                    product=product_obj,
                    product_id_str=str(p_id) if p_id else '',
                    name=item.get('name', ''),
                    qty=int(item.get('qty', 1)),
                    price=float(item.get('price', 0.0)),
                    image_url=item.get('imageUrl', '')
                )

            serializer = OrderSerializer(order)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method == 'GET':
        # Admin gets all orders
        if request.user.role != 'admin':
            return Response({'message': 'Not authorized as an admin'}, status=status.HTTP_403_FORBIDDEN)
        
        orders = Order.objects.all().order_by('-created_at')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def my_orders(request):
    try:
        orders = Order.objects.filter(user=request.user).order_by('-created_at')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def order_detail(request, pk):
    try:
        order = Order.objects.get(id=pk)
    except (Order.DoesNotExist, ValueError):
        return Response({'message': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.user.role != 'admin' and order.user_id != request.user.id:
        return Response({'message': 'Unauthorized to view this order'}, status=status.HTTP_403_FORBIDDEN)

    serializer = OrderSerializer(order)
    return Response(serializer.data)


@api_view(['PUT'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated, IsAdminRole])
def update_order_status(request, pk):
    try:
        order = Order.objects.get(id=pk)
    except (Order.DoesNotExist, ValueError):
        return Response({'message': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    try:
        new_status = request.data.get('status')
        if new_status:
            order.status = new_status
            order.save()
        serializer = OrderSerializer(order)
        return Response(serializer.data)
    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ================= ANALYTICS CONTROLLER =================

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated, IsAdminRole])
def admin_stats(request):
    try:
        total_orders = Order.objects.count()
        total_products = Product.objects.count()
        total_users = User.objects.filter(role='user').count()
        
        amounts = Order.objects.values_list('total_amount', flat=True)
        total_revenue = sum(amounts) if amounts else 0.0

        return Response({
            'totalOrders': total_orders,
            'totalProducts': total_products,
            'totalUsers': total_users,
            'totalRevenue': total_revenue
        })
    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
