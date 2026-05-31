from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StoreSettingsViewSet

router = DefaultRouter()
router.register(r'', StoreSettingsViewSet, basename='store-settings')

urlpatterns = [
    path('', include(router.urls)),
]
