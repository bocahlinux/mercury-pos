import datetime
from django.db import models

from .models import Transaction


def generate_invoice_number():
    """Generate unique invoice number: INV-YYYYMMDD-XXXX"""
    today = datetime.date.today()
    prefix = f"INV-{today.strftime('%Y%m%d')}"
    # count existing for today
    count = Transaction.objects.filter(invoice_number__startswith=prefix).count() + 1
    suffix = f"{count:04d}"
    return f"{prefix}-{suffix}"
