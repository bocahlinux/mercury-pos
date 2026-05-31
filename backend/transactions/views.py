from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.http import HttpResponse
from .models import Transaction
from .serializers import (
    TransactionListSerializer, TransactionDetailSerializer,
    TransactionCreateSerializer, ReceiptSerializer,
)
from .utils import generate_invoice_number
from .filters import TransactionFilter


class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all().select_related('customer', 'cashier').prefetch_related('items')
    filter_backends = [DjangoFilterBackend]
    filterset_class = TransactionFilter

    def get_serializer_class(self):
        if self.action == 'list':
            return TransactionListSerializer
        if self.action == 'retrieve':
            return TransactionDetailSerializer
        if self.action == 'create':
            return TransactionCreateSerializer
        if self.action == 'receipt':
            return ReceiptSerializer
        return TransactionDetailSerializer

    def perform_create(self, serializer):
        invoice = generate_invoice_number()
        serializer.save(cashier=self.request.user, invoice_number=invoice)

    @action(detail=True, methods=['get'])
    def receipt(self, request, pk=None):
        """Get receipt data for a transaction"""
        txn = self.get_object()
        serializer = ReceiptSerializer(txn)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def hold(self, request, pk=None):
        txn = self.get_object()
        txn.status = Transaction.Status.HOLD
        txn.save(update_fields=['status'])
        return Response({'status': 'held'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        txn = self.get_object()
        txn.status = Transaction.Status.CANCELLED
        txn.save(update_fields=['status'])
        return Response({'status': 'cancelled'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def refund(self, request, pk=None):
        txn = self.get_object()
        txn.status = Transaction.Status.REFUNDED
        txn.save(update_fields=['status'])
        return Response({'status': 'refunded'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='download-pdf')
    def download_pdf(self, request, pk=None):
        """Download receipt as PDF"""
        txn = self.get_object()
        from .utils import receipt_pdf_response
        return receipt_pdf_response(txn)
