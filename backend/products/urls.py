from django.urls import path, include
from rest_framework import routers
from .views import CategoryViewSet, ProductViewSet, StockMovementViewSet

router = routers.DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'stock-movements', StockMovementViewSet, basename='stockmovement')

urlpatterns = [
    path('', include(router.urls)),
]
