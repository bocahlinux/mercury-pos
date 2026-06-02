import io
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Sum, Count, F, Q, Avg
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from transactions.models import Transaction, TransactionItem
from products.models import Product, Category
from customers.models import Customer
from invoices.models import Invoice

try:
    import openpyxl
    HAS_OPENPYXL = True
except ImportError:
    HAS_OPENPYXL = False


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)

        # --- Today stats ---
        today_tx = Transaction.objects.filter(status='completed', created_at__date=today)
        today_sales = today_tx.aggregate(total=Sum('total'))['total'] or 0
        today_count = today_tx.count()

        # --- Yesterday comparison ---
        yesterday = today - timedelta(days=1)
        yesterday_tx = Transaction.objects.filter(status='completed', created_at__date=yesterday)
        yesterday_sales = yesterday_tx.aggregate(total=Sum('total'))['total'] or 0
        sales_change_pct = 0
        if yesterday_sales > 0:
            sales_change_pct = ((today_sales - yesterday_sales) / yesterday_sales) * 100

        # --- Week stats ---
        week_tx = Transaction.objects.filter(status='completed', created_at__date__gte=week_start)
        week_sales = week_tx.aggregate(total=Sum('total'))['total'] or 0
        last_week_start = week_start - timedelta(weeks=1)
        last_week_tx = Transaction.objects.filter(status='completed', created_at__date__gte=last_week_start, created_at__date__lt=week_start)
        last_week_sales = last_week_tx.aggregate(total=Sum('total'))['total'] or 0
        week_change_pct = 0
        if last_week_sales > 0:
            week_change_pct = ((week_sales - last_week_sales) / last_week_sales) * 100

        # --- Month stats ---
        month_tx = Transaction.objects.filter(status='completed', created_at__date__gte=month_start)
        month_sales = month_tx.aggregate(total=Sum('total'))['total'] or 0
        prev_month_start = (month_start - timedelta(days=1)).replace(day=1)
        prev_month_end = month_start - timedelta(days=1)
        prev_month_tx = Transaction.objects.filter(status='completed', created_at__date__gte=prev_month_start, created_at__date__lte=prev_month_end)
        prev_month_sales = prev_month_tx.aggregate(total=Sum('total'))['total'] or 0
        month_change_pct = 0
        if prev_month_sales > 0:
            month_change_pct = ((month_sales - prev_month_sales) / prev_month_sales) * 100

        # --- Top products (month) ---
        top_products = TransactionItem.objects.filter(
            transaction__status='completed',
            transaction__created_at__date__gte=month_start
        ).values('product__name').annotate(
            total_sold=Sum('quantity'),
            revenue=Sum('subtotal')
        ).order_by('-total_sold')[:5]

        # --- Payment method breakdown (month) ---
        payment_breakdown = Transaction.objects.filter(
            status='completed',
            created_at__date__gte=month_start
        ).values('payment_method').annotate(
            total=Sum('total'),
            count=Count('id')
        ).order_by('-total')

        # --- Category sales breakdown (month) ---
        category_breakdown = TransactionItem.objects.filter(
            transaction__status='completed',
            transaction__created_at__date__gte=month_start
        ).values('product__category__name').annotate(
            total_sold=Sum('quantity'),
            revenue=Sum('subtotal')
        ).order_by('-revenue')

        # --- Low stock alerts ---
        low_stock_count = Product.objects.filter(is_active=True, stock__lte=F('min_stock_alert')).count()
        low_stock_products = Product.objects.filter(is_active=True, stock__lte=F('min_stock_alert')).values('name', 'stock', 'min_stock_alert')[:5]

        # --- Recent transactions ---
        recent = Transaction.objects.select_related('cashier', 'customer').order_by('-created_at')[:10]
        recent_data = [
            {
                'id': t.id,
                'invoice_number': t.invoice_number,
                'total': t.total,
                'status': t.status,
                'cashier': t.cashier.email,
                'customer_name': t.customer.name if t.customer else '-',
                'created_at': t.created_at,
            } for t in recent
        ]

        # --- Recent invoices ---
        recent_invoices = Invoice.objects.select_related('transaction__customer').order_by('-created_at')[:5]
        recent_invoice_data = [
            {
                'id': inv.id,
                'invoice_number': inv.invoice_number,
                'status': inv.status,
                'total': inv.transaction.total if inv.transaction else 0,
                'customer_name': inv.transaction.customer.name if inv.transaction and inv.transaction.customer else '-',
                'issued_date': inv.issued_date,
            } for inv in recent_invoices
        ]

        # --- Sales trend (last 7 days) ---
        seven_days_ago = today - timedelta(days=6)
        sales_trend_qs = Transaction.objects.filter(
            status='completed',
            created_at__date__gte=seven_days_ago,
            created_at__date__lte=today
        ).extra({
            'sale_date': "DATE(created_at)"
        }).values('sale_date').annotate(
            total_sales=Sum('total')
        ).order_by('sale_date')
        # Build a map for missing dates
        sales_trend_map = {item['sale_date']: item['total_sales'] or 0 for item in sales_trend_qs}
        sales_trend = []
        for i in range(7):
            day = seven_days_ago + timedelta(days=i)
            sales_trend.append({
                'date': str(day),
                'total_sales': sales_trend_map.get(day, 0)
            })

        return Response({
            'period': {
                'today': str(today),
                'week_start': str(week_start),
                'month_start': str(month_start),
            },
            'summary': {
                'today_sales': today_sales,
                'today_transactions': today_count,
                'week_sales': week_sales,
                'month_sales': month_sales,
            },
            'comparison': {
                'sales_change_pct': round(sales_change_pct, 1),
                'week_change_pct': round(week_change_pct, 1),
                'month_change_pct': round(month_change_pct, 1),
                'yesterday_sales': yesterday_sales,
                'last_week_sales': last_week_sales,
                'prev_month_sales': prev_month_sales,
            },
            'top_products': list(top_products),
            'payment_breakdown': list(payment_breakdown),
            'category_breakdown': list(category_breakdown),
            'low_stock': {
                'count': low_stock_count,
                'products': list(low_stock_products),
            },
            'recent_transactions': recent_data,
            'recent_invoices': recent_invoice_data,
            'sales_trend': sales_trend,
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


class CustomerReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        customers = Customer.objects.all()

        if date_from:
            customers = customers.filter(created_at__date__gte=date_from)
        if date_to:
            customers = customers.filter(created_at__date__lte=date_to)

        report = []
        for c in customers:
            tx_qs = Transaction.objects.filter(customer=c, status='completed')
            if date_from:
                tx_qs = tx_qs.filter(created_at__date__gte=date_from)
            if date_to:
                tx_qs = tx_qs.filter(created_at__date__lte=date_to)
            agg = tx_qs.aggregate(total_spent=Sum('total'), order_count=Count('id'))
            report.append({
                'id': c.id,
                'name': c.name,
                'email': c.email,
                'phone': c.phone,
                'total_spent': agg['total_spent'] or 0,
                'order_count': agg['order_count'] or 0,
            })

        report.sort(key=lambda x: x['total_spent'], reverse=True)
        return Response({'data': report})


def _build_excel(title: str, headers: list, rows: list):
    """Helper to build an XLSX file in memory. Returns (HttpResponse, None) or (False, None)."""
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = title
    ws.append(headers)
    for row in rows:
        ws.append(row)
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    filename = f"{title.lower().replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    resp = HttpResponse(buf.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    resp['Content-Disposition'] = f'attachment; filename={filename}'
    return resp


class SalesReportExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not HAS_OPENPYXL:
            return Response({'error': 'openpyxl not installed. Run: pip install openpyxl'}, status=501)

        period = request.query_params.get('period', 'daily')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        qs = Transaction.objects.filter(status='completed')
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        data = qs.extra({'date': "DATE(created_at)"}).values('date').annotate(
            total_sales=Sum('total'),
            transaction_count=Count('id'),
        ).order_by('date')

        headers = ['Date', 'Total Sales', 'Transaction Count']
        rows = [[str(d['date']), float(d['total_sales'] or 0), d['transaction_count']] for d in data]
        return _build_excel('Sales Report', headers, rows)


class ProductReportExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not HAS_OPENPYXL:
            return Response({'error': 'openpyxl not installed. Run: pip install openpyxl'}, status=501)

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
        ).order_by('-total_sold')

        headers = ['Product', 'SKU', 'Total Sold', 'Revenue']
        rows = [[d['product__name'], d['product__sku'] or '', d['total_sold'], float(d['revenue'] or 0)] for d in report]
        return _build_excel('Product Report', headers, rows)


class CustomerReportExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not HAS_OPENPYXL:
            return Response({'error': 'openpyxl not installed. Run: pip install openpyxl'}, status=501)

        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        customers = Customer.objects.all()
        rows = []
        for c in customers:
            tx_qs = Transaction.objects.filter(customer=c, status='completed')
            if date_from:
                tx_qs = tx_qs.filter(created_at__date__gte=date_from)
            if date_to:
                tx_qs = tx_qs.filter(created_at__date__lte=date_to)
            agg = tx_qs.aggregate(total_spent=Sum('total'), order_count=Count('id'))
            if agg['order_count']:
                rows.append([c.name, c.email or '', c.phone or '', float(agg['total_spent'] or 0), agg['order_count']])

        headers = ['Name', 'Email', 'Phone', 'Total Spent', 'Order Count']
        return _build_excel('Customer Report', headers, rows)