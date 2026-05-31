from rest_framework import serializers
from .models import Transaction, TransactionItem
from django.db import transaction as db_transaction
from decimal import Decimal

class TransactionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionItem
        fields = ['id', 'product', 'variant', 'quantity', 'unit_price', 'discount', 'subtotal']
        read_only_fields = ['id', 'subtotal']

    def validate(self, attrs):
        # Ensure discount not exceed unit_price * quantity
        qty = attrs.get('quantity')
        unit = attrs.get('unit_price')
        disc = attrs.get('discount', 0)
        if disc > qty * unit:
            raise serializers.ValidationError('Discount cannot exceed line total')
        return attrs

    def create(self, validated_data):
        qty = validated_data['quantity']
        unit_price = validated_data['unit_price']
        discount = validated_data.get('discount', 0)
        subtotal = qty * unit_price - discount
        validated_data['subtotal'] = subtotal
        return super().create(validated_data)

class TransactionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['id', 'invoice_number', 'customer', 'cashier', 'total', 'status', 'created_at']
        read_only_fields = fields

class TransactionDetailSerializer(serializers.ModelSerializer):
    items = TransactionItemSerializer(many=True, read_only=True)

    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ['invoice_number', 'tax_amount', 'total', 'created_at', 'updated_at']

class TransactionCreateSerializer(serializers.ModelSerializer):
    items = TransactionItemSerializer(many=True)

    class Meta:
        model = Transaction
        fields = ['customer', 'discount_type', 'discount_value', 'tax_percent', 'payment_method', 'payment_amount', 'notes', 'items']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        with db_transaction.atomic():
            transaction_obj = Transaction.objects.create(**validated_data)
            subtotal = 0
            for item_data in items_data:
                item_serializer = TransactionItemSerializer(data=item_data)
                item_serializer.is_valid(raise_exception=True)
                item = item_serializer.save(transaction=transaction_obj)
                subtotal += item.subtotal
            transaction_obj.subtotal = subtotal
            # calculate tax and total
            transaction_obj.tax_amount = (subtotal - transaction_obj.discount_value) * transaction_obj.tax_percent / Decimal('100')
            transaction_obj.total = subtotal - transaction_obj.discount_value + transaction_obj.tax_amount
            transaction_obj.save()
        return transaction_obj
