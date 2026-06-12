from django.contrib import admin
from .models import Cart, CartItem


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ['product_variant', 'quantity', 'line_total']

    def line_total(self, obj):
        return obj.line_total
    line_total.short_description = 'Line Total'


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'session_id', 'item_count', 'subtotal', 'created_at']
    search_fields = ['user__email', 'session_id']
    readonly_fields = ['subtotal', 'item_count', 'created_at', 'updated_at']
    inlines = [CartItemInline]


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ['cart', 'product_variant', 'quantity', 'line_total']
    search_fields = ['cart__user__email', 'product_variant__sku']
