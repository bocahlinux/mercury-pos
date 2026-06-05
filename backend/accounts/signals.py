from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import AuditLog


@receiver(post_save, sender=AuditLog)
def noop_audit_log_save(sender, instance, created, **kwargs):
    """Prevent recursive logging of AuditLog itself."""
    pass
