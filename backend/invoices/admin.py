from django.contrib import admin
from .models import Invoice

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'status', 'issued_date', 'due_date', 'created_at')
    search_fields = ('invoice_number',)
    list_filter = ('status', 'issued_date')
