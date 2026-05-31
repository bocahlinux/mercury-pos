from rest_framework import serializers
from .models import Category, Product, ProductVariant, StockMovement

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image', 'parent', 'is_active', 'created_at', 'updated_at']

class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id', 'product', 'name', 'sku', 'barcode', 'additional_price', 'stock', 'is_active', 'created_at', 'updated_at']

class ProductListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'sku', 'barcode', 'description', 'category', 'image', 'buy_price', 'sell_price', 'stock', 'min_stock_alert', 'unit', 'is_active', 'created_at', 'updated_at', 'variants']

class ProductDetailSerializer(ProductListSerializer):
    pass

class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'sku', 'barcode', 'description', 'category', 'image', 'buy_price', 'sell_price', 'stock', 'min_stock_alert', 'unit', 'is_active']
        read_only_fields = ['slug', 'created_at', 'updated_at']

class StockMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockMovement
        fields = ['id', 'product', 'variant', 'type', 'quantity', 'reference', 'notes', 'created_by', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
