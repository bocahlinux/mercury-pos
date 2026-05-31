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
        fields = ['customer', 'subtotal', 'discount_type', 'discount_value', 'tax_percent', 'tax_amount', 'total', 'payment_method', 'payment_amount', 'change_amount', 'notes', 'items']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        with db_transaction.atomic():
            transaction_obj = Transaction.objects.create(**validated_data)
            subtotal = Decimal('0')
            for item_data in items_data:
                qty = item_data.get('quantity', 1)
                unit_price = item_data.get('unit_price', 0)
                discount = item_data.get('discount', 0)
                item_subtotal = qty * unit_price - discount
                TransactionItem.objects.create(
                    transaction=transaction_obj,
                    product_id=item_data['product_id'],
                    variant_id=item_data.get('variant_id'),
                    quantity=qty,
                    unit_price=unit_price,
                    discount=discount,
                    subtotal=item_subtotal,
                )
                subtotal += item_subtotal
            # Recalculate from DB
            transaction_obj.subtotal = subtotal
            after_discount = subtotal - transaction_obj.discount_value
            transaction_obj.tax_amount = after_discount * transaction_obj.tax_percent / Decimal('100')
            transaction_obj.total = after_discount + transaction_obj.tax_amount
            transaction_obj.save()
        return transaction_obj


class ReceiptSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()
    store_name = serializers.SerializerMethodField()
    store_address = serializers.SerializerMethodField()
    store_phone = serializers.SerializerMethodField()
    cashier_name = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = ['id', 'invoice_number', 'store_name', 'store_address', 'store_phone',
                  'cashier_name', 'customer_name', 'items', 'subtotal', 'discount_value',
                  'tax_percent', 'tax_amount', 'total', 'payment_method', 'payment_amount',
                  'change_amount', 'status', 'notes', 'created_at']

    def get_items(self, obj):
        return [{
            'product_name': i.product.name,
            'quantity': i.quantity,
            'unit_price': float(i.unit_price),
            'discount': float(i.discount),
            'subtotal': float(i.subtotal),
        } for i in obj.items.select_related('product').all()]

    def get_store_name(self, obj):
        from core.models import StoreSettings
        try:
            return StoreSettings.objects.first().name
        except:
            return 'Mercury POS Store'

    def get_store_address(self, obj):
        from core.models import StoreSettings
        try:
            s = StoreSettings.objects.first()
            return s.address or ''
        except:
            return ''

    def get_store_phone(self, obj):
        from core.models import StoreSettings
        try:
            s = StoreSettings.objects.first()
            return s.phone or ''
        except:
            return ''

    def get_cashier_name(self, obj):
        return obj.cashier.get_full_name() or obj.cashier.email

    def get_customer_name(self, obj):
        return obj.customer.name if obj.customer else '-'
