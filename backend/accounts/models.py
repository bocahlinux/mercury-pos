from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.conf import settings
from .managers import CustomUserManager


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_OWNER = 'owner'
    ROLE_ADMIN = 'admin'
    ROLE_KASIR = 'kasir'
    ROLE_CHOICES = [
        (ROLE_OWNER, 'Owner'),
        (ROLE_ADMIN, 'Admin'),
        (ROLE_KASIR, 'Kasir'),
    ]

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_KASIR)
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        ordering = ['-date_joined']

    def __str__(self):
        return self.email

    @property
    def is_owner(self):
        return self.role == self.ROLE_OWNER

    @property
    def is_admin(self):
        return self.role == self.ROLE_ADMIN


class AuditLog(models.Model):
    """Track all significant actions across the system."""

    class ActionType(models.TextChoices):
        CREATE = 'create', 'Create'
        UPDATE = 'update', 'Update'
        DELETE = 'delete', 'Delete'
        LOGIN = 'login', 'Login'
        LOGOUT = 'logout', 'Logout'
        ROLE_CHANGE = 'role_change', 'Role Change'
        ACTIVATE = 'activate', 'Activate'
        DEACTIVATE = 'deactivate', 'Deactivate'
        EXPORT = 'export', 'Export'
        PDF_GENERATE = 'pdf_generate', 'PDF Generate'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='audit_logs'
    )
    action = models.CharField(max_length=20, choices=ActionType.choices)
    model_name = models.CharField(max_length=100, blank=True)
    object_id = models.CharField(max_length=50, blank=True)
    object_repr = models.CharField(max_length=255, blank=True)
    detail = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['action', '-created_at']),
            models.Index(fields=['model_name', '-created_at']),
        ]

    def __str__(self):
        return f"{self.action} {self.model_name} by {self.user} at {self.created_at:%Y-%m-%d %H:%M}"
