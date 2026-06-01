import django_filters
from .models import Invoice


class InvoiceFilter(django_filters.FilterSet):
    status = django_filters.CharFilter(field_name='status')
    invoice_number = django_filters.CharFilter(field_name='invoice_number', lookup_expr='icontains')
    date_from = django_filters.DateFilter(field_name='issued_date', lookup_expr='gte')
    date_to = django_filters.DateFilter(field_name='issued_date', lookup_expr='lte')

    class Meta:
        model = Invoice
        fields = ['status', 'invoice_number', 'date_from', 'date_to']
