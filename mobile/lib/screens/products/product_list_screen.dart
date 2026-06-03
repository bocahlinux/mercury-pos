import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../../models/product.dart';
import 'product_form_screen.dart';

class ProductListScreen extends StatefulWidget {
  const ProductListScreen({super.key});

  @override
  State<ProductListScreen> createState() => _ProductListScreenState();
}

class _ProductListScreenState extends State<ProductListScreen> {
  final ApiClient _api = ApiClient();
  List<Product> _products = [];
  List<Category> _categories = [];
  String _search = '';
  int? _categoryFilter;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final products = await _api.getProducts(
        search: _search.isEmpty ? null : _search,
        category: _categoryFilter,
      );
      final cats = await _api.getCategories();
      setState(() { _products = products; _categories = cats; _loading = false; });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  void _openForm([Product? product]) async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => ProductFormScreen(product: product)),
    );
    if (result == true) _load();
  }

  void _deleteProduct(Product product) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Hapus Produk'),
        content: Text('Yakin hapus "${product.name}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await _api.deleteProduct(product.id);
                _load();
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Produk dihapus')));
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Gagal hapus: $e')));
                }
              }
            },
            child: const Text('Hapus'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Produk')),
      body: Column(
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
                    onChanged: (v) { _search = v; _load(); },
                  ),
                ),
                const SizedBox(width: 8),
                DropdownButton<int?>(
                  value: _categoryFilter,
                  hint: const Text('Kategori'),
                  items: [
                    const DropdownMenuItem(value: null, child: Text('Semua')),
                    ..._categories.map((c) => DropdownMenuItem(value: c.id, child: Text(c.name))),
                  ],
                  onChanged: (v) { setState(() => _categoryFilter = v); _load(); },
                ),
              ],
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _products.isEmpty
                    ? const Center(child: Text('Belum ada produk'))
                    : RefreshIndicator(
                        onRefresh: _load,
                        child: ListView.builder(
                          itemCount: _products.length,
                          itemBuilder: (_, i) {
                            final p = _products[i];
                            return ListTile(
                              leading: CircleAvatar(
                                backgroundColor: Colors.indigo.shade50,
                                child: const Icon(Icons.inventory_2, color: Colors.indigo),
                              ),
                              title: Text(p.name),
                              subtitle: Text('${p.sku ?? ''} • Stok: ${p.stock}'),
                              trailing: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text('Rp ${p.sellPrice.toInt()}', style: const TextStyle(fontWeight: FontWeight.bold)),
                                      if (p.stock <= p.minStockAlert)
                                        const Text('Stok Rendah', style: TextStyle(fontSize: 11, color: Colors.red)),
                                    ],
                                  ),
                                  PopupMenuButton<String>(
                                    onSelected: (v) {
                                      if (v == 'edit') _openForm(p);
                                      if (v == 'delete') _deleteProduct(p);
                                    },
                                    itemBuilder: (_) => [
                                      const PopupMenuItem(value: 'edit', child: Text('Edit')),
                                      const PopupMenuItem(value: 'delete', child: Text('Hapus')),
                                    ],
                                  ),
                                ],
                              ),
                              onTap: () => _openForm(p),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _openForm(),
        child: const Icon(Icons.add),
      ),
    );
  }
}
