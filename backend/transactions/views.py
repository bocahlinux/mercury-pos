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

    def create(self, request, *args, **kwargs):
        """Create transaction and return receipt data"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        txn = self.perform_create(serializer)
        # Refresh to load related items created in serializer
        txn.refresh_from_db()
        # Return receipt data using ReceiptSerializer
        receipt_serializer = ReceiptSerializer(txn)
        return Response(receipt_serializer.data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        invoice = generate_invoice_number()
        return serializer.save(cashier=self.request.user, invoice_number=invoice)

    @action(detail=True, methods=['get'])
    def receipt(self, request, pk=None):
        """Get receipt data for a transaction"""
        txn = self.get_object()
        serializer = ReceiptSerializer(txn)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def hold(self, request, pk=None):
        """Hold a transaction (pause)"""
        txn = self.get_object()
        if txn.status not in (Transaction.Status.COMPLETED, Transaction.Status.HOLD):
            return Response({'detail': f'Cannot hold transaction with status "{txn.status}"'}, status=status.HTTP_400_BAD_REQUEST)
        txn.status = Transaction.Status.HOLD
        txn.save(update_fields=['status'])
        return Response({'status': 'held'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        """Resume a held transaction back to completed"""
        txn = self.get_object()
        if txn.status != Transaction.Status.HOLD:
            return Response({'detail': f'Cannot resume transaction with status "{txn.status}"'}, status=status.HTTP_400_BAD_REQUEST)
        txn.status = Transaction.Status.COMPLETED
        txn.save(update_fields=['status'])
        return Response({'status': 'resumed'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel transaction and restore stock"""
        txn = self.get_object()
        if txn.status == Transaction.Status.CANCELLED:
            return Response({'detail': 'Transaction already cancelled'}, status=status.HTTP_400_BAD_REQUEST)
        if txn.status == Transaction.Status.REFUNDED:
            return Response({'detail': 'Cannot cancel a refunded transaction'}, status=status.HTTP_400_BAD_REQUEST)
        # Restore stock for each item before cancelling
        for item in txn.items.all():
            product = item.product
            product.stock += item.quantity
            product.save(update_fields=['stock'])
            # Log stock movement
            from products.models import StockMovement
            StockMovement.objects.create(
                product=product,
                variant=item.variant,
                type='in',
                quantity=item.quantity,
                reference=f'Cancel {txn.invoice_number}',
                notes=f'Transaction cancelled',
                created_by=txn.cashier,
            )
        txn.status = Transaction.Status.CANCELLED
        txn.save(update_fields=['status'])
        return Response({'status': 'cancelled'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def refund(self, request, pk=None):
        """Refund transaction: restore stock + optional reason"""
        txn = self.get_object()
        if txn.status == Transaction.Status.REFUNDED:
            return Response({'detail': 'Transaction already refunded'}, status=status.HTTP_400_BAD_REQUEST)
        if txn.status == Transaction.Status.CANCELLED:
            return Response({'detail': 'Cannot refund a cancelled transaction'}, status=status.HTTP_400_BAD_REQUEST)
        # Optional refund reason
        reason = request.data.get('reason', 'Refund')
        # Restore stock for each item
        for item in txn.items.all():
            product = item.product
            product.stock += item.quantity
            product.save(update_fields=['stock'])
            # Log stock movement
            from products.models import StockMovement
            StockMovement.objects.create(
                product=product,
                variant=item.variant,
                type='in',
                quantity=item.quantity,
                reference=f'Refund {txn.invoice_number}',
                notes=reason,
                created_by=txn.cashier,
            )
        txn.status = Transaction.Status.REFUNDED
        txn.notes = f"{txn.notes or ''}\n[REFUND: {reason}]".strip()
        txn.save(update_fields=['status', 'notes'])
        return Response({'status': 'refunded', 'reason': reason}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='download-pdf')
    def download_pdf(self, request, pk=None):
        """Download receipt as PDF"""
        txn = self.get_object()
        from .utils import receipt_pdf_response
        return receipt_pdf_response(txn)
