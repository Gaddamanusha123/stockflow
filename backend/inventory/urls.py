from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    signup_view,
    login_view,
    logout_view,
    me_view,
    dashboard_view,
    settings_view,
    ProductViewSet
)

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')

urlpatterns = [
    # Auth endpoints
    path('auth/signup/', signup_view, name='auth-signup'),
    path('auth/login/', login_view, name='auth-login'),
    path('auth/logout/', logout_view, name='auth-logout'),
    path('auth/me/', me_view, name='auth-me'),

    # Dashboard endpoint
    path('dashboard/', dashboard_view, name='dashboard-summary'),

    # Settings endpoints
    path('settings/', settings_view, name='organization-settings'),

    # Products router endpoints
    path('', include(router.urls)),
]

