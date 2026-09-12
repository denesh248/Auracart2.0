from django.core.management.base import BaseCommand
from api.models import User, Product

class Command(BaseCommand):
    help = 'Seed database with initial admin and AuraCart sample products'

    def handle(self, *args, **options):
        self.stdout.write("Starting database seeding...")

        # Create or update admin user
        admin_email = 'deneshkumar248@gmail.com'
        admin_user, created = User.objects.get_or_create(
            email=admin_email,
            defaults={
                'name': 'Denesh Kumar',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin_user.set_password('password123')
        admin_user.role = 'admin'
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.save()

        if created:
            self.stdout.write(self.style.SUCCESS(f"Created admin user: {admin_email}"))
        else:
            self.stdout.write(self.style.SUCCESS(f"Updated admin user: {admin_email}"))

        # Seed sample products
        products_data = [
            {
                'name': 'Wireless Noise-Cancelling Headphones',
                'description': 'High-fidelity audio with ergonomic earcups and 30-hour playback battery life.',
                'price': 199.99,
                'category': 'Electronics',
                'stock': 25,
                'image_url': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop',
                'ratings': 4.8,
                'num_reviews': 34
            },
            {
                'name': 'Ergonomic Desk Chair',
                'description': 'Breathable mesh back support chair built for long work and study hours.',
                'price': 149.50,
                'category': 'Furniture',
                'stock': 18,
                'image_url': 'https://images.unsplash.com/photo-1580481072645-022f9a6d1296?q=80&w=800&auto=format&fit=crop',
                'ratings': 4.6,
                'num_reviews': 22
            },
            {
                'name': 'Compact Digital Camera',
                'description': 'High-resolution sensor camera perfect for daily photography and travel recording.',
                'price': 499.00,
                'category': 'Electronics',
                'stock': 12,
                'image_url': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop',
                'ratings': 4.9,
                'num_reviews': 45
            },
            {
                'name': 'Classic Casual White Sneakers',
                'description': 'Durable, lightweight daily footwear with cushioned anti-slip soles.',
                'price': 65.00,
                'category': 'Footwear',
                'stock': 40,
                'image_url': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop',
                'ratings': 4.5,
                'num_reviews': 78
            },
            {
                'name': 'Minimalist Leather Backpack',
                'description': 'Water-resistant genuine leather laptop bag with dedicated tablet and accessory compartments.',
                'price': 89.99,
                'category': 'Accessories',
                'stock': 30,
                'image_url': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800&auto=format&fit=crop',
                'ratings': 4.7,
                'num_reviews': 29
            },
            {
                'name': 'Smart Fitness Tracker Watch',
                'description': 'Track daily heart rate, steps, sleep metrics, and smartphone notifications seamlessly.',
                'price': 119.00,
                'category': 'Electronics',
                'stock': 35,
                'image_url': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop',
                'ratings': 4.4,
                'num_reviews': 53
            },
            {
                'name': 'Stainless Steel Insulated Travel Mug',
                'description': 'Double-wall vacuum insulation keeps beverages hot for 8 hours or ice cold for 12 hours.',
                'price': 24.99,
                'category': 'Home & Kitchen',
                'stock': 60,
                'image_url': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop',
                'ratings': 4.8,
                'num_reviews': 92
            },
            {
                'name': 'Mechanical RGB Keyboard',
                'description': 'Tactile mechanical switches with customizable backlighting and durable aluminum frame.',
                'price': 79.99,
                'category': 'Electronics',
                'stock': 22,
                'image_url': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=800&auto=format&fit=crop',
                'ratings': 4.7,
                'num_reviews': 41
            }
        ]

        count = 0
        for p in products_data:
            prod, created_prod = Product.objects.update_or_create(
                name=p['name'],
                defaults=p
            )
            count += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {count} AuraCart products!"))
