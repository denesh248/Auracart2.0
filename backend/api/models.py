import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager

class UserManager(BaseUserManager):
    def create_user(self, email, name, password=None, role='user', **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, name=name, role=role, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        return self.create_user(email, name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('user', 'User'),
        ('admin', 'Admin'),
    )
    AUTH_PROVIDER_CHOICES = (
        ('local', 'Local'),
        ('google', 'Google'),
    )

    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    avatar = models.CharField(max_length=500, blank=True, default='')
    google_id = models.CharField(max_length=255, blank=True, null=True)
    auth_provider = models.CharField(max_length=20, choices=AUTH_PROVIDER_CHOICES, default='local')
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    @property
    def _id(self):
        return str(self.id)

    def __str__(self):
        return f"{self.name} ({self.email})"


class Product(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    price = models.FloatField()
    category = models.CharField(max_length=100)
    stock = models.IntegerField(default=0)
    image_url = models.CharField(max_length=500)
    ratings = models.FloatField(default=0.0)
    num_reviews = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def _id(self):
        return str(self.id)

    def __str__(self):
        return self.name


class Order(models.Model):
    STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Processing', 'Processing'),
        ('Shipped', 'Shipped'),
        ('Delivered', 'Delivered'),
        ('Cancelled', 'Cancelled'),
        ('Return Requested', 'Return Requested'),
        ('Returned', 'Returned'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    total_amount = models.FloatField(default=0.0)
    payment_id = models.CharField(max_length=255, blank=True, default='')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pending')
    
    # Cancellation tracking
    cancellation_reason = models.TextField(blank=True, default='')
    cancellation_fee = models.FloatField(default=0.0)
    refund_amount = models.FloatField(default=0.0)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    # Return tracking
    return_reason = models.TextField(blank=True, default='')
    return_status = models.CharField(max_length=50, blank=True, default='')
    returned_at = models.DateTimeField(null=True, blank=True)

    # Address details
    address_full_name = models.CharField(max_length=255, blank=True, default='')
    address_street = models.CharField(max_length=255, blank=True, default='')
    address_city = models.CharField(max_length=100, blank=True, default='')
    address_postal_code = models.CharField(max_length=50, blank=True, default='')
    address_country = models.CharField(max_length=100, blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def _id(self):
        return str(self.id)

    def __str__(self):
        return f"Order #{self.id} by {self.user.email}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    product_id_str = models.CharField(max_length=100, blank=True, default='')
    name = models.CharField(max_length=255, blank=True, default='')
    qty = models.IntegerField(default=1)
    price = models.FloatField(default=0.0)
    image_url = models.CharField(max_length=500, blank=True, default='')

    def __str__(self):
        return f"{self.name} x {self.qty}"


class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    rating = models.IntegerField(default=5)
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def _id(self):
        return str(self.id)

    def __str__(self):
        return f"Review by {self.name} on {self.product.name}"
