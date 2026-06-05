from django.test import TestCase, RequestFactory
from accounts.models import User, AuditLog
from accounts.audit import (
    audit_create, audit_update, audit_delete,
    audit_login, audit_logout,
    audit_role_change, audit_activate, audit_deactivate,
    audit_export, audit_pdf_generate,
    _get_client_ip,
)


class AuditHelperTest(TestCase):
    """Test audit helper functions create correct AuditLog entries."""

    def setUp(self):
        self.user = User.objects.create_user(
            email='auditor@example.com', password='pass12345', role='owner'
        )
        self.target_user = User.objects.create_user(
            email='target@example.com', password='pass12345', role='kasir'
        )
        self.factory = RequestFactory()

    def test_audit_create(self):
        audit_create(self.user, self.target_user)
        log = AuditLog.objects.get(action='create')
        self.assertEqual(log.user, self.user)
        self.assertEqual(log.model_name, 'User')
        self.assertIn('Created', log.detail)

    def test_audit_update(self):
        audit_update(self.user, self.target_user, detail='Changed email')
        log = AuditLog.objects.get(action='update')
        self.assertEqual(log.detail, 'Changed email')
        self.assertEqual(log.object_id, str(self.target_user.pk))

    def test_audit_delete(self):
        audit_delete(self.user, self.target_user)
        log = AuditLog.objects.get(action='delete')
        self.assertEqual(log.model_name, 'User')
        self.assertIn('Deleted', log.detail)

    def test_audit_login(self):
        audit_login(self.user)
        log = AuditLog.objects.get(action='login')
        self.assertEqual(log.user, self.user)
        self.assertIn('logged in', log.detail)

    def test_audit_logout(self):
        audit_logout(self.user)
        log = AuditLog.objects.get(action='logout')
        self.assertEqual(log.user, self.user)

    def test_audit_role_change(self):
        audit_role_change(self.user, self.target_user, 'kasir', 'admin')
        log = AuditLog.objects.get(action='role_change')
        self.assertEqual(log.user, self.user)
        self.assertIn('kasir', log.detail)
        self.assertIn('admin', log.detail)

    def test_audit_activate(self):
        audit_activate(self.user, self.target_user)
        log = AuditLog.objects.get(action='activate')
        self.assertIn('Activated', log.detail)

    def test_audit_deactivate(self):
        audit_deactivate(self.user, self.target_user)
        log = AuditLog.objects.get(action='deactivate')
        self.assertIn('Deactivated', log.detail)

    def test_audit_export(self):
        audit_export(self.user, 'Product')
        log = AuditLog.objects.get(action='export')
        self.assertIn('Product', log.detail)

    def test_audit_pdf_generate(self):
        audit_pdf_generate(self.user, self.target_user)
        log = AuditLog.objects.get(action='pdf_generate')
        self.assertIn('PDF', log.detail)

    def test_audit_with_request_ip(self):
        request = self.factory.get('/')
        request.META['REMOTE_ADDR'] = '192.168.1.100'
        audit_login(self.user, request=request)
        log = AuditLog.objects.get(action='login')
        self.assertEqual(log.ip_address, '192.168.1.100')

    def test_audit_with_x_forwarded_for(self):
        request = self.factory.get('/')
        request.META['HTTP_X_FORWARDED_FOR'] = '10.0.0.1, 10.0.0.2'
        ip = _get_client_ip(request)
        self.assertEqual(ip, '10.0.0.1')

    def test_audit_with_no_request(self):
        """audit_* should work without a request (ip_address=None)."""
        audit_login(self.user, request=None)
        log = AuditLog.objects.get(action='login')
        self.assertIsNone(log.ip_address)

    def test_audit_with_anonymous_user(self):
        """Anonymous users should not create audit logs (user=None)."""
        from django.contrib.auth.models import AnonymousUser
        anon = AnonymousUser()
        initial_count = AuditLog.objects.count()
        audit_login(anon)
        # Should not create a log for anonymous
        self.assertEqual(AuditLog.objects.count(), initial_count)

    def test_audit_log_truncates_long_detail(self):
        """Detail longer than 500 chars should be truncated."""
        long_detail = 'x' * 600
        audit_update(self.user, self.target_user, detail=long_detail)
        log = AuditLog.objects.get(action='update')
        self.assertLessEqual(len(log.detail), 500)

    def test_audit_log_truncates_long_object_repr(self):
        """Object repr longer than 255 chars should be truncated."""
        self.target_user.email = 'a' * 300 + '@test.com'
        audit_create(self.user, self.target_user)
        log = AuditLog.objects.get(action='create')
        self.assertLessEqual(len(log.object_repr), 255)


class AuditLogModelTest(TestCase):
    """Test AuditLog model directly."""

    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com', password='pass12345'
        )

    def test_create_audit_log(self):
        log = AuditLog.objects.create(
            user=self.user,
            action='create',
            model_name='Product',
            object_id='42',
            object_repr='Test Product',
            detail='Created Test Product',
            ip_address='127.0.0.1',
        )
        self.assertEqual(log.action, 'create')
        self.assertEqual(log.model_name, 'Product')
        self.assertEqual(log.object_id, '42')
        self.assertEqual(log.ip_address, '127.0.0.1')

    def test_audit_log_str(self):
        log = AuditLog.objects.create(
            user=self.user,
            action='create',
            model_name='Product',
        )
        s = str(log)
        self.assertIn('create', s)
        self.assertIn('Product', s)

    def test_audit_log_ordering(self):
        """Most recent first."""
        log1 = AuditLog.objects.create(user=self.user, action='create', model_name='A')
        log2 = AuditLog.objects.create(user=self.user, action='update', model_name='B')
        logs = list(AuditLog.objects.all())
        self.assertEqual(logs[0], log2)
        self.assertEqual(logs[1], log1)

    def test_audit_log_user_null_on_delete(self):
        """When user is deleted, audit log should remain with user=None."""
        log = AuditLog.objects.create(
            user=self.user, action='create', model_name='X'
        )
        self.user.delete()
        log.refresh_from_db()
        self.assertIsNone(log.user)

    def test_audit_log_action_choices(self):
        """All action types should be valid."""
        for action_value, _ in AuditLog.ActionType.choices:
            log = AuditLog.objects.create(
                user=self.user, action=action_value, model_name='Test'
            )
            self.assertEqual(log.action, action_value)

    def test_audit_log_no_recursive_logging(self):
        """AuditLog post_save signal should be a no-op (no recursive log)."""
        initial_count = AuditLog.objects.count()
        log = AuditLog.objects.create(
            user=self.user, action='create', model_name='Test'
        )
        # Only 1 log should exist (the one we created), not 2
        self.assertEqual(AuditLog.objects.count(), initial_count + 1)
