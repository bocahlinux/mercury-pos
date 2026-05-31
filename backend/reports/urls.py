from django.urls import path
from .views import DashboardView, SalesReportView, ProductReportView

urlpatterns = [
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('sales-report/', SalesReportView.as_view(), name='sales-report'),
    path('product-report/', ProductReportView.as_view(), name='product-report'),
]
