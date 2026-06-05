from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from .models import StoreSettings
from .serializers import StoreSettingsSerializer
from .permissions import OwnerOnly


class StoreSettingsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: StoreSettingsSerializer})
    def list(self, request):
        settings, created = StoreSettings.objects.get_or_create()
        serializer = StoreSettingsSerializer(settings)
        return Response(serializer.data)

    @extend_schema(request=StoreSettingsSerializer, responses={200: StoreSettingsSerializer})
    def update(self, request, *args, **kwargs):
        if request.user.role != 'owner':
            return Response({'error': 'Only owner can update settings'}, status=403)
        settings, created = StoreSettings.objects.get_or_create()
        serializer = StoreSettingsSerializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @extend_schema(request=StoreSettingsSerializer, responses={200: StoreSettingsSerializer})
    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)
