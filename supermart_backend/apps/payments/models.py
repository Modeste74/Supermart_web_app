from django.db import models


GATEWAY_CHOICES = [
    ('flutterwave', 'Flutterwave'),
    ('stripe', 'Stripe'),
    ('internal', 'Internal'),
]

PAYMENT_STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('success', 'Success'),
    ('failed', 'Failed'),
    ('refunded', 'Refunded'),
]


class Payment(models.Model):
    order = models.ForeignKey(
        'orders.Order', on_delete=models.CASCADE, related_name='payments'
    )
    payment_method = models.CharField(max_length=20)
    gateway = models.CharField(max_length=50, choices=GATEWAY_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='KES')
    status = models.CharField(
        max_length=10, choices=PAYMENT_STATUS_CHOICES, default='pending'
    )
    gateway_reference = models.CharField(max_length=255, blank=True)
    gateway_response = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.order.order_number} — {self.gateway} — {self.status}'
