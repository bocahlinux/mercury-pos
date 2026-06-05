import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils.encoding import force_str

logger = logging.getLogger(__name__)

# Models to audit — mapped to their app_label
_AUDIT_MODELS = {}


def _get_client_ip(request):
    """Extract client IP from request, handling proxies."""
    if request is None:
        return None
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def _log_action(user, action, instance, detail='', request=None):
    """Create an AuditLog entry. Safe to call from anywhere."""
    from .models import AuditLog

    if user is None or (hasattr(user, 'is_authenticated') and not user.is_authenticated):
        return  # Don't log anonymous/unauthenticated actions

    ip = _get_client_ip(request) if request else None

    try:
        AuditLog.objects.create(
            user=user,
            action=action,
            model_name=instance.__class__.__name__,
            object_id=str(instance.pk) if instance.pk else '',
            object_repr=force_str(instance)[:255],
            detail=detail[:500] if detail else '',
            ip_address=ip,
        )
    except Exception as e:
        logger.error(f"AuditLog create failed: {e}")


def audit_create(user, instance, request=None, detail=''):
    _log_action(user, 'create', instance, detail or f'Created {instance.__class__.__name__}', request)


def audit_update(user, instance, request=None, detail=''):
    _log_action(user, 'update', instance, detail or f'Updated {instance.__class__.__name__}', request)


def audit_delete(user, instance, request=None, detail=''):
    _log_action(user, 'delete', instance, detail or f'Deleted {instance.__class__.__name__}', request)


def audit_login(user, request=None, detail=''):
    _log_action(user, 'login', user, detail or 'User logged in', request)


def audit_logout(user, request=None, detail=''):
    _log_action(user, 'logout', user, detail or 'User logged out', request)


def audit_role_change(user, target_user, old_role, new_role, request=None):
    detail = f'Role changed from {old_role} to {new_role} for {target_user.email}'
    _log_action(user, 'role_change', target_user, detail, request)


def audit_activate(user, target_user, request=None):
    _log_action(user, 'activate', target_user, f'Activated user {target_user.email}', request)


def audit_deactivate(user, target_user, request=None):
    _log_action(user, 'deactivate', target_user, f'Deactivated user {target_user.email}', request)


def audit_export(user, model_name, request=None, detail=''):
    from .models import AuditLog
    from django.contrib.auth import get_user_model
    User = get_user_model()
    # Create a dummy instance for the log
    dummy = User(email=f'export@{model_name.lower()}')
    _log_action(user, 'export', dummy, detail or f'Exported {model_name} report', request)


def audit_pdf_generate(user, instance, request=None):
    _log_action(user, 'pdf_generate', instance, f'Generated PDF for {instance}', request)
