import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../api/api_client.dart';
import '../../models/product.dart';
import '../../models/transaction.dart';

class POSScreen extends StatefulWidget {
  const POSScreen({super.key});

  @override
  State<POSScreen> createState() => _POSScreenState();
}

class _POSScreenState extends State<POSScreen> {
  final ApiClient _api = ApiClient();
  List<Product> _products = [];
  final List<CartItem> _cart = [];
  String _searchQuery = '';
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadProducts();
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

  void _addToCart(Product product) {
    final existing = _cart.indexWhere((c) => c.product.id == product.id);
    if (existing >= 0) {
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

  double get _subtotal => _cart.fold(0, (sum, item) => sum + item.subtotal);
  double get _total => _subtotal; // TODO: discount & tax

  void _showCheckout() {
    if (_cart.isEmpty) return;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => _CheckoutModal(
        total: _total,
        onComplete: (paymentMethod) async {
          try {
            await _api.createTransaction({
              'items': _cart.map((c) => {
                'product': c.product.id,
                'quantity': c.quantity,
                'unit_price': c.product.sellPrice,
                'discount': c.discount,
                'subtotal': c.subtotal,
              }).toList(),
              'payment_method': paymentMethod,
              'subtotal': _subtotal,
              'total': _total,
            });
            setState(() => _cart.clear());
            if (mounted) {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Transaksi berhasil!')));
            }
          } catch (e) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
            }
          }
        },
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
                  child: TextField(
                    decoration: const InputDecoration(
                      hintText: 'Cari produk...',
                      prefixIcon: Icon(Icons.search),
                      isDense: true,
                    ),
                    onChanged: (v) { _searchQuery = v; _loadProducts(); },
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
                  const Padding(
                    padding: EdgeInsets.all(12),
                    child: Text('Keranjang', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
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
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [const Text('Total:', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)), Text('Rp ${_total.toInt()}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold))],
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

class _CheckoutModal extends StatefulWidget {
  final double total;
  final Function(String paymentMethod) onComplete;
  const _CheckoutModal({required this.total, required this.onComplete});

  @override
  State<_CheckoutModal> createState() => _CheckoutModalState();
}

class _CheckoutModalState extends State<_CheckoutModal> {
  String _paymentMethod = 'cash';
  final _cashController = TextEditingController();
  double get _change {
    final cash = double.tryParse(_cashController.text) ?? 0;
    return cash > widget.total ? cash - widget.total : 0;
  }

  @override
  void dispose() { _cashController.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 16, right: 16, top: 16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Checkout', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          Text('Total: Rp ${widget.total.toInt()}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          const Text('Metode Pembayaran:'),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              ChoiceChip(label: const Text('Tunai'), selected: _paymentMethod == 'cash', onSelected: (_) => setState(() => _paymentMethod = 'cash')),
              ChoiceChip(label: const Text('Transfer'), selected: _paymentMethod == 'transfer', onSelected: (_) => setState(() => _paymentMethod = 'transfer')),
              ChoiceChip(label: const Text('E-Wallet'), selected: _paymentMethod == 'ewallet', onSelected: (_) => setState(() => _paymentMethod = 'ewallet')),
            ],
          ),
          if (_paymentMethod == 'cash') ...[
            const SizedBox(height: 16),
            TextField(
              controller: _cashController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Uang Diterima', prefixText: 'Rp '),
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 8),
            Text('Kembali: Rp ${_change.toInt()}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.green)),
          ],
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: FilledButton.icon(
              onPressed: () => widget.onComplete(_paymentMethod),
              icon: const Icon(Icons.check),
              label: const Text('Selesaikan Transaksi'),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}
