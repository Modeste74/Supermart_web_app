from django.contrib import admin
from .models import DeliveryZone, Order, OrderItem, OrderStatusHistory


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['sku_snapshot', 'product_name_snapshot', 'variant_label_snapshot',
                       'unit_price_snapshot', 'quantity', 'line_total']


class OrderStatusHistoryInline(admin.TabularInline):
    model = OrderStatusHistory
    extra = 0
    readonly_fields = ['status', 'note', 'changed_by', 'created_at']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'user', 'status', 'payment_method', 'payment_status', 'total', 'created_at']
    list_filter = ['status', 'payment_method', 'payment_status', 'fulfilment_type']
    search_fields = ['order_number', 'user__email', 'user__first_name']
    readonly_fields = ['order_number', 'created_at', 'updated_at']
    inlines = [OrderItemInline, OrderStatusHistoryInline]


@admin.register(DeliveryZone)
class DeliveryZoneAdmin(admin.ModelAdmin):
    list_display = ['name', 'delivery_fee', 'estimated_days', 'is_active']
    list_editable = ['is_active']
