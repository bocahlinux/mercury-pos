import io
import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from django.http import HttpResponse

from .models import Transaction


def generate_invoice_number():
    """Generate unique invoice number: INV-YYYYMMDD-XXXX"""
    today = datetime.date.today()
    prefix = f"INV-{today.strftime('%Y%m%d')}"
    count = Transaction.objects.filter(invoice_number__startswith=prefix).count() + 1
    suffix = f"{count:04d}"
    return f"{prefix}-{suffix}"


RECEIPT_WIDTH = 80 * mm


def generate_receipt_pdf(transaction):
    """Generate a thermal-printer-friendly receipt PDF."""
    buffer = io.BytesIO()

    # Use a narrow page for thermal printer (80mm)
    doc = SimpleDocTemplate(
        buffer,
        pagesize=(RECEIPT_WIDTH, 200 * mm),
        leftMargin=5 * mm,
        rightMargin=5 * mm,
        topMargin=5 * mm,
        bottomMargin=5 * mm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'ReceiptTitle', parent=styles['Normal'],
        fontSize=14, alignment=1, spaceAfter=2 * mm,
        fontName='Helvetica-Bold',
    )
    normal_style = ParagraphStyle(
        'ReceiptNormal', parent=styles['Normal'],
        fontSize=8, fontName='Helvetica',
    )
    bold_style = ParagraphStyle(
        'ReceiptBold', parent=styles['Normal'],
        fontSize=8, fontName='Helvetica-Bold',
    )
    center_style = ParagraphStyle(
        'ReceiptCenter', parent=styles['Normal'],
        fontSize=8, alignment=1, fontName='Helvetica',
    )
    divider_style = ParagraphStyle(
        'Divider', parent=styles['Normal'],
        fontSize=8, alignment=1, fontName='Helvetica',
    )

    elements = []

    # Store header
    elements.append(Paragraph(transaction.invoice_number or 'RECEIPT', title_style))

    # Store info
    from core.models import StoreSettings
    try:
        store = StoreSettings.objects.first()
    except:
        store = None

    if store:
        elements.append(Paragraph(store.name, ParagraphStyle(
            'StoreName', parent=styles['Normal'],
            fontSize=10, alignment=1, fontName='Helvetica-Bold', spaceAfter=1 * mm,
        )))
        if store.address:
            elements.append(Paragraph(store.address, center_style))
        if store.phone:
            elements.append(Paragraph(f'Telp: {store.phone}', center_style))

    elements.append(Paragraph('─' * 40, divider_style))
    elements.append(Spacer(1, 2 * mm))

    # Transaction info
    date_str = transaction.created_at.strftime('%d/%m/%Y %H:%M')
    elements.append(Paragraph(f'Tanggal: {date_str}', normal_style))
    elements.append(Paragraph(f'Kasir: {transaction.cashier.email}', normal_style))
    if transaction.customer:
        elements.append(Paragraph(f'Pelanggan: {transaction.customer.name}', normal_style))
    elements.append(Spacer(1, 2 * mm))

    # Items table
    items_data = [['Produk', 'Qty', 'Harga', 'Subtotal']]
    for item in transaction.items.select_related('product').all():
        name = item.product.name[:20]
        items_data.append([
            name,
            str(item.quantity),
            f'{int(item.unit_price):,}'.replace(',', '.'),
            f'{int(item.subtotal):,}'.replace(',', '.'),
        ])

    col_widths = [30 * mm, 10 * mm, 18 * mm, 18 * mm]
    table = Table(items_data, colWidths=col_widths)
    table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 7),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E5E7EB')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 2 * mm))

    # Totals
    def add_total_row(label, value, bold=False):
        label_w = 48 * mm
        value_w = 28 * mm
        t = Table(
            [[Paragraph(label, bold_style if bold else normal_style),
              Paragraph(value, ParagraphStyle('val', parent=bold_style if bold else normal_style, alignment=2))]],
            colWidths=[label_w, value_w],
        )
        t.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('TOPPADDING', (0, 0), (-1, -1), 1),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
        ]))
        elements.append(t)

    fmt_idr = lambda v: f'Rp {int(v):,}'.replace(',', '.')

    add_total_row('Subtotal', fmt_idr(transaction.subtotal))
    if transaction.discount_value:
        add_total_row('Diskon', f'-{fmt_idr(transaction.discount_value)}')
    if transaction.tax_amount:
        add_total_row(f'Pajak ({transaction.tax_percent}%)', fmt_idr(transaction.tax_amount))
    elements.append(Paragraph('─' * 40, divider_style))
    add_total_row('TOTAL', fmt_idr(transaction.total), bold=True)
    elements.append(Spacer(1, 1 * mm))
    add_total_row('Bayar', fmt_idr(transaction.payment_amount))
    if transaction.change_amount:
        add_total_row('Kembali', fmt_idr(transaction.change_amount))

    elements.append(Spacer(1, 3 * mm))
    elements.append(Paragraph('═' * 40, divider_style))
    elements.append(Paragraph('Terima kasih telah berbelanja!', center_style))
    elements.append(Paragraph('Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.', ParagraphStyle(
        'Footer', parent=center_style, fontSize=6,
    )))

    doc.build(elements)
    pdf = buffer.getvalue()
    buffer.close()
    return pdf


def receipt_pdf_response(transaction):
    """Return HTTP response with receipt PDF."""
    pdf = generate_receipt_pdf(transaction)
    response = HttpResponse(pdf, content_type='application/pdf')
    filename = f'receipt_{transaction.invoice_number}.pdf'
    response['Content-Disposition'] = f'inline; filename="{filename}"'
    return response
