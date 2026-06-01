import django_filters
from .models import Transaction
from django.db.models import Q


class TransactionFilter(django_filters.FilterSet):
    start_date = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')
    end_date = django_filters.DateFilter(field_name='created_at', lookup_expr='lte')
    status = django_filters.CharFilter(field_name='status')
    payment_method = django_filters.CharFilter(field_name='payment_method')
    search = django_filters.CharFilter(method='filter_search')
    cashier = django_filters.NumberFilter(field_name='cashier_id')

    class Meta:
        model = Transaction
        fields = ['start_date', 'end_date', 'status', 'payment_method', 'search', 'cashier']

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(invoice_number__icontains=value) |
            Q(customer__name__icontains=value)
        )
