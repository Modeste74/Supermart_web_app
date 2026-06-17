from django.db import models


class Promotion(models.Model):
    TYPE_CHOICES = [
        ('percentage', 'Percentage'),
        ('fixed_amount', 'Fixed Amount'),
        ('free_delivery', 'Free Delivery'),
    ]

    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True, null=True, blank=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    value = models.DecimalField(max_digits=10, decimal_places=2)
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_uses = models.IntegerField(null=True, blank=True)
    current_uses = models.IntegerField(default=0)
    valid_from = models.DateTimeField()
    valid_to = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-valid_from']

    def __str__(self):
        code_label = f' ({self.code})' if self.code else ''
        return f'{self.name}{code_label}'


class StoreSettings(models.Model):
    key = models.CharField(max_length=100, primary_key=True)
    value = models.TextField()
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'store_settings'

    def __str__(self):
        return f'{self.key} = {self.value}'
