from django.conf import settings
from django.db import models
from django.utils.text import slugify
from core.utils import generate_sku


class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    parent = models.ForeignKey(
        'self', null=True, blank=True, on_delete=models.SET_NULL, related_name='subcategories'
    )
    image_url = models.URLField(max_length=500, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'categories'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='products')
    brand = models.CharField(max_length=100, blank=True)
    images = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'products'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    @property
    def in_stock(self):
        return self.variants.filter(is_active=True, stock_qty__gt=0).exists()

    @property
    def starting_price(self):
        variant = self.variants.filter(is_active=True).order_by('price').first()
        return variant.price if variant else None


class ProductVariant(models.Model):
    VARIANT_TYPE_CHOICES = [
        ('weight', 'Weight'),
        ('volume', 'Volume'),
        ('pack_size', 'Pack Size'),
        ('flavor', 'Flavor'),
        ('form', 'Form'),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    sku = models.CharField(max_length=100, unique=True)
    variant_label = models.CharField(max_length=100)
    variant_type = models.CharField(max_length=20, choices=VARIANT_TYPE_CHOICES)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    compare_at_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock_qty = models.IntegerField(default=0)
    low_stock_threshold = models.IntegerField(default=5)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'product_variants'

    def save(self, *args, **kwargs):
        if not self.sku:
            self.sku = generate_sku(self.product.name, self.variant_label)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.product.name} — {self.variant_label}'

    @property
    def is_low_stock(self):
        return 0 < self.stock_qty <= self.low_stock_threshold

    @property
    def is_out_of_stock(self):
        return self.stock_qty == 0


class Review(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews'
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True)
    is_verified_purchase = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reviews'
        unique_together = ('user', 'product')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user} → {self.product.name} ({self.rating}★)'
