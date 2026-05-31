from django.test import TestCase
from accounts.models import User


class UserModelTest(TestCase):
    def test_create_user(self):
        user = User.objects.create_user(email='test@example.com', password='testpass123')
        self.assertEqual(user.email, 'test@example.com')
        self.assertTrue(user.check_password('testpass123'))
        self.assertEqual(user.role, 'kasir')

    def test_create_superuser(self):
        user = User.objects.create_superuser(email='admin@example.com', password='admin123')
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.is_staff)

    def test_user_str(self):
        user = User.objects.create_user(email='test@example.com', password='testpass123')
        self.assertEqual(str(user), 'test@example.com')
