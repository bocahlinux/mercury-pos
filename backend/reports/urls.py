from django.urls import path
from .views import (
    DashboardView, SalesReportView, ProductReportView,
    CustomerReportView,
    SalesReportExportView, ProductReportExportView, CustomerReportExportView,
)

urlpatterns = [
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('sales-report/', SalesReportView.as_view(), name='sales-report'),
    path('product-report/', ProductReportView.as_view(), name='product-report'),
    path('customer-report/', CustomerReportView.as_view(), name='customer-report'),
    path('sales-report/export/', SalesReportExportView.as_view(), name='sales-report-export'),
    path('product-report/export/', ProductReportExportView.as_view(), name='product-report-export'),
    path('customer-report/export/', CustomerReportExportView.as_view(), name='customer-report-export'),
]
