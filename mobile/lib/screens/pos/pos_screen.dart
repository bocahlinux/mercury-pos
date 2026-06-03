import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../api/api_client.dart';
import '../models/product.dart';
import '../models/customer.dart';
import 'package:intl/intl.dart';

class POSScreen extends StatefulWidget {
  const POSScreen({super.key});

  @override
  State<POSScreen> createState() => _POSScreenState();
}

class _POSScreenState extends State<POSScreen> {
  final ApiClient _api = ApiClient();
  List<Product> _products = [];
  List<Customer> _customers = [];
  final List<CartItem> _cart = [];
  String _searchQuery = '';
  bool _loading = true;
  int? _selectedCustomerId;
  String _customerName = '';

  // Checkout state
  String _discountType = 'percent';
  double _discountValue = 0;
  String _paymentMethod = 'cash';
  double _cashReceived = 0;
  final _cashController = TextEditingController();

  static const double TAX_PERCENT = 11;

  @override
  void initState() {
    super.initState();
    _loadProducts();
    _loadCustomers();
  }

  @override
  void dispose() {
    _cashController.dispose();
    super.dispose();
  }

  Future<void> _loadProducts() async {
    setState(() => _loading = true);
    try {
      final products = await _api.getProducts(search: _searchQuery.isEmpty ? null : _searchQuery);
      setState(() { _products = products; _loading = false; });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  Future<void> _loadCustomers() async {
    try {
      final customers = await _api.getCustomers();
      setState(() => _customers = customers);
    } catch (_) {}
  }

  Future<void> _scanBarcode() async {
    try {
      // Use mobile_scanner via a simple approach — launch search by barcode
      final result = await Navigator.push<String>(
        context,
        MaterialPageRoute(
          builder: (_) => const _BarcodeScannerPage(),
        ),
      );
      if (result != null && result.isNotEmpty) {
        // Find product by barcode
        final products = await _api.getProducts(search: result);
        final match = products.where((p) => p.barcode == result).toList();
        if (match.isNotEmpty) {
          _addToCart(match.first);
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('${match.first.name} ditambahkan')),
            );
          }
        } else if (products.isNotEmpty) {
          // Show search results
          _showScanResults(products, result);
        } else if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Produk tidak ditemukan')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Scan gagal: $e')));
      }
    }
  }

  void _showScanResults(List<Product> products, String query) {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text('Hasil scan: "$query"', style: const TextStyle(fontWeight: FontWeight.bold)),
          ),
          ...products.take(5).map((p) => ListTile(
            title: Text(p.name),
            subtitle: Text('Rp ${p.sellPrice.toInt()}'),
            onTap: () {
              Navigator.pop(ctx);
              _addToCart(p);
            },
          )),
        ],
      ),
    );
  }

  // ── Cart operations ──
  void _addToCart(Product product) {
    final existing = _cart.indexWhere((c) => c.product.id == product.id);
    if (existing >= 0) {
      if (_cart[existing].quantity >= product.stock) return;
      setState(() => _cart[existing].quantity++);
    } else {
      setState(() => _cart.add(CartItem(product: product)));
    }
  }

  void _removeFromCart(int index) {
    setState(() => _cart.removeAt(index));
  }

  void _updateQuantity(int index, int qty) {
    if (qty <= 0) {
      _removeFromCart(index);
    } else {
      setState(() => _cart[index].quantity = qty);
    }
  }

  // ── Calculations ──
  double get _subtotal => _cart.fold(0, (sum, item) => sum + item.subtotal);
  double get _orderDiscount {
    if (_discountType == 'percent') return (_subtotal * _discountValue) / 100;
    return _discountValue;
  }
  double get _afterDiscount => _subtotal - _orderDiscount;
  double get _tax => (_afterDiscount * TAX_PERCENT) / 100;
  double get _total => _afterDiscount + _tax;
  double get _change => _cashReceived > _total ? _cashReceived - _total : 0;

  String _fmt(double n) => NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0).format(n);

  // ── Checkout ──
  void _showCheckout() {
    if (_cart.isEmpty) return;
    _cashController.clear();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      isDismissible: false,
      builder: (_) => StatefulBuilder(
        builder: (context, setModalState) {
          return Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 16, right: 16, top: 16),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Total
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: Colors.indigo.shade50, borderRadius: BorderRadius.circular(8)),
                    child: Column(
                      children: [
                        const Text('Total Bayar', style: TextStyle(color: Colors.indigo)),
                        Text(_fmt(_total), style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.indigo)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Customer selection
                  const Text('Pelanggan (opsional)', style: TextStyle(fontWeight: FontWeight.w500)),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<int?>(
                    value: _selectedCustomerId,
                    decoration: const InputDecoration(isDense: true, border: OutlineInputBorder()),
                    hint: const Text('Pilih pelanggan'),
                    items: [
                      const DropdownMenuItem(value: null, child: Text('Tanpa pelanggan')),
                      ..._customers.map((c) => DropdownMenuItem(value: c.id, child: Text(c.name))),
                    ],
                    onChanged: (v) {
                      setModalState(() {
                        _selectedCustomerId = v;
                        _customerName = v != null ? _customers.firstWhere((c) => c.id == v).name : '';
                      });
                    },
                  ),
                  const SizedBox(height: 16),

                  // Discount
                  const Text('Diskon', style: TextStyle(fontWeight: FontWeight.w500)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      DropdownButton<String>(
                        value: _discountType,
                        items: const [
                          DropdownMenuItem(value: 'percent', child: Text('%')),
                          DropdownMenuItem(value: 'fixed', child: Text('Rp')),
                        ],
                        onChanged: (v) => setModalState(() => _discountType = v!),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(hintText: '0', isDense: true, border: OutlineInputBorder()),
                          onChanged: (v) => setModalState(() => _discountValue = double.tryParse(v) ?? 0),
                        ),
                      ),
                    ],
                  ),
                  if (_orderDiscount > 0)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text('Diskon: -${_fmt(_orderDiscount)}', style: const TextStyle(color: Colors.red, fontSize: 12)),
                    ),
                  const SizedBox(height: 16),

                  // Payment method
                  const Text('Metode Pembayaran', style: TextStyle(fontWeight: FontWeight.w500)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      ChoiceChip(label: const Text('Tunai'), selected: _paymentMethod == 'cash', onSelected: (_) => setModalState(() => _paymentMethod = 'cash')),
                      ChoiceChip(label: const Text('Transfer'), selected: _paymentMethod == 'transfer', onSelected: (_) => setModalState(() => _paymentMethod = 'transfer')),
                      ChoiceChip(label: const Text('E-Wallet'), selected: _paymentMethod == 'ewallet', onSelected: (_) => setModalState(() => _paymentMethod = 'ewallet')),
                      ChoiceChip(label: const Text('Campuran'), selected: _paymentMethod == 'mixed', onSelected: (_) => setModalState(() => _paymentMethod = 'mixed')),
                    ],
                  ),

                  // Cash input
                  if (_paymentMethod == 'cash') ...[
                    const SizedBox(height: 16),
                    TextField(
                      controller: _cashController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Uang Diterima', prefixText: 'Rp ', border: OutlineInputBorder()),
                      onChanged: (v) => setModalState(() => _cashReceived = double.tryParse(v) ?? 0),
                    ),
                    const SizedBox(height: 8),
                    if (_cashReceived >= _total)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(8)),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Kembali', style: TextStyle(color: Colors.green)),
                            Text(_fmt(_change), style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green)),
                          ],
                        ),
                      ),
                    if (_cashReceived > 0 && _cashReceived < _total)
                      Text('Kurang: ${_fmt(_total - _cashReceived)}', style: const TextStyle(color: Colors.red, fontSize: 12)),
                  ],

                  const SizedBox(height: 16),

                  // Summary
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade300), borderRadius: BorderRadius.circular(8)),
                    child: Column(
                      children: [
                        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [const Text('Subtotal'), Text(_fmt(_subtotal))]),
                        if (_orderDiscount > 0)
                          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [const Text('Diskon', style: TextStyle(color: Colors.red)), Text('-${_fmt(_orderDiscount)}', style: const TextStyle(color: Colors.red))]),
                        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text('Pajak ($TAX_PERCENT%)'), Text(_fmt(_tax))]),
                        const Divider(),
                        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [const Text('Total', style: TextStyle(fontWeight: FontWeight.bold)), Text(_fmt(_total), style: const TextStyle(fontWeight: FontWeight.bold))]),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Actions
                  Row(
                    children: [
                      Expanded(child: OutlinedButton(onPressed: () => Navigator.pop(context), child: const Text('Kembali'))),
                      const SizedBox(width: 12),
                      Expanded(
                        child: FilledButton.icon(
                          onPressed: _paymentMethod == 'cash' && _cashReceived < _total ? null : () => _processCheckout(setModalState),
                          icon: const Icon(Icons.check),
                          label: const Text('Selesaikan'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Future<void> _processCheckout(void Function(void Function()) setModalState) async {
    try {
      final result = await _api.createTransaction({
        'customer': _selectedCustomerId,
        'items': _cart.map((c) => {
          'product': c.product.id,
          'quantity': c.quantity,
          'unit_price': c.product.sellPrice,
          'discount': c.discount,
          'subtotal': c.subtotal,
        }).toList(),
        'payment_method': _paymentMethod,
        'payment_amount': _paymentMethod == 'cash' ? _cashReceived : _total,
        'change_amount': _paymentMethod == 'cash' ? _change : 0,
        'subtotal': _subtotal,
        'discount_type': _discountType,
        'discount_value': _orderDiscount,
        'tax_percent': TAX_PERCENT,
        'tax_amount': _tax,
        'total': _total,
      });

      setState(() {
        _cart.clear();
        _selectedCustomerId = null;
        _customerName = '';
        _discountValue = 0;
        _cashReceived = 0;
      });

      if (mounted) {
        Navigator.pop(context);
        // Show receipt
        _showReceipt(result);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  void _showReceipt(Map<String, dynamic> txnData) {
    final items = (txnData['items'] as List?)?.map((i) => {
      'product_name': i['product_name'] ?? '',
      'quantity': i['quantity'] ?? 0,
      'unit_price': (i['unit_price'] ?? 0).toDouble(),
      'subtotal': (i['subtotal'] ?? 0).toDouble(),
    }).toList() ?? <Map<String, dynamic>>[];

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Struk'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Column(
                  children: [
                    Text(txnData['store_name'] ?? 'Mercury POS', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    if (txnData['store_address'] != null) Text(txnData['store_address'], style: const TextStyle(fontSize: 12, color: Colors.grey)),
                  ],
                ),
              ),
              const Divider(),
              Text('No: ${txnData['invoice_number'] ?? '-'}'),
              Text('Tanggal: ${txnData['created_at'] ?? '-'}'),
              Text('Kasir: ${txnData['cashier_name'] ?? '-'}'),
              if (txnData['customer_name'] != null && txnData['customer_name'] != '-')
                Text('Pelanggan: ${txnData['customer_name']}'),
              const Divider(),
              ...items.map((i) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(i['product_name'], style: const TextStyle(fontWeight: FontWeight.w500)),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('${i['quantity']} × ${_fmt(i['unit_price'])}', style: const TextStyle(color: Colors.grey)),
                        Text(_fmt(i['subtotal'])),
                      ],
                    ),
                  ],
                ),
              )),
              const Divider(),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [const Text('Subtotal'), Text(_fmt((txnData['subtotal'] ?? 0).toDouble()))]),
              if ((txnData['discount_value'] ?? 0) > 0)
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [const Text('Diskon', style: TextStyle(color: Colors.red)), Text('-${_fmt((txnData['discount_value'] ?? 0).toDouble())}', style: const TextStyle(color: Colors.red))]),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text('Pajak (${txnData['tax_percent'] ?? 11}%)'), Text(_fmt((txnData['tax_amount'] ?? 0).toDouble()))]),
              const Divider(),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [const Text('Total', style: TextStyle(fontWeight: FontWeight.bold)), Text(_fmt((txnData['total'] ?? 0).toDouble()), style: const TextStyle(fontWeight: FontWeight.bold))]),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text('Bayar (${txnData['payment_method'] ?? '-'})'), Text(_fmt((txnData['payment_amount'] ?? 0).toDouble()))]),
              if ((txnData['change_amount'] ?? 0) > 0)
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [const Text('Kembali'), Text(_fmt((txnData['change_amount'] ?? 0).toDouble()))]),
              const Divider(),
              const Center(child: Text('Terima kasih!', style: TextStyle(color: Colors.grey))),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Tutup')),
          FilledButton(
            onPressed: () {
              // TODO: implement Bluetooth printer
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Fitur cetak coming soon')));
            },
            child: const Text('Cetak'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('POS')),
      body: Row(
        children: [
          // Product grid
          Expanded(
            flex: 3,
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(8),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          decoration: const InputDecoration(
                            hintText: 'Cari produk...',
                            prefixIcon: Icon(Icons.search),
                            isDense: true,
                          ),
                          onChanged: (v) { _searchQuery = v; _loadProducts(); },
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton.filled(
                        icon: const Icon(Icons.qr_code_scanner),
                        onPressed: _scanBarcode,
                        tooltip: 'Scan Barcode',
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: _loading
                      ? const Center(child: CircularProgressIndicator())
                      : GridView.builder(
                          padding: const EdgeInsets.all(8),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 4, childAspectRatio: 0.8, crossAxisSpacing: 8, mainAxisSpacing: 8,
                          ),
                          itemCount: _products.length,
                          itemBuilder: (_, i) {
                            final p = _products[i];
                            return InkWell(
                              onTap: () => _addToCart(p),
                              child: Card(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(Icons.inventory_2, size: 32, color: Colors.grey),
                                    const SizedBox(height: 4),
                                    Text(p.name, textAlign: TextAlign.center, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12)),
                                    Text('Rp ${p.sellPrice.toInt()}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                    if (p.stock <= p.minStockAlert)
                                      const Text('Stok Rendah', style: TextStyle(fontSize: 10, color: Colors.red)),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
          ),
          // Cart sidebar
          Expanded(
            flex: 2,
            child: Container(
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceContainerHighest,
                border: Border(left: BorderSide(color: Colors.grey.shade300)),
              ),
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Keranjang (${_cart.length})', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        if (_cart.isNotEmpty)
                          TextButton(
                            onPressed: () => setState(() => _cart.clear()),
                            child: const Text('Kosongkan'),
                          ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: _cart.isEmpty
                        ? const Center(child: Text('Keranjang kosong'))
                        : ListView.builder(
                            itemCount: _cart.length,
                            itemBuilder: (_, i) {
                              final item = _cart[i];
                              return ListTile(
                                title: Text(item.product.name, maxLines: 1, overflow: TextOverflow.ellipsis),
                                subtitle: Text('Rp ${item.product.sellPrice.toInt()} x ${item.quantity}'),
                                trailing: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    IconButton(icon: const Icon(Icons.remove_circle_outline, size: 20), onPressed: () => _updateQuantity(i, item.quantity - 1)),
                                    Text('${item.quantity}', style: const TextStyle(fontWeight: FontWeight.bold)),
                                    IconButton(icon: const Icon(Icons.add_circle_outline, size: 20), onPressed: () => _updateQuantity(i, item.quantity + 1)),
                                  ],
                                ),
                                onTap: () => _removeFromCart(i),
                              );
                            },
                          ),
                  ),
                  const Divider(),
                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      children: [
                        if (_orderDiscount > 0)
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [const Text('Diskon', style: TextStyle(color: Colors.red)), Text('-${_fmt(_orderDiscount)}', style: const TextStyle(color: Colors.red))],
                          ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [const Text('Total:', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)), Text(_fmt(_total), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold))],
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          height: 48,
                          child: FilledButton.icon(
                            onPressed: _cart.isEmpty ? null : _showCheckout,
                            icon: const Icon(Icons.shopping_cart_checkout),
                            label: const Text('Bayar'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
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

// ─── Barcode Scanner Page ───

class _BarcodeScannerPage extends StatefulWidget {
  const _BarcodeScannerPage();

  @override
  State<_BarcodeScannerPage> createState() => _BarcodeScannerPageState();
}

class _BarcodeScannerPageState extends State<_BarcodeScannerPage> {
  bool _scanned = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan Barcode'),
        actions: [
          IconButton(
            icon: const Icon(Icons.flash_on),
            onPressed: () {}, // MobileScanner handles torch internally
          ),
        ],
      ),
      body: MobileScanner(
        onDetect: (capture) {
          if (_scanned) return;
          final List<Barcode> barcodes = capture.barcodes;
          if (barcodes.isNotEmpty && barcodes.first.rawValue != null) {
            _scanned = true;
            Navigator.pop(context, barcodes.first.rawValue);
          }
        },
      ),
    );
  }
}
