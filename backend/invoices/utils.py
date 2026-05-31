import io
from datetime import datetime, timedelta
from decimal import Decimal
from reportlab.lib.pagesizes import LETTER
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.platypus import Table, TableStyle, SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

from django.core.files.base import ContentFile

from .models import Invoice


def generate_pdf_invoice(invoice: Invoice):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=LETTER, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=18)
    elements = []
    styles = getSampleStyleSheet()

    # Store header
    store_info = [
        Paragraph("<b>Mercury POS Store</b>", styles['Title']),
        Paragraph("123 Main Street, City, Country", styles['Normal']),
        Paragraph("Phone: +1 234 567 890", styles['Normal']),
    ]
    elements.extend(store_info)
    elements.append(Spacer(1, 12))

    # Invoice title
    elements.append(Paragraph(f"Invoice #{invoice.invoice_number}", styles['Title']))
    elements.append(Spacer(1, 12))

    # Invoice and customer info
    invoice_info = [
        ["Invoice Date:", invoice.issued_date.strftime("%Y-%m-%d")],
        ["Due Date:", invoice.due_date.strftime("%Y-%m-%d") if invoice.due_date else "N/A"],
        ["Customer:", str(invoice.transaction.customer) if hasattr(invoice.transaction, 'customer') else ""],
    ]
    t = Table(invoice_info, colWidths=[120, 350])
    t.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 12))

    # Transaction items table
    data = [["Product", "Qty", "Price", "Subtotal"]]
    for item in invoice.transaction.items.all():
        quantity = item.quantity
        price = item.unit_price
        subtotal = quantity * price
        data.append([item.product.name, str(quantity), f"{price:.2f}", f"{subtotal:.2f}"])
    items_table = Table(data, hAlign='LEFT', colWidths=[200, 50, 80, 80])
    items_table.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 12))

    # Totals
    subtotal_val = sum(item.quantity * item.unit_price for item in invoice.transaction.items.all())
    discount = 0  # placeholder
    tax = subtotal_val * Decimal('0.07')
    grand_total = subtotal_val - discount + tax
    totals = [
        ["Subtotal:", f"{subtotal_val:.2f}"],
        ["Discount:", f"{discount:.2f}"],
        ["Tax (7%):", f"{tax:.2f}"],
        ["Grand Total:", f"{grand_total:.2f}"],
    ]
    totals_table = Table(totals, colWidths=[280, 80], hAlign='RIGHT')
    totals_table.setStyle(TableStyle([
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
    ]))
    elements.append(totals_table)
    elements.append(Spacer(1, 48))

    # Footer
    elements.append(Paragraph("Thank you for your business!", styles['Normal']))

    doc.build(elements)
    pdf_data = buffer.getvalue()
    buffer.close()

    # Save to FileField
    file_name = f"invoice_{invoice.pk}.pdf"
    invoice.pdf_file.save(file_name, ContentFile(pdf_data), save=False)
    invoice.save()
