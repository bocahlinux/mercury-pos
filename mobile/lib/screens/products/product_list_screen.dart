import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../../models/product.dart';

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
                              subtitle: Text('${p.skt ?? ''} • Stok: ${p.stock}'),
                              trailing: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text('Rp ${p.sellPrice.toInt()}', style: const TextStyle(fontWeight: FontWeight.bold)),
                                  if (p.stock <= p.minStockAlert)
                                    const Text('Stok Rendah', style: TextStyle(fontSize: 11, color: Colors.red)),
                                ],
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // TODO: Navigate to product form
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}
