from django.db.models import Sum, Count, Q, F, Value, IntegerField, When, Case
from django.db.models.functions import Coalesce
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken, TokenError

from .models import Product, Organization, User
from .serializers import (
    SignupSerializer,
    LoginSerializer,
    UserProfileSerializer,
    ProductSerializer,
    StockAdjustmentSerializer,
    SettingsSerializer,
    OrganizationSerializer
)
from .permissions import HasOrganizationPermission


# ==========================================
# AUTHENTICATION VIEWS
# ==========================================

@api_view(['POST'])
@permission_classes([AllowAny])
def signup_view(request):
    """
    Registers a new user and automatically creates their tenant organization.
    Returns the user data and authentication JWT tokens.
    """
    serializer = SignupSerializer(data=request.data)
    if serializer.is_valid():
        data = serializer.save()
        user = data['user']
        org = data['organization']
        tokens = data['tokens']
        return Response({
            'message': 'Registration successful.',
            'user': {
                'id': user.id,
                'email': user.email,
                'organization': {
                    'id': org.id,
                    'name': org.name,
                    'default_low_stock_threshold': org.default_low_stock_threshold
                }
            },
            'tokens': tokens
        }, status=status.HTTP_201_CREATED)
    return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Authenticates user with email and password.
    Returns user details, organization data, and JWT tokens.
    """
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        data = serializer.validated_data
        user = data['user']
        org = data['organization']
        tokens = data['tokens']
        return Response({
            'message': 'Login successful.',
            'user': {
                'id': user.id,
                'email': user.email,
                'organization': {
                    'id': org.id,
                    'name': org.name,
                    'default_low_stock_threshold': org.default_low_stock_threshold
                }
            },
            'tokens': tokens
        }, status=status.HTTP_200_OK)
    return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Invalidates the provided refresh token and cleans up user session.
    """
    refresh_token = request.data.get('refresh')
    if refresh_token:
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except (AttributeError, TokenError):
            # Blacklist may be optional if blacklist app is not enabled
            pass
    return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, HasOrganizationPermission])
def me_view(request):
    """
    Returns current authenticated user and organization information.
    """
    serializer = UserProfileSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)


# ==========================================
# PRODUCT MANAGEMENT VIEWS
# ==========================================

class ProductViewSet(viewsets.ModelViewSet):
    """
    Full CRUD ViewSet for Organization Products.
    Strictly isolated by authenticated user's organization.
    """
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, HasOrganizationPermission]

    def get_queryset(self):
        user = self.request.user
        queryset = Product.objects.filter(organization=user.organization)

        # Search support by product name or SKU
        search_query = self.request.query_params.get('search', '').strip()
        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query) | Q(sku__icontains=search_query)
            )

        # Optional filter by stock status
        stock_filter = self.request.query_params.get('status', '').strip().upper()
        default_threshold = user.organization.default_low_stock_threshold

        if stock_filter == 'OUT_OF_STOCK':
            queryset = queryset.filter(quantity_on_hand=0)
        elif stock_filter == 'LOW_STOCK':
            # Quantity > 0 and Quantity <= effective threshold
            queryset = queryset.filter(
                Q(quantity_on_hand__gt=0) & (
                    Q(low_stock_threshold__isnull=False, quantity_on_hand__lte=F('low_stock_threshold')) |
                    Q(low_stock_threshold__isnull=True, quantity_on_hand__lte=default_threshold)
                )
            )
        elif stock_filter == 'IN_STOCK':
            queryset = queryset.filter(
                (Q(low_stock_threshold__isnull=False, quantity_on_hand__gt=F('low_stock_threshold'))) |
                (Q(low_stock_threshold__isnull=True, quantity_on_hand__gt=default_threshold))
            )

        return queryset.order_by('-created_at')

    @action(detail=True, methods=['post'], url_path='adjust-stock')
    def adjust_stock(self, request, pk=None):
        """
        Dynamically adjusts or sets the product quantity on hand.
        Prevents negative stock.
        """
        product = self.get_object()
        serializer = StockAdjustmentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        current_qty = product.quantity_on_hand

        if 'new_quantity' in data:
            target_qty = data['new_quantity']
        elif 'adjustment' in data:
            target_qty = current_qty + data['adjustment']
        else:
            return Response({'errors': 'Invalid adjustment data.'}, status=status.HTTP_400_BAD_REQUEST)

        if target_qty < 0:
            return Response(
                {
                    'errors': {
                        'quantity_on_hand': f"Adjustment would result in negative stock ({target_qty}). Current quantity is {current_qty}."
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        product.quantity_on_hand = target_qty
        product.last_updated_by = request.user
        product.save(update_fields=['quantity_on_hand', 'last_updated_by', 'updated_at'])

        response_serializer = ProductSerializer(product, context={'request': request})
        return Response(
            {
                'message': 'Stock quantity updated successfully.',
                'product': response_serializer.data,
                'previous_quantity': current_qty,
                'current_quantity': target_qty,
            },
            status=status.HTTP_200_OK
        )


# ==========================================
# DASHBOARD VIEWS
# ==========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated, HasOrganizationPermission])
def dashboard_view(request):
    """
    Returns calculated statistics and low-stock products for the current organization.
    All calculations are performed dynamically against database records.
    """
    org = request.user.organization
    products = Product.objects.filter(organization=org)
    default_threshold = org.default_low_stock_threshold

    total_products = products.count()
    total_stock_aggregate = products.aggregate(total=Sum('quantity_on_hand'))['total']
    total_stock = total_stock_aggregate if total_stock_aggregate is not None else 0

    # Calculate low stock and out of stock dynamically
    out_of_stock_products = products.filter(quantity_on_hand=0)
    out_of_stock_count = out_of_stock_products.count()

    # Low stock: quantity_on_hand <= effective threshold, and > 0
    low_stock_products = products.filter(
        Q(quantity_on_hand__gt=0) & (
            Q(low_stock_threshold__isnull=False, quantity_on_hand__lte=F('low_stock_threshold')) |
            Q(low_stock_threshold__isnull=True, quantity_on_hand__lte=default_threshold)
        )
    )
    low_stock_count = low_stock_products.count()

    # Attention items (both Out of Stock and Low Stock) for dashboard table
    attention_products = products.filter(
        Q(quantity_on_hand=0) |
        (Q(low_stock_threshold__isnull=False, quantity_on_hand__lte=F('low_stock_threshold')) |
         Q(low_stock_threshold__isnull=True, quantity_on_hand__lte=default_threshold))
    ).order_by('quantity_on_hand', 'name')[:15]

    attention_list = []
    for item in attention_products:
        attention_list.append({
            'id': item.id,
            'name': item.name,
            'sku': item.sku,
            'quantity_on_hand': item.quantity_on_hand,
            'effective_threshold': item.effective_low_stock_threshold,
            'stock_status': item.stock_status,
            'cost_price': str(item.cost_price),
            'selling_price': str(item.selling_price),
        })

    # Recent products
    recent_products = products.order_by('-created_at')[:5]
    recent_list = ProductSerializer(recent_products, many=True, context={'request': request}).data

    return Response({
        'organization': {
            'id': org.id,
            'name': org.name,
            'default_low_stock_threshold': default_threshold,
        },
        'summary': {
            'total_products': total_products,
            'total_stock_quantity': total_stock,
            'low_stock_products_count': low_stock_count,
            'out_of_stock_products_count': out_of_stock_count,
        },
        'low_stock_items': attention_list,
        'recent_products': recent_list,
    }, status=status.HTTP_200_OK)


# ==========================================
# SETTINGS VIEWS
# ==========================================

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated, HasOrganizationPermission])
def settings_view(request):
    """
    GET: Returns organization settings including default_low_stock_threshold.
    PATCH: Updates the default low-stock threshold for the organization.
    """
    org = request.user.organization

    if request.method == 'GET':
        serializer = OrganizationSerializer(org)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'PATCH':
        serializer = SettingsSerializer(data=request.data)
        if serializer.is_valid():
            serializer.update(org, serializer.validated_data)
            return Response({
                'message': 'Organization settings updated successfully.',
                'settings': OrganizationSerializer(org).data
            }, status=status.HTTP_200_OK)
        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

