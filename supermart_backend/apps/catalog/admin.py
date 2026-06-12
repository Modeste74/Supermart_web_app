from django.contrib import admin
from .models import Category, Product, ProductVariant


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'parent', 'is_active']
    list_filter = ['is_active', 'parent']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1
    fields = ['sku', 'variant_label', 'variant_type', 'price', 'compare_at_price', 'stock_qty', 'low_stock_threshold', 'is_active']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'brand', 'in_stock', 'is_active', 'created_at']
    list_filter = ['is_active', 'category', 'brand']
    search_fields = ['name', 'slug', 'brand']
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductVariantInline]
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ['sku', 'product', 'variant_label', 'price', 'stock_qty', 'is_active']
    list_filter = ['is_active', 'variant_type']
    search_fields = ['sku', 'product__name', 'variant_label']
