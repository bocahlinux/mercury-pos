from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Customer
from .serializers import CustomerSerializer
from accounts.permissions import IsAdmin, IsKasir


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'phone', 'email']
    ordering_fields = ['name', 'created_at', 'loyalty_points']
    ordering = ['name']
    permission_classes = [IsAdmin]
