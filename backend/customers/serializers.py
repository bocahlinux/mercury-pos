from rest_framework import serializers
from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    transaction_count = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'email', 'phone', 'address',
            'loyalty_points', 'notes', 'is_active',
            'transaction_count', 'total_spent',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'loyalty_points', 'created_at', 'updated_at']

    def get_transaction_count(self, obj):
        return obj.transaction_set.filter(status='completed').count()

    def get_total_spent(self, obj):
        from django.db.models import Sum
        total = obj.transaction_set.filter(status='completed').aggregate(
            total=Sum('total')
        )['total']
        return total or 0
