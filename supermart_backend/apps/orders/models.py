from django.db import models
from django.conf import settings


class DeliveryZone(models.Model):
    name = models.CharField(max_length=100)
    covered_areas = models.JSONField(default=list)
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2)
    estimated_days = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('confirmed', 'Confirmed'),
    ('processing', 'Processing'),
    ('ready', 'Ready for Pickup'),
    ('dispatched', 'Dispatched'),
    ('out_for_delivery', 'Out for Delivery'),
    ('delivered', 'Delivered'),
    ('cancelled', 'Cancelled'),
]

FULFILMENT_CHOICES = [
    ('delivery', 'Delivery'),
    ('pickup', 'Pickup'),
]

PAYMENT_METHOD_CHOICES = [
    ('mobile_money', 'Mobile Money'),
    ('card', 'Card'),
    ('cash_on_delivery', 'Cash on Delivery'),
    ('pay_in_store', 'Pay in Store'),
]

PAYMENT_STATUS_CHOICES = [
    ('unpaid', 'Unpaid'),
    ('paid', 'Paid'),
    ('refunded', 'Refunded'),
]

ONLINE_PAYMENT_METHODS = {'mobile_money', 'card'}


class Order(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='orders',
    )
    order_number = models.CharField(max_length=20, unique=True, editable=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    fulfilment_type = models.CharField(max_length=10, choices=FULFILMENT_CHOICES)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    payment_status = models.CharField(
        max_length=10, choices=PAYMENT_STATUS_CHOICES, default='unpaid'
    )
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_address = models.ForeignKey(
        'users.Address',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='orders',
    )
    delivery_zone = models.ForeignKey(
        DeliveryZone,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='orders',
    )
    special_instructions = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.order_number:
            from core.utils import generate_order_number
            self.order_number = generate_order_number()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.order_number


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product_variant = models.ForeignKey(
        'catalog.ProductVariant', on_delete=models.PROTECT
    )
    sku_snapshot = models.CharField(max_length=100)
    product_name_snapshot = models.CharField(max_length=255)
    variant_label_snapshot = models.CharField(max_length=100)
    unit_price_snapshot = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()
    line_total = models.DecimalField(max_digits=10, decimal_places=2)

    def save(self, *args, **kwargs):
        self.line_total = self.unit_price_snapshot * self.quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.order.order_number} — {self.product_name_snapshot}'


class OrderStatusHistory(models.Model):
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name='status_history'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    note = models.TextField(blank=True)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'{self.order.order_number} → {self.status}'
