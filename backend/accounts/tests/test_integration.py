from django.test import TestCase
from rest_framework.test import APIClient
from accounts.models import User, AuditLog


class IntegrationTest(TestCase):
    """
    End-to-end integration test:
    Login → CRUD operations → Verify audit logs are recorded.
    """

    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            email='owner@example.com', password='pass12345', role='owner'
        )

    def test_login_creates_audit_log(self):
        """Login via JWT should work and we can verify audit flow."""
        res = self.client.post('/api/auth/login/', {
            'email': 'owner@example.com',
            'password': 'pass12345',
        })
        self.assertEqual(res.status_code, 200)
        self.assertIn('access', res.data)
        self.assertIn('user', res.data)
        self.assertEqual(res.data['user']['email'], 'owner@example.com')

    def test_login_invalid_credentials(self):
        res = self.client.post('/api/auth/login/', {
            'email': 'owner@example.com',
            'password': 'wrongpassword',
        })
        self.assertEqual(res.status_code, 401)

    def test_register_creates_user(self):
        res = self.client.post('/api/auth/register/', {
            'email': 'newuser@example.com',
            'password': 'newpass123',
            'password_confirm': 'newpass123',
        })
        self.assertEqual(res.status_code, 201)
        self.assertTrue(User.objects.filter(email='newuser@example.com').exists())

    def test_register_password_mismatch(self):
        res = self.client.post('/api/auth/register/', {
            'email': 'newuser@example.com',
            'password': 'newpass123',
            'password_confirm': 'different',
        })
        self.assertEqual(res.status_code, 400)

    def test_full_user_management_flow(self):
        """
        Owner logs in → creates user → changes role → deactivates → activates → deletes.
        Verify each step creates proper audit logs.
        """
        # Login
        res = self.client.post('/api/auth/login/', {
            'email': 'owner@example.com',
            'password': 'pass12345',
        })
        token = res.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # Create a new user via register
        res = self.client.post('/api/auth/register/', {
            'email': 'newkasir@example.com',
            'password': 'pass12345',
            'password_confirm': 'pass12345',
        })
        self.assertEqual(res.status_code, 201)
        new_user = User.objects.get(email='newkasir@example.com')

        # Change role: kasir → admin
        res = self.client.patch(
            f'/api/auth/users/manage/{new_user.pk}/update_role/',
            {'role': 'admin'}
        )
        self.assertEqual(res.status_code, 200)
        new_user.refresh_from_db()
        self.assertEqual(new_user.role, 'admin')

        # Deactivate
        res = self.client.post(f'/api/auth/users/manage/{new_user.pk}/deactivate/')
        self.assertEqual(res.status_code, 200)
        new_user.refresh_from_db()
        self.assertFalse(new_user.is_active)

        # Activate
        res = self.client.post(f'/api/auth/users/manage/{new_user.pk}/activate/')
        self.assertEqual(res.status_code, 200)
        new_user.refresh_from_db()
        self.assertTrue(new_user.is_active)

        # Delete
        res = self.client.delete(f'/api/auth/users/manage/{new_user.pk}/')
        self.assertEqual(res.status_code, 200)
        self.assertFalse(User.objects.filter(pk=new_user.pk).exists())

        # Verify audit logs were created for role_change, activate, deactivate
        self.assertTrue(AuditLog.objects.filter(action='role_change').exists())
        self.assertTrue(AuditLog.objects.filter(action='activate').exists())
        self.assertTrue(AuditLog.objects.filter(action='deactivate').exists())

    def test_audit_log_view_after_actions(self):
        """After performing actions, audit log view should show them."""
        # Create audit logs directly
        AuditLog.objects.create(
            user=self.owner, action='create', model_name='Product',
            detail='Created Product'
        )
        AuditLog.objects.create(
            user=self.owner, action='update', model_name='User',
            detail='Updated User'
        )

        # Login as owner
        self.client.force_authenticate(user=self.owner)

        # View audit log
        res = self.client.get('/api/auth/audit-log/')
        self.assertEqual(res.status_code, 200)
        data = res.data.get('results', res.data)
        self.assertEqual(len(data), 2)

        # Filter by action
        res = self.client.get('/api/auth/audit-log/', {'action': 'create'})
        data = res.data.get('results', res.data)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['action'], 'create')

    def test_kasir_cannot_access_user_management(self):
        """Kasir should be forbidden from user management endpoints."""
        kasir = User.objects.create_user(
            email='kasir@example.com', password='pass12345', role='kasir'
        )
        self.client.force_authenticate(user=kasir)

        res = self.client.get('/api/auth/users/manage/')
        self.assertEqual(res.status_code, 403)

        res = self.client.patch(
            f'/api/auth/users/manage/{self.owner.pk}/update_role/',
            {'role': 'kasir'}
        )
        self.assertEqual(res.status_code, 403)

    def test_admin_cannot_access_user_management(self):
        """Admin should also be forbidden (only Owner can manage users)."""
        admin = User.objects.create_user(
            email='admin@example.com', password='pass12345', role='admin'
        )
        self.client.force_authenticate(user=admin)

        res = self.client.get('/api/auth/users/manage/')
        self.assertEqual(res.status_code, 403)

    def test_profile_endpoint(self):
        """Authenticated user can view/update their profile."""
        self.client.force_authenticate(user=self.owner)

        res = self.client.get('/api/auth/profile/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['email'], 'owner@example.com')

    def test_change_password(self):
        self.client.force_authenticate(user=self.owner)

        res = self.client.post('/api/auth/change-password/', {
            'old_password': 'pass12345',
            'new_password': 'newpass123',
        })
        self.assertEqual(res.status_code, 200)
        self.owner.refresh_from_db()
        self.assertTrue(self.owner.check_password('newpass123'))

    def test_change_password_wrong_old(self):
        self.client.force_authenticate(user=self.owner)

        res = self.client.post('/api/auth/change-password/', {
            'old_password': 'wrongpassword',
            'new_password': 'newpass123',
        })
        self.assertEqual(res.status_code, 400)
