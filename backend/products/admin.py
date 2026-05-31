from django.contrib import admin
from .models import Category, Product, StockMovement

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'parent', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'slug')

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'category', 'unit', 'sell_price', 'stock', 'is_active')
    list_filter = ('is_active', 'category', 'unit')
    search_fields = ('name', 'sku', 'category__name')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ('product', 'variant', 'type', 'quantity', 'created_by', 'created_at')
    list_filter = ('type', 'created_at')
    search_fields = ('product__name', 'variant__name', 'reference')
