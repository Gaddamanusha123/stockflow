from decimal import Decimal
from django.db import transaction
from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, Organization, Product


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'name', 'default_low_stock_threshold', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserProfileSerializer(serializers.ModelSerializer):
    organization = OrganizationSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'organization', 'created_at']
        read_only_fields = ['id', 'email', 'organization', 'created_at']


class SignupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, min_length=6)
    organization_name = serializers.CharField(max_length=255)

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return normalized

    def validate_organization_name(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Organization name cannot be empty.")
        return cleaned

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        email = validated_data['email']
        password = validated_data['password']
        org_name = validated_data['organization_name']

        with transaction.atomic():
            organization = Organization.objects.create(
                name=org_name,
                default_low_stock_threshold=10
            )
            user = User.objects.create_user(
                email=email,
                password=password,
                organization=organization
            )

        refresh = RefreshToken.for_user(user)
        return {
            'user': user,
            'organization': organization,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email', '').strip().lower()
        password = attrs.get('password')

        if not email or not password:
            raise serializers.ValidationError("Both email and password are required.")

        user = authenticate(email=email, password=password)
        if not user:
            # Check if user exists to give helpful feedback without exposing sensitive information
            user_exists = User.objects.filter(email__iexact=email).exists()
            if not user_exists:
                raise serializers.ValidationError("No account found with this email address.")
            raise serializers.ValidationError("Invalid password provided.")

        if not user.is_active:
            raise serializers.ValidationError("This account has been deactivated.")

        refresh = RefreshToken.for_user(user)
        return {
            'user': user,
            'organization': user.organization,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }


class ProductSerializer(serializers.ModelSerializer):
    effective_low_stock_threshold = serializers.IntegerField(read_only=True)
    stock_status = serializers.CharField(read_only=True)
    organization_id = serializers.IntegerField(read_only=True, source='organization.id')
    last_updated_by_email = serializers.EmailField(source='last_updated_by.email', read_only=True, default='')

    class Meta:
        model = Product
        fields = [
            'id',
            'organization_id',
            'name',
            'sku',
            'description',
            'quantity_on_hand',
            'cost_price',
            'selling_price',
            'low_stock_threshold',
            'effective_low_stock_threshold',
            'stock_status',
            'last_updated_by_email',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'organization_id', 'last_updated_by_email', 'created_at', 'updated_at']

    def validate_name(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Product name is required.")
        return cleaned

    def validate_sku(self, value):
        cleaned = value.strip().upper()
        if not cleaned:
            raise serializers.ValidationError("SKU is required.")
        return cleaned

    def validate_quantity_on_hand(self, value):
        if value < 0:
            raise serializers.ValidationError("Quantity on hand cannot be negative.")
        return value

    def validate_cost_price(self, value):
        if value < Decimal('0.00'):
            raise serializers.ValidationError("Cost price cannot be negative.")
        return value

    def validate_selling_price(self, value):
        if value < Decimal('0.00'):
            raise serializers.ValidationError("Selling price cannot be negative.")
        return value

    def validate_low_stock_threshold(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Low stock threshold cannot be negative.")
        return value

    def validate(self, attrs):
        user = self.context['request'].user
        sku = attrs.get('sku', getattr(self.instance, 'sku', None))
        
        if sku:
            sku = sku.strip().upper()
            attrs['sku'] = sku
            # Check unique SKU constraint within organization
            existing = Product.objects.filter(
                organization=user.organization,
                sku__iexact=sku
            )
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            if existing.exists():
                raise serializers.ValidationError({
                    "sku": f"A product with SKU '{sku}' already exists in your organization."
                })
        return attrs

    def create(self, validated_data):
        user = self.context['request'].user
        # Enforce organization from authenticated user
        validated_data['organization'] = user.organization
        validated_data['last_updated_by'] = user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        user = self.context['request'].user
        validated_data['last_updated_by'] = user
        return super().update(instance, validated_data)


class StockAdjustmentSerializer(serializers.Serializer):
    adjustment = serializers.IntegerField(
        required=False,
        help_text="Relative adjustment to add or subtract (e.g. +5 or -5)"
    )
    new_quantity = serializers.IntegerField(
        required=False,
        min_value=0,
        help_text="Absolute new quantity"
    )
    note = serializers.CharField(required=False, allow_blank=True, default='')

    def validate(self, attrs):
        if 'adjustment' not in attrs and 'new_quantity' not in attrs:
            raise serializers.ValidationError(
                "Either 'adjustment' (relative) or 'new_quantity' (absolute) must be provided."
            )
        return attrs


class SettingsSerializer(serializers.Serializer):
    default_low_stock_threshold = serializers.IntegerField(
        min_value=0,
        required=True,
        help_text="Default threshold below which products trigger a low stock alert"
    )

    def update(self, instance, validated_data):
        instance.default_low_stock_threshold = validated_data['default_low_stock_threshold']
        instance.save(update_fields=['default_low_stock_threshold', 'updated_at'])
        return instance

