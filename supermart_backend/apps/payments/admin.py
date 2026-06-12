from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['order', 'gateway', 'payment_method', 'amount', 'currency', 'status', 'created_at']
    list_filter = ['gateway', 'status', 'payment_method']
    search_fields = ['order__order_number', 'gateway_reference']
    readonly_fields = ['order', 'gateway', 'payment_method', 'amount', 'currency',
                       'gateway_reference', 'gateway_response', 'created_at']
