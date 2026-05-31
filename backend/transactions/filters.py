import django_filters
from .models import Transaction
from django.db.models import Q

class TransactionFilter(django_filters.FilterSet):
    start_date = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')
    end_date = django_filters.DateFilter(field_name='created_at', lookup_expr='lte')
    status = django_filters.CharFilter(method='filter_status')
    payment_method = django_filters.CharFilter(method='filter_payment')

    class Meta:
        model = Transaction
        fields = ['start_date', 'end_date', 'status', 'payment_method']

    def filter_status(self, queryset, name, value):
        return queryset.filter(status=value)

    def filter_payment(self, queryset, name, value):
        return queryset.filter(payment_method=value)
