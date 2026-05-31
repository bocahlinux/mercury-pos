from django.contrib import admin
from .models import Transaction, TransactionItem

class TransactionItemInline(admin.TabularInline):
    model = TransactionItem
    extra = 0
    readonly_fields = ['subtotal']

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'customer', 'cashier', 'total', 'status', 'created_at')
    list_filter = ('status', 'payment_method')
    search_fields = ('invoice_number',)
    inlines = [TransactionItemInline]
