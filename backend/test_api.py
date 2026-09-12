import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'auracart_api.settings')
django.setup()

from rest_framework.test import APIClient
from api.models import User, Product, Order

client = APIClient()

print("--- Testing API Endpoints ---")

# 1. Test Products List
res = client.get('/api/products')
print(f"1. GET /api/products: status={res.status_code}, count={len(res.data)}")
assert res.status_code == 200
assert len(res.data) >= 8
first_prod = res.data[0]
print(f"   Sample product: id={first_prod.get('id')}, _id={first_prod.get('_id')}, name={first_prod.get('name')}")
assert '_id' in first_prod
assert 'name' in first_prod

# 2. Test Login Admin
login_res = client.post('/api/auth/login', {'email': 'deneshkumar248@gmail.com', 'password': 'password123'}, format='json')
print(f"2. POST /api/auth/login: status={login_res.status_code}")
assert login_res.status_code == 200
token = login_res.data.get('token')
print(f"   Admin logged in. Token: {token[:20]}... Role: {login_res.data.get('role')}")
assert login_res.data.get('role') == 'admin'

# 3. Test Order Creation with Direct Payment
client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
order_payload = {
    "items": [
        {
            "productId": first_prod.get('_id'),
            "name": first_prod.get('name'),
            "qty": 2,
            "price": first_prod.get('price'),
            "imageUrl": first_prod.get('imageUrl')
        }
    ],
    "totalAmount": first_prod.get('price') * 2,
    "address": {
        "fullName": "Denesh Test",
        "street": "123 Innovation Way",
        "city": "Tech City",
        "postalCode": "600001",
        "country": "India"
    },
    "paymentId": "DIRECT_PAID_TEST123"
}

order_res = client.post('/api/orders', order_payload, format='json')
print(f"3. POST /api/orders: status={order_res.status_code}")
assert order_res.status_code == 201
order_data = order_res.data
print(f"   Order created: id={order_data.get('_id')}, status={order_data.get('status')}, paymentId={order_data.get('paymentId')}")
assert order_data.get('status') == 'Processing'
assert order_data.get('paymentId') == 'DIRECT_PAID_TEST123'
assert len(order_data.get('items')) == 1

# 4. Test My Orders
my_orders_res = client.get('/api/orders/myorders')
print(f"4. GET /api/orders/myorders: status={my_orders_res.status_code}, count={len(my_orders_res.data)}")
assert my_orders_res.status_code == 200
assert len(my_orders_res.data) >= 1

# 5. Test Admin Stats
stats_res = client.get('/api/analytics')
print(f"5. GET /api/analytics: status={stats_res.status_code}, data={stats_res.data}")
assert stats_res.status_code == 200
assert stats_res.data.get('totalOrders') >= 1
assert stats_res.data.get('totalProducts') >= 8

# 6. Test Chatbot Endpoints
chat_help_res = client.get('/api/chat/help')
print(f"6. GET /api/chat/help: status={chat_help_res.status_code}")
assert chat_help_res.status_code == 200
assert 'greeting' in chat_help_res.data

chat_msg_res = client.post('/api/chat/message', {'message': '📦 My Orders'}, format='json')
print(f"7. POST /api/chat/message: status={chat_msg_res.status_code}")
assert chat_msg_res.status_code == 200
assert 'reply' in chat_msg_res.data

print("\n>>> ALL API & CHATBOT TESTS PASSED SUCCESSFULLY! <<<")

