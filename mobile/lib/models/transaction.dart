import 'package:intl/intl.dart';

class Transaction {
  final int id;
  final String invoiceNumber;
  final int? customerId;
  final String? customerName;
  final double subtotal;
  final double discountValue;
  final double taxAmount;
  final double total;
  final String paymentMethod;
  final String status;
  final String? notes;
  final DateTime createdAt;
  final List<TransactionItem> items;

  Transaction({
    required this.id,
    required this.invoiceNumber,
    this.customerId,
    this.customerName,
    this.subtotal = 0,
    this.discountValue = 0,
    this.taxAmount = 0,
    this.total = 0,
    this.paymentMethod = 'cash',
    this.status = 'completed',
    this.notes,
    required this.createdAt,
    this.items = const [],
  });

  String get formattedTotal => NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0).format(total);
  String get formattedDate => DateFormat('dd MMM yyyy, HH:mm').format(createdAt);

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['id'] ?? 0,
      invoiceNumber: json['invoice_number'] ?? '',
      customerId: json['customer'],
      customerName: json['customer_name'],
      subtotal: (json['subtotal'] ?? 0).toDouble(),
      discountValue: (json['discount_value'] ?? 0).toDouble(),
      taxAmount: (json['tax_amount'] ?? 0).toDouble(),
      total: (json['total'] ?? 0).toDouble(),
      paymentMethod: json['payment_method'] ?? 'cash',
      status: json['status'] ?? 'completed',
      notes: json['notes'],
      createdAt: DateTime.parse(json['created_at']),
      items: (json['items'] as List?)?.map((e) => TransactionItem.fromJson(e)).toList() ?? [],
    );
  }
}

class TransactionItem {
  final int id;
  final int productId;
  final String productName;
  final int quantity;
  final double unitPrice;
  final double discount;
  final double subtotal;

  TransactionItem({
    required this.id,
    required this.productId,
    required this.productName,
    required this.quantity,
    this.unitPrice = 0,
    this.discount = 0,
    this.subtotal = 0,
  });

  factory TransactionItem.fromJson(Map<String, dynamic> json) {
    return TransactionItem(
      id: json['id'] ?? 0,
      productId: json['product'] ?? 0,
      productName: json['product_name'] ?? '',
      quantity: json['quantity'] ?? 0,
      unitPrice: (json['unit_price'] ?? 0).toDouble(),
      discount: (json['discount'] ?? 0).toDouble(),
      subtotal: (json['subtotal'] ?? 0).toDouble(),
    );
  }
}

class CartItem {
  final Product product;
  int quantity;
  double discount;

  CartItem({
    required this.product,
    this.quantity = 1,
    this.discount = 0,
  });

  double get subtotal => (product.sellPrice * quantity) - discount;
}
