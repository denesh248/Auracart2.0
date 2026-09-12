import jwt
import datetime
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import BasePermission
from .models import User

def generate_token(user_id):
    payload = {
        'id': str(user_id),
        'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=30),
        'iat': datetime.datetime.now(datetime.timezone.utc)
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm='HS256')


class JWTAuthentication(BaseAuthentication):
    """
    Standard JWT Bearer Authentication for AuraCart.
    """
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None
        
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return None
            
        token = parts[1]
        
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=['HS256'])
            user_id = payload.get('id')
            if not user_id:
                raise AuthenticationFailed('Invalid token payload')
            try:
                user = User.objects.get(id=user_id)
                return (user, token)
            except (User.DoesNotExist, ValueError):
                raise AuthenticationFailed('User does not exist')
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid token')


class IsAdminRole(BasePermission):
    """
    Allows access only to authenticated users with role == 'admin'.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'admin'
        )
