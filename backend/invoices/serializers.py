from rest_framework import serializers
from .models import Invoice

class InvoiceSerializer(serializers.ModelSerializer):
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True, source='transaction.total')
    customer_name = serializers.CharField(source='transaction.customer.name', read_only=True, default='')

    class Meta:
        model = Invoice
        fields = ['id', 'invoice_number', 'status', 'issued_date', 'total', 'customer_name', 'pdf_file']

class InvoiceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = ['transaction', 'invoice_number', 'due_date', 'notes']
