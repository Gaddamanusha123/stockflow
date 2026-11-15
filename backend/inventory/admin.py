from django.contrib import admin
from .models import Organization, User, Product

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'default_low_stock_threshold', 'created_at')
    search_fields = ('name',)

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'email', 'organization', 'is_staff', 'is_active', 'created_at')
    search_fields = ('email',)
    list_filter = ('organization', 'is_staff', 'is_active')

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'sku', 'organization', 'quantity_on_hand', 'selling_price', 'created_at')
    search_fields = ('name', 'sku')
    list_filter = ('organization',)

