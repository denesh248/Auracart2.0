from rest_framework import serializers
from .models import User, Product, Order, OrderItem, Review

class UserSerializer(serializers.ModelSerializer):
    _id = serializers.CharField(read_only=True)
    id = serializers.CharField(source='_id', read_only=True)

    class Meta:
        model = User
        fields = ['_id', 'id', 'name', 'email', 'role', 'avatar', 'auth_provider', 'created_at']


class ProductSerializer(serializers.ModelSerializer):
    _id = serializers.CharField(read_only=True)
    id = serializers.CharField(source='_id', read_only=True)
    imageUrl = serializers.CharField(source='image_url', required=False, allow_blank=True)
    numReviews = serializers.IntegerField(source='num_reviews', read_only=True)

    class Meta:
        model = Product
        fields = [
            '_id', 'id', 'name', 'description', 'price', 
            'category', 'stock', 'imageUrl', 'image_url', 
            'ratings', 'numReviews', 'created_at'
        ]
        extra_kwargs = {
            'image_url': {'write_only': True, 'required': False}
        }

    def create(self, validated_data):
        # Handle imageUrl alias if provided
        if 'image_url' not in validated_data and 'imageUrl' in validated_data:
            validated_data['image_url'] = validated_data.pop('imageUrl')
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'imageUrl' in validated_data:
            validated_data['image_url'] = validated_data.pop('imageUrl')
        return super().update(instance, validated_data)


class OrderItemSerializer(serializers.ModelSerializer):
    productId = serializers.CharField(source='product_id_str')
    imageUrl = serializers.CharField(source='image_url')

    class Meta:
        model = OrderItem
        fields = ['productId', 'name', 'qty', 'price', 'imageUrl']


class OrderSerializer(serializers.ModelSerializer):
    _id = serializers.CharField(read_only=True)
    id = serializers.CharField(source='_id', read_only=True)
    userId = serializers.SerializerMethodField()
    items = OrderItemSerializer(many=True, read_only=True)
    totalAmount = serializers.FloatField(source='total_amount')
    address = serializers.SerializerMethodField()
    paymentId = serializers.CharField(source='payment_id')
    cancellationReason = serializers.CharField(source='cancellation_reason', read_only=True)
    cancellationFee = serializers.FloatField(source='cancellation_fee', read_only=True)
    refundAmount = serializers.FloatField(source='refund_amount', read_only=True)
    cancelledAt = serializers.DateTimeField(source='cancelled_at', read_only=True)
    returnReason = serializers.CharField(source='return_reason', read_only=True)
    returnStatus = serializers.CharField(source='return_status', read_only=True)
    returnedAt = serializers.DateTimeField(source='returned_at', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Order
        fields = [
            '_id', 'id', 'userId', 'items', 'totalAmount', 
            'address', 'paymentId', 'status', 
            'cancellationReason', 'cancellationFee', 'refundAmount', 'cancelledAt',
            'returnReason', 'returnStatus', 'returnedAt',
            'createdAt'
        ]

    def get_userId(self, obj):
        if obj.user:
            return {
                '_id': str(obj.user.id),
                'id': str(obj.user.id),
                'name': obj.user.name,
                'email': obj.user.email
            }
        return None

    def get_address(self, obj):
        return {
            'fullName': obj.address_full_name,
            'street': obj.address_street,
            'city': obj.address_city,
            'postalCode': obj.address_postal_code,
            'country': obj.address_country
        }


class ReviewSerializer(serializers.ModelSerializer):
    _id = serializers.CharField(read_only=True)
    id = serializers.CharField(source='_id', read_only=True)
    productId = serializers.CharField(source='product_id', read_only=True)
    userId = serializers.CharField(source='user_id', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Review
        fields = ['_id', 'id', 'productId', 'userId', 'name', 'rating', 'comment', 'createdAt']
