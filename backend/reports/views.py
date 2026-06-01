from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Sum, Count, F, Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from transactions.models import Transaction, TransactionItem
from products.models import Product


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)

        # Today's stats
        today_tx = Transaction.objects.filter(
            status='completed',
            created_at__date=today
        )
        today_sales = today_tx.aggregate(total=Sum('total'))['total'] or 0
        today_count = today_tx.count()

        # Week stats
        week_tx = Transaction.objects.filter(
            status='completed',
            created_at__date__gte=week_start
        )
        week_sales = week_tx.aggregate(total=Sum('total'))['total'] or 0

        # Month stats
        month_tx = Transaction.objects.filter(
            status='completed',
            created_at__date__gte=month_start
        )
        month_sales = month_tx.aggregate(total=Sum('total'))['total'] or 0

        # Top products
        top_products = TransactionItem.objects.filter(
            transaction__status='completed',
            transaction__created_at__date__gte=month_start
        ).values('product__name').annotate(
            total_sold=Sum('quantity'),
            revenue=Sum('subtotal')
        ).order_by('-total_sold')[:5]

        # Recent transactions
        recent = Transaction.objects.select_related('cashier', 'customer').order_by('-created_at')[:10]
        recent_data = [{
            'id': t.id,
            'invoice_number': t.invoice_number,
            'total': t.total,
            'status': t.status,
            'cashier': t.cashier.email,
            'customer_name': t.customer.name if t.customer else '-',
            'created_at': t.created_at,
        } for t in recent]

        return Response({
            'today_sales': today_sales,
            'today_transactions': today_count,
            'week_sales': week_sales,
            'month_sales': month_sales,
            'top_products': list(top_products),
            'recent_transactions': recent_data,
        })


class SalesReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        period = request.query_params.get('period', 'daily')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        qs = Transaction.objects.filter(status='completed')

        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        if period == 'daily':
            data = qs.extra({'date': "DATE(created_at)"}).values('date').annotate(
                total_sales=Sum('total'),
                transaction_count=Count('id'),
            ).order_by('date')
        elif period == 'weekly':
            data = qs.extra({'week': "EXTRACT(WEEK FROM created_at)", 'year': "EXTRACT(YEAR FROM created_at)"}).values('year', 'week').annotate(
                total_sales=Sum('total'),
                transaction_count=Count('id'),
            ).order_by('year', 'week')
        elif period == 'monthly':
            data = qs.extra({'month': "EXTRACT(MONTH FROM created_at)", 'year': "EXTRACT(YEAR FROM created_at)"}).values('year', 'month').annotate(
                total_sales=Sum('total'),
                transaction_count=Count('id'),
            ).order_by('year', 'month')
        elif period == 'yearly':
            data = qs.extra({'year': "EXTRACT(YEAR FROM created_at)"}).values('year').annotate(
                total_sales=Sum('total'),
                transaction_count=Count('id'),
            ).order_by('year')
        else:
            return Response({'error': 'Invalid period. Use: daily, weekly, monthly, yearly'}, status=400)

        # Summary
        summary = {
            'total_sales': qs.aggregate(total=Sum('total'))['total'] or 0,
            'total_transactions': qs.count(),
            'average_transaction': 0,
        }
        if summary['total_transactions'] > 0:
            summary['average_transaction'] = summary['total_sales'] / summary['total_transactions']

        return Response({
            'period': period,
            'summary': summary,
            'data': list(data),
        })


class ProductReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        items = TransactionItem.objects.filter(transaction__status='completed')

        if date_from:
            items = items.filter(transaction__created_at__date__gte=date_from)
        if date_to:
            items = items.filter(transaction__created_at__date__lte=date_to)

        report = items.values('product__name', 'product__sku').annotate(
            total_sold=Sum('quantity'),
            revenue=Sum('subtotal'),
            avg_price=Sum('subtotal') / Sum('quantity'),
        ).order_by('-total_sold')

        return Response({'data': list(report)})
