import django_filters
from .models import Product

class ProductFilter(django_filters.FilterSet):
    category = django_filters.NumberFilter(field_name='category__id')
    min_price = django_filters.NumberFilter(field_name='sell_price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='sell_price', lookup_expr='lte')
    is_active = django_filters.BooleanFilter(field_name='is_active')
    low_stock = django_filters.BooleanFilter(method='filter_low_stock')

    def filter_low_stock(self, queryset, name, value):
        if value:
            return queryset.filter(stock__lte=django_filters.models.F('min_stock_alert'))
        return queryset

    class Meta:
        model = Product
        fields = ['category', 'min_price', 'max_price', 'is_active', 'low_stock']
