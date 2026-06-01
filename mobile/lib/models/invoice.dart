import 'package:intl/intl.dart';

class Invoice {
  final int id;
  final String invoiceNumber;
  final String status;
  final String issuedDate;
  final String? dueDate;
  final double total;
  final String? customerName;
  final String? notes;
  final String? pdfFile;

  Invoice({
    required this.id,
    required this.invoiceNumber,
    required this.status,
    this.issuedDate = '',
    this.dueDate,
    this.total = 0,
    this.customerName,
    this.notes,
    this.pdfFile,
  });

  String get formattedTotal =>
      NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0).format(total);

  bool get isPending => status == 'pending';
  bool get isPaid => status == 'paid';
  bool get isOverdue => status == 'overdue';
  bool get isCancelled => status == 'cancelled';

  factory Invoice.fromJson(Map<String, dynamic> json) {
    return Invoice(
      id: json['id'] ?? 0,
      invoiceNumber: json['invoice_number'] ?? '',
      status: json['status'] ?? 'pending',
      issuedDate: json['issued_date'] ?? '',
      dueDate: json['due_date'],
      total: (json['total'] ?? 0).toDouble(),
      customerName: json['customer_name'],
      notes: json['notes'],
      pdfFile: json['pdf_file'],
    );
  }
}
