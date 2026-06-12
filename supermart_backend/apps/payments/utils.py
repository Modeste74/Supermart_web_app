from django.db import transaction

from apps.catalog.models import ProductVariant
from apps.orders.models import Order, OrderStatusHistory, ONLINE_PAYMENT_METHODS
from core.utils import release_order_stock


@transaction.atomic
def confirm_payment(payment, gateway_reference, gateway_response):
    """
    Mark a payment as successful and confirm the associated order.
    Called by both the Flutterwave and Stripe webhook handlers.

    - Updates payment: status → success, gateway_reference, gateway_response
    - Decrements MySQL stock for each order item
    - Releases Redis stock locks
    - Updates order: status → confirmed, payment_status → paid
    - Appends OrderStatusHistory entry
    """
    order = payment.order

    # Update payment record
    payment.status = 'success'
    payment.gateway_reference = str(gateway_reference)
    payment.gateway_response = gateway_response
    payment.save(update_fields=['status', 'gateway_reference', 'gateway_response'])

    # Decrement stock for each order item
    lock_items = []
    for item in order.items.select_related('product_variant'):
        ProductVariant.objects.filter(id=item.product_variant_id).update(
            stock_qty=max(0, item.product_variant.stock_qty - item.quantity)
        )
        lock_items.append((item.product_variant_id, item.quantity))

    # Release Redis locks
    release_order_stock(lock_items)

    # Confirm order
    order.status = 'confirmed'
    order.payment_status = 'paid'
    order.save(update_fields=['status', 'payment_status'])

    OrderStatusHistory.objects.create(
        order=order,
        status='confirmed',
        note=f'Payment confirmed via {payment.gateway} (ref: {gateway_reference}).',
    )


@transaction.atomic
def fail_payment(payment, gateway_response=None):
    """
    Mark a payment as failed and cancel the associated order.
    Releases Redis locks — MySQL stock was never decremented for online payments.
    """
    order = payment.order

    payment.status = 'failed'
    if gateway_response:
        payment.gateway_response = gateway_response
    payment.save(update_fields=['status', 'gateway_response'])

    lock_items = [(item.product_variant_id, item.quantity) for item in order.items.all()]
    release_order_stock(lock_items)

    order.status = 'cancelled'
    order.save(update_fields=['status'])

    OrderStatusHistory.objects.create(
        order=order,
        status='cancelled',
        note=f'Payment failed via {payment.gateway}.',
    )
