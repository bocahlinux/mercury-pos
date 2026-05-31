from django.db import models


class StoreSettings(models.Model):
    name = models.CharField(max_length=200, default='Mercury POS Store')
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    logo = models.ImageField(upload_to='store/', blank=True, null=True)
    tax_percent = models.DecimalField(max_digits=5, decimal_places=2, default=11.00)
    currency = models.CharField(max_length=10, default='IDR')
    receipt_header = models.TextField(blank=True)
    receipt_footer = models.TextField(blank=True, default='Terima kasih telah berbelanja!')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Store Settings'
        verbose_name_plural = 'Store Settings'

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.pk and StoreSettings.objects.exists():
            self.pk = StoreSettings.objects.first().pk
        super().save(*args, **kwargs)
