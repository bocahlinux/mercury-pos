from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User, AuditLog
from .serializers import (
    UserSerializer, UserRegisterSerializer,
    UserProfileSerializer, ChangePasswordSerializer,
    CustomTokenObtainPairSerializer, AuditLogSerializer,
)
from .permissions import IsAdmin, IsOwner
from .audit import audit_role_change, audit_activate, audit_deactivate


class CustomTokenObtainPairView(TokenObtainPairView):
    """JWT login that returns {access, refresh, user}."""
    serializer_class = CustomTokenObtainPairSerializer


class UserRegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'user': UserSerializer(user).data,
            'message': 'Registrasi berhasil'
        }, status=status.HTTP_201_CREATED)


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'message': 'Password berhasil diubah'})


# ── Phase 5: User Management (Owner only) ──────────────────────────

class UserManagementViewSet(viewsets.ViewSet):
    """
    Owner-only user management.
    list: GET /api/auth/users/manage/
    retrieve: GET /api/auth/users/manage/{id}/
    update_role: PATCH /api/auth/users/manage/{id}/update_role/
    activate: POST /api/auth/users/manage/{id}/activate/
    deactivate: POST /api/auth/users/manage/{id}/deactivate/
    destroy: DELETE /api/auth/users/manage/{id}/
    """
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    serializer_class = UserSerializer

    def list(self, request):
        users = User.objects.all().order_by('-date_joined')
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
        return Response(UserSerializer(user).data)

    def update_role(self, request, pk=None):
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        new_role = request.data.get('role')
        if new_role not in [User.ROLE_OWNER, User.ROLE_ADMIN, User.ROLE_KASIR]:
            return Response({'error': f'Invalid role: {new_role}'}, status=400)

        old_role = target_user.role
        if old_role == new_role:
            return Response({'message': 'Role unchanged', 'role': new_role})

        target_user.role = new_role
        target_user.save(update_fields=['role'])
        audit_role_change(request.user, target_user, old_role, new_role, request)

        return Response({
            'message': f'Role updated from {old_role} to {new_role}',
            'user': UserSerializer(target_user).data
        })

    def activate(self, request, pk=None):
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        if target_user.is_active:
            return Response({'message': 'User already active'})

        target_user.is_active = True
        target_user.save(update_fields=['is_active'])
        audit_activate(request.user, target_user, request)

        return Response({
            'message': f'User {target_user.email} activated',
            'user': UserSerializer(target_user).data
        })

    def deactivate(self, request, pk=None):
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        if not target_user.is_active:
            return Response({'message': 'User already inactive'})

        # Prevent self-deactivation
        if target_user == request.user:
            return Response({'error': 'Cannot deactivate yourself'}, status=400)

        target_user.is_active = False
        target_user.save(update_fields=['is_active'])
        audit_deactivate(request.user, target_user, request)

        return Response({
            'message': f'User {target_user.email} deactivated',
            'user': UserSerializer(target_user).data
        })

    def destroy(self, request, pk=None):
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        # Prevent self-deletion
        if target_user == request.user:
            return Response({'error': 'Cannot delete yourself'}, status=400)

        email = target_user.email
        target_user.delete()
        return Response({'message': f'User {email} deleted'})


# ── Phase 5: Audit Log ─────────────────────────────────────────────

class AuditLogView(generics.ListAPIView):
    """
    List audit logs. Admin/Owner only.
    Filter: ?action=create&model_name=Product&user_email=x@y.com
    """
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get_queryset(self):
        qs = AuditLog.objects.select_related('user').all()
        action = self.request.query_params.get('action')
        model_name = self.request.query_params.get('model_name')
        user_email = self.request.query_params.get('user_email')

        if action:
            qs = qs.filter(action=action)
        if model_name:
            qs = qs.filter(model_name__icontains=model_name)
        if user_email:
            qs = qs.filter(user__email__icontains=user_email)

        return qs
