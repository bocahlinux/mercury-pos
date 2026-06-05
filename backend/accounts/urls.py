from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView, UserRegisterView, UserProfileView,
    UserListView, ChangePasswordView,
    UserManagementViewSet, AuditLogView,
)

urlpatterns = [
    path('register/', UserRegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),

    # Phase 5: User Management (Owner only)
    path('users/manage/', UserManagementViewSet.as_view({
        'get': 'list',
    }), name='user-manage-list'),
    path('users/manage/<int:pk>/', UserManagementViewSet.as_view({
        'get': 'retrieve',
        'delete': 'destroy',
    }), name='user-manage-detail'),
    path('users/manage/<int:pk>/update_role/', UserManagementViewSet.as_view({
        'patch': 'update_role',
    }), name='user-manage-role'),
    path('users/manage/<int:pk>/activate/', UserManagementViewSet.as_view({
        'post': 'activate',
    }), name='user-manage-activate'),
    path('users/manage/<int:pk>/deactivate/', UserManagementViewSet.as_view({
        'post': 'deactivate',
    }), name='user-manage-deactivate'),

    # Phase 5: Audit Log
    path('audit-log/', AuditLogView.as_view(), name='audit-log'),
]
