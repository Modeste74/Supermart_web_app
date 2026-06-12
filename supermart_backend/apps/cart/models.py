from django.conf import settings
from django.db import models

from apps.catalog.models import ProductVariant


class Cart(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.CASCADE,
        related_name='cart',
    )
    session_id = models.CharField(max_length=100, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'carts'

    def __str__(self):
        return f'Cart({self.user or self.session_id})'

    @property
    def subtotal(self):
        return sum(item.line_total for item in self.items.select_related('product_variant').all())

    @property
    def item_count(self):
        return sum(item.quantity for item in self.items.all())


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product_variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        db_table = 'cart_items'
        unique_together = ('cart', 'product_variant')

    def __str__(self):
        return f'{self.quantity}x {self.product_variant}'

    @property
    def line_total(self):
        return self.product_variant.price * self.quantity
