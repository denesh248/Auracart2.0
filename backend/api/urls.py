from django.urls import re_path
from . import views
from api.chatbot import views as chatbot_views

urlpatterns = [
    # Auth (Pure Email & Password)
    re_path(r'^auth/register/?$', views.register_user, name='register'),
    re_path(r'^auth/login/?$', views.login_user, name='login'),
    re_path(r'^auth/users/?$', views.get_users, name='get_users'),

    # Products & Reviews
    re_path(r'^products/?$', views.product_list_create, name='product_list_create'),
    re_path(r'^products/categories/?$', views.get_categories, name='product_categories'),
    re_path(r'^products/(?P<pk>[^/]+)/reviews/?$', views.product_reviews, name='product_reviews'),
    re_path(r'^products/(?P<pk>[^/]+)/?$', views.product_detail_update_delete, name='product_detail'),

    # Orders, Cancellation & Returns
    re_path(r'^orders/?$', views.order_list_create, name='order_list_create'),
    re_path(r'^orders/myorders/?$', views.my_orders, name='my_orders'),
    re_path(r'^orders/(?P<pk>[^/]+)/status/?$', views.update_order_status, name='update_order_status'),
    re_path(r'^orders/(?P<pk>[^/]+)/policy/?$', views.order_policy_quote, name='order_policy_quote'),
    re_path(r'^orders/(?P<pk>[^/]+)/cancel/?$', views.cancel_order, name='cancel_order'),
    re_path(r'^orders/(?P<pk>[^/]+)/return/?$', views.return_order, name='return_order'),
    re_path(r'^orders/(?P<pk>[^/]+)/?$', views.order_detail, name='order_detail'),

    # Analytics
    re_path(r'^analytics/?$', views.admin_stats, name='admin_stats'),

    # LangGraph & LangChain Chatbot
    re_path(r'^chat/message/?$', chatbot_views.chat_message, name='chat_message'),
    re_path(r'^chat/help/?$', chatbot_views.chat_quick_help, name='chat_quick_help'),
]
