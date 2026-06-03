import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../../models/product.dart';

class ProductFormScreen extends StatefulWidget {
  final Product? product;
  const ProductFormScreen({super.key, this.product});

  @override
  State<ProductFormScreen> createState() => _ProductFormScreenState();
}

class _ProductFormScreenState extends State<ProductFormScreen> {
  final ApiClient _api = ApiClient();
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _skuController = TextEditingController();
  final _barcodeController = TextEditingController();
  final _descController = TextEditingController();
  final _buyPriceController = TextEditingController();
  final _sellPriceController = TextEditingController();
  final _stockController = TextEditingController();
  final _minStockController = TextEditingController(text: '5');
  final _unitController = TextEditingController(text: 'pcs');

  List<Category> _categories = [];
  int? _selectedCategoryId;
  bool _loading = false;
  bool _saving = false;

  bool get _isEdit => widget.product != null;

  @override
  void initState() {
    super.initState();
    if (_isEdit) {
      final p = widget.product!;
      _nameController.text = p.name;
      _skuController.text = p.sku ?? '';
      _barcodeController.text = p.barcode ?? '';
      _descController.text = p.description ?? '';
      _buyPriceController.text = p.buyPrice > 0 ? p.buyPrice.toString() : '';
      _sellPriceController.text = p.sellPrice > 0 ? p.sellPrice.toString() : '';
      _stockController.text = p.stock > 0 ? p.stock.toString() : '';
      _minStockController.text = p.minStockAlert.toString();
      _unitController.text = p.unit ?? 'pcs';
      _selectedCategoryId = p.categoryId;
    }
    _loadCategories();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _skuController.dispose();
    _barcodeController.dispose();
    _descController.dispose();
    _buyPriceController.dispose();
    _sellPriceController.dispose();
    _stockController.dispose();
    _minStockController.dispose();
    _unitController.dispose();
    super.dispose();
  }

  Future<void> _loadCategories() async {
    try {
      final cats = await _api.getCategories();
      setState(() => _categories = cats);
    } catch (_) {}
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final data = {
      'name': _nameController.text.trim(),
      'sku': _skuController.text.trim(),
      'barcode': _barcodeController.text.trim(),
      'description': _descController.text.trim(),
      'buy_price': double.tryParse(_buyPriceController.text) ?? 0,
      'sell_price': double.tryParse(_sellPriceController.text) ?? 0,
      'stock': int.tryParse(_stockController.text) ?? 0,
      'min_stock_alert': int.tryParse(_minStockController.text) ?? 5,
      'unit': _unitController.text.trim(),
      if (_selectedCategoryId != null) 'category': _selectedCategoryId,
    };

    try {
      if (_isEdit) {
        await _api.updateProduct(widget.product!.id, data);
      } else {
        await _api.createProduct(data);
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(_isEdit ? 'Produk diperbarui' : 'Produk ditambahkan')),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      setState(() => _saving = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Gagal simpan: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEdit ? 'Edit Produk' : 'Tambah Produk'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Basic info
            const Text('Informasi Dasar', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Nama Produk *', border: OutlineInputBorder()),
              validator: (v) => v?.trim().isEmpty == true ? 'Nama wajib diisi' : null,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _skuController,
                    decoration: const InputDecoration(labelText: 'SKU', border: OutlineInputBorder()),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _barcodeController,
                    decoration: const InputDecoration(labelText: 'Barcode', border: OutlineInputBorder()),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<int?>(
              value: _selectedCategoryId,
              decoration: const InputDecoration(labelText: 'Kategori', border: OutlineInputBorder()),
              items: [
                const DropdownMenuItem(value: null, child: Text('Tanpa kategori')),
                ..._categories.map((c) => DropdownMenuItem(value: c.id, child: Text(c.name))),
              ],
              onChanged: (v) => setState(() => _selectedCategoryId = v),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _descController,
              decoration: const InputDecoration(labelText: 'Deskripsi', border: OutlineInputBorder()),
              maxLines: 2,
            ),
            const SizedBox(height: 20),

            // Pricing
            const Text('Harga', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _buyPriceController,
                    decoration: const InputDecoration(labelText: 'Harga Beli', border: OutlineInputBorder(), prefixText: 'Rp '),
                    keyboardType: TextInputType.number,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _sellPriceController,
                    decoration: const InputDecoration(labelText: 'Harga Jual *', border: OutlineInputBorder(), prefixText: 'Rp '),
                    keyboardType: TextInputType.number,
                    validator: (v) {
                      if (v?.trim().isEmpty == true) return 'Wajib diisi';
                      if (double.tryParse(v!) == null) return 'Angka tidak valid';
                      return null;
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Stock
            const Text('Stok', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _stockController,
                    decoration: const InputDecoration(labelText: 'Stok', border: OutlineInputBorder()),
                    keyboardType: TextInputType.number,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _minStockController,
                    decoration: const InputDecoration(labelText: 'Min. Stok Alert', border: OutlineInputBorder()),
                    keyboardType: TextInputType.number,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _unitController,
                    decoration: const InputDecoration(labelText: 'Satuan', border: OutlineInputBorder()),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),

            // Save button
            SizedBox(
              height: 48,
              child: FilledButton(
                onPressed: _saving ? null : _save,
                child: _saving
                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2))
                    : Text(_isEdit ? 'Simpan Perubahan' : 'Tambah Produk'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
