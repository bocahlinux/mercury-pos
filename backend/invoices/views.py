from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
import django_filters.rest_framework

from .models import Invoice
from .serializers import InvoiceSerializer, InvoiceCreateSerializer
from .utils import generate_pdf_invoice
from .filters import InvoiceFilter


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().select_related('transaction', 'transaction__customer')
    serializer_class = InvoiceSerializer
    filter_backends = [django_filters.rest_framework.DjangoFilterBackend]
    filterset_class = InvoiceFilter

    def get_serializer_class(self):
        if self.action == 'create':
            return InvoiceCreateSerializer
        return InvoiceSerializer

    @action(detail=True, methods=['post'])
    def generate_pdf(self, request, pk=None):
        invoice = self.get_object()
        generate_pdf_invoice(invoice)
        invoice.refresh_from_db()
        return Response({'detail': 'PDF generated', 'pdf_url': invoice.pdf_file.url if invoice.pdf_file else None}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        invoice = self.get_object()
        if invoice.status == Invoice.Status.CANCELLED:
            return Response({'detail': 'Cannot mark cancelled invoice as paid'}, status=status.HTTP_400_BAD_REQUEST)
        invoice.status = Invoice.Status.PAID
        invoice.save(update_fields=['status'])
        return Response({'detail': 'Invoice marked as paid', 'status': invoice.status}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        invoice = self.get_object()
        if invoice.status == Invoice.Status.PAID:
            return Response({'detail': 'Cannot cancel a paid invoice'}, status=status.HTTP_400_BAD_REQUEST)
        invoice.status = Invoice.Status.CANCELLED
        invoice.save(update_fields=['status'])
        return Response({'detail': 'Invoice cancelled', 'status': invoice.status}, status=status.HTTP_200_OK)
