from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
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
