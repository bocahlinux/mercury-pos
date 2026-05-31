from rest_framework import serializers
from .models import StoreSettings


class StoreSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreSettings
        fields = [
            'id', 'name', 'address', 'phone', 'email', 'logo',
            'tax_percent', 'currency', 'receipt_header', 'receipt_footer',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
