from django.test import TestCase, RequestFactory
from rest_framework.test import APIRequestFactory
from accounts.models import User
from accounts.permissions import IsAdmin, IsOwner, IsKasir, IsOwnerOrAdmin


class PermissionTest(TestCase):
    """Test custom permission classes."""

    def setUp(self):
        self.owner = User.objects.create_user(
            email='owner@example.com', password='pass12345', role='owner'
        )
        self.admin = User.objects.create_user(
            email='admin@example.com', password='pass12345', role='admin'
        )
        self.kasir = User.objects.create_user(
            email='kasir@example.com', password='pass12345', role='kasir'
        )
        self.inactive_user = User.objects.create_user(
            email='inactive@example.com', password='pass12345',
            role='admin', is_active=False
        )
        self.factory = APIRequestFactory()

    def _make_request(self, user):
        request = self.factory.get('/')
        request.user = user
        return request

    # ── IsAdmin ──

    def test_isadmin_allows_owner(self):
        perm = IsAdmin()
        request = self._make_request(self.owner)
        self.assertTrue(perm.has_permission(request, None))

    def test_isadmin_allows_admin(self):
        perm = IsAdmin()
        request = self._make_request(self.admin)
        self.assertTrue(perm.has_permission(request, None))

    def test_isadmin_denies_kasir(self):
        perm = IsAdmin()
        request = self._make_request(self.kasir)
        self.assertFalse(perm.has_permission(request, None))

    def test_isadmin_denies_anonymous(self):
        from django.contrib.auth.models import AnonymousUser
        perm = IsAdmin()
        request = self._make_request(AnonymousUser())
        self.assertFalse(perm.has_permission(request, None))

    # ── IsKasir ──

    def test_iskasir_allows_owner(self):
        perm = IsKasir()
        request = self._make_request(self.owner)
        self.assertTrue(perm.has_permission(request, None))

    def test_iskasir_allows_admin(self):
        perm = IsKasir()
        request = self._make_request(self.admin)
        self.assertTrue(perm.has_permission(request, None))

    def test_iskasir_allows_kasir(self):
        perm = IsKasir()
        request = self._make_request(self.kasir)
        self.assertTrue(perm.has_permission(request, None))

    def test_iskasir_denies_anonymous(self):
        from django.contrib.auth.models import AnonymousUser
        perm = IsKasir()
        request = self._make_request(AnonymousUser())
        self.assertFalse(perm.has_permission(request, None))

    # ── IsOwner ──

    def test_isowner_allows_own_object(self):
        perm = IsOwner()
        request = self._make_request(self.owner)
        self.assertTrue(perm.has_object_permission(request, None, self.owner))

    def test_isowner_denies_other_object(self):
        perm = IsOwner()
        request = self._make_request(self.owner)
        self.assertFalse(perm.has_object_permission(request, None, self.admin))

    # ── IsOwnerOrAdmin ──

    def test_isowneroradmin_allows_owner(self):
        perm = IsOwnerOrAdmin()
        request = self._make_request(self.owner)
        self.assertTrue(perm.has_permission(request, None))

    def test_isowneroradmin_allows_admin(self):
        perm = IsOwnerOrAdmin()
        request = self._make_request(self.admin)
        self.assertTrue(perm.has_permission(request, None))

    def test_isowneroradmin_denies_kasir(self):
        perm = IsOwnerOrAdmin()
        request = self._make_request(self.kasir)
        self.assertFalse(perm.has_permission(request, None))

    # ── User role properties ──

    def test_user_is_owner_property(self):
        self.assertTrue(self.owner.is_owner)
        self.assertFalse(self.admin.is_owner)
        self.assertFalse(self.kasir.is_owner)

    def test_user_is_admin_property(self):
        self.assertTrue(self.admin.is_admin)
        self.assertFalse(self.owner.is_admin)
        self.assertFalse(self.kasir.is_admin)
