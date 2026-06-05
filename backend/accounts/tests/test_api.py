from django.test import TestCase
from rest_framework.test import APIClient
from accounts.models import User, AuditLog


class UserManagementAPITest(TestCase):
    """Test UserManagementViewSet endpoints (Owner only)."""

    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            email='owner@example.com', password='pass12345', role='owner'
        )
        self.admin = User.objects.create_user(
            email='admin@example.com', password='pass12345', role='admin'
        )
        self.kasir = User.objects.create_user(
            email='kasir@example.com', password='pass12345', role='kasir'
        )
        self.client.force_authenticate(user=self.owner)

    def _as(self, user):
        self.client.force_authenticate(user=user)

    # ── List ──

    def test_list_users(self):
        res = self.client.get('/api/auth/users/manage/')
        self.assertEqual(res.status_code, 200)
        # ViewSet.list returns Response(serializer.data) — a ReturnList, not paginated
        data = res.data if isinstance(res.data, list) else res.data.get('results', res.data)
        self.assertEqual(len(data), 3)

    def test_list_users_requires_owner(self):
        self._as(self.admin)
        res = self.client.get('/api/auth/users/manage/')
        self.assertEqual(res.status_code, 403)

    def test_list_users_requires_auth(self):
        self.client.force_authenticate(user=None)
        res = self.client.get('/api/auth/users/manage/')
        self.assertEqual(res.status_code, 401)

    # ── Retrieve ──

    def test_retrieve_user(self):
        res = self.client.get(f'/api/auth/users/manage/{self.admin.pk}/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['email'], 'admin@example.com')

    def test_retrieve_nonexistent_user(self):
        res = self.client.get('/api/auth/users/manage/9999/')
        self.assertEqual(res.status_code, 404)

    # ── Update Role ──

    def test_update_role(self):
        res = self.client.patch(
            f'/api/auth/users/manage/{self.kasir.pk}/update_role/',
            {'role': 'admin'}
        )
        self.assertEqual(res.status_code, 200)
        self.kasir.refresh_from_db()
        self.assertEqual(self.kasir.role, 'admin')

    def test_update_role_creates_audit_log(self):
        self.client.patch(
            f'/api/auth/users/manage/{self.kasir.pk}/update_role/',
            {'role': 'admin'}
        )
        log = AuditLog.objects.get(action='role_change')
        self.assertIn('kasir', log.detail)
        self.assertIn('admin', log.detail)

    def test_update_role_invalid_role(self):
        res = self.client.patch(
            f'/api/auth/users/manage/{self.kasir.pk}/update_role/',
            {'role': 'superuser'}
        )
        self.assertEqual(res.status_code, 400)

    def test_update_role_same_role(self):
        res = self.client.patch(
            f'/api/auth/users/manage/{self.kasir.pk}/update_role/',
            {'role': 'kasir'}
        )
        self.assertEqual(res.status_code, 200)
        self.assertIn('unchanged', res.data['message'])

    def test_update_role_requires_owner(self):
        self._as(self.admin)
        res = self.client.patch(
            f'/api/auth/users/manage/{self.kasir.pk}/update_role/',
            {'role': 'admin'}
        )
        self.assertEqual(res.status_code, 403)

    # ── Activate ──

    def test_activate_user(self):
        self.kasir.is_active = False
        self.kasir.save()
        res = self.client.post(f'/api/auth/users/manage/{self.kasir.pk}/activate/')
        self.assertEqual(res.status_code, 200)
        self.kasir.refresh_from_db()
        self.assertTrue(self.kasir.is_active)

    def test_activate_creates_audit_log(self):
        self.kasir.is_active = False
        self.kasir.save()
        self.client.post(f'/api/auth/users/manage/{self.kasir.pk}/activate/')
        log = AuditLog.objects.get(action='activate')
        self.assertIn('Activated', log.detail)

    def test_activate_already_active(self):
        res = self.client.post(f'/api/auth/users/manage/{self.kasir.pk}/activate/')
        self.assertEqual(res.status_code, 200)
        self.assertIn('already active', res.data['message'])

    # ── Deactivate ──

    def test_deactivate_user(self):
        res = self.client.post(f'/api/auth/users/manage/{self.kasir.pk}/deactivate/')
        self.assertEqual(res.status_code, 200)
        self.kasir.refresh_from_db()
        self.assertFalse(self.kasir.is_active)

    def test_deactivate_creates_audit_log(self):
        self.client.post(f'/api/auth/users/manage/{self.kasir.pk}/deactivate/')
        log = AuditLog.objects.get(action='deactivate')
        self.assertIn('Deactivated', log.detail)

    def test_deactivate_prevents_self(self):
        res = self.client.post(f'/api/auth/users/manage/{self.owner.pk}/deactivate/')
        self.assertEqual(res.status_code, 400)
        self.assertIn('Cannot deactivate yourself', res.data['error'])

    def test_deactivate_already_inactive(self):
        self.kasir.is_active = False
        self.kasir.save()
        res = self.client.post(f'/api/auth/users/manage/{self.kasir.pk}/deactivate/')
        self.assertEqual(res.status_code, 200)
        self.assertIn('already inactive', res.data['message'])

    # ── Delete ──

    def test_delete_user(self):
        res = self.client.delete(f'/api/auth/users/manage/{self.kasir.pk}/')
        self.assertEqual(res.status_code, 200)
        self.assertFalse(User.objects.filter(pk=self.kasir.pk).exists())

    def test_delete_prevents_self(self):
        res = self.client.delete(f'/api/auth/users/manage/{self.owner.pk}/')
        self.assertEqual(res.status_code, 400)
        self.assertIn('Cannot delete yourself', res.data['error'])

    def test_delete_nonexistent_user(self):
        res = self.client.delete('/api/auth/users/manage/9999/')
        self.assertEqual(res.status_code, 404)


class AuditLogAPITest(TestCase):
    """Test AuditLogView endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            email='owner@example.com', password='pass12345', role='owner'
        )
        self.admin = User.objects.create_user(
            email='admin@example.com', password='pass12345', role='admin'
        )
        self.kasir = User.objects.create_user(
            email='kasir@example.com', password='pass12345', role='kasir'
        )
        # Create some audit logs
        AuditLog.objects.create(user=self.owner, action='create', model_name='Product')
        AuditLog.objects.create(user=self.admin, action='update', model_name='User')
        AuditLog.objects.create(user=self.kasir, action='login', model_name='User')

    def _as(self, user):
        self.client.force_authenticate(user=user)

    def test_list_audit_logs_as_owner(self):
        self._as(self.owner)
        res = self.client.get('/api/auth/audit-log/')
        self.assertEqual(res.status_code, 200)
        # DRF pagination returns dict with 'results' key
        data = res.data.get('results', res.data)
        self.assertEqual(len(data), 3)

    def test_list_audit_logs_as_admin(self):
        self._as(self.admin)
        res = self.client.get('/api/auth/audit-log/')
        self.assertEqual(res.status_code, 200)

    def test_list_audit_logs_denied_for_kasir(self):
        self._as(self.kasir)
        res = self.client.get('/api/auth/audit-log/')
        self.assertEqual(res.status_code, 403)

    def test_list_audit_logs_requires_auth(self):
        self.client.force_authenticate(user=None)
        res = self.client.get('/api/auth/audit-log/')
        self.assertEqual(res.status_code, 401)

    def test_filter_by_action(self):
        self._as(self.owner)
        res = self.client.get('/api/auth/audit-log/', {'action': 'create'})
        self.assertEqual(res.status_code, 200)
        data = res.data.get('results', res.data)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['action'], 'create')

    def test_filter_by_model_name(self):
        self._as(self.owner)
        res = self.client.get('/api/auth/audit-log/', {'model_name': 'Product'})
        self.assertEqual(res.status_code, 200)
        data = res.data.get('results', res.data)
        self.assertEqual(len(data), 1)

    def test_filter_by_user_email(self):
        self._as(self.owner)
        res = self.client.get('/api/auth/audit-log/', {'user_email': 'admin'})
        self.assertEqual(res.status_code, 200)
        data = res.data.get('results', res.data)
        self.assertEqual(len(data), 1)

    def test_audit_log_serializer_fields(self):
        self._as(self.owner)
        res = self.client.get('/api/auth/audit-log/')
        self.assertEqual(res.status_code, 200)
        data = res.data.get('results', res.data)
        item = data[0]
        self.assertIn('user_email', item)
        self.assertIn('user_role', item)
        self.assertIn('action', item)
        self.assertIn('model_name', item)
        self.assertIn('created_at', item)
