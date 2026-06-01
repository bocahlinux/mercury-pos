from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StoreSettingsViewSet

router = DefaultRouter()
router.register(r'', StoreSettingsViewSet, basename='store-settings')

urlpatterns = [
    # Singleton settings — no pk needed
    path('', StoreSettingsViewSet.as_view({'get': 'list', 'patch': 'partial_update', 'put': 'update'}), name='settings-singleton'),
    path('<int:pk>/', include(router.urls)),
]
