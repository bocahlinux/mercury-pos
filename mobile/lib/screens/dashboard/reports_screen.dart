import 'package:flutter/material.dart';
import '../../api/api_client.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> with SingleTickerProviderStateMixin {
  final ApiClient _api = ApiClient();
  late TabController _tabController;
  bool _loading = true;

  // Sales report
  String _period = 'daily';
  List<dynamic> _salesData = [];
  Map<String, dynamic> _salesSummary = {};

  // Product report
  List<dynamic> _productData = [];

  // Customer report
  List<dynamic> _customerData = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(_onTabChanged);
    _loadSales();
  }

  @override
  void dispose() {
    _tabController.removeListener(_onTabChanged);
    _tabController.dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (_tabController.indexIsChanging) return;
    switch (_tabController.index) {
      case 0: _loadSales(); break;
      case 1: _loadProducts(); break;
      case 2: _loadCustomers(); break;
    }
  }

  Future<void> _loadSales() async {
    setState(() => _loading = true);
    try {
      final result = await _api.getSalesReport(period: _period);
      setState(() {
        _salesData = (result['data'] as List?) ?? [];
        _salesSummary = result['summary'] ?? {};
        _loading = false;
      });
    } catch (e) {
      setState(() { _salesData = []; _salesSummary = {}; _loading = false; });
    }
  }

  Future<void> _loadProducts() async {
    setState(() => _loading = true);
    try {
      final data = await _api.getProductReport();
      setState(() { _productData = data; _loading = false; });
    } catch (e) {
      setState(() { _productData = []; _loading = false; });
    }
  }

  Future<void> _loadCustomers() async {
    setState(() => _loading = true);
    try {
      final data = await _api.getCustomerReport();
      setState(() { _customerData = data; _loading = false; });
    } catch (e) {
      setState(() { _customerData = []; _loading = false; });
    }
  }

  String _formatCurrency(dynamic value) {
    final num numValue = (value is num) ? value : 0;
    if (numValue >= 1000000) {
      return 'Rp ${(numValue / 1000000).toStringAsFixed(1)}jt';
    } else if (numValue >= 1000) {
      return 'Rp ${(numValue / 1000).toStringAsFixed(1)}rb';
    }
    return 'Rp ${numValue.toInt()}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Laporan'),
        automaticallyImplyLeading: false,
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Penjualan'),
            Tab(text: 'Produk'),
            Tab(text: 'Pelanggan'),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildSalesTab(),
                _buildProductsTab(),
                _buildCustomersTab(),
              ],
            ),
    );
  }

  Widget _buildSalesTab() {
    return RefreshIndicator(
      onRefresh: _loadSales,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Period selector
            Row(
              children: [
                const Text('Periode: ', style: TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(width: 8),
                ...['daily', 'weekly', 'monthly', 'yearly'].map((p) {
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(p == 'daily' ? 'Harian' : p == 'weekly' ? 'Mingguan' : p == 'monthly' ? 'Bulanan' : 'Tahunan'),
                      selected: _period == p,
                      onSelected: (selected) {
                        if (selected) {
                          setState(() => _period = p);
                          _loadSales();
                        }
                      },
                    ),
                  );
                }),
              ],
            ),
            const SizedBox(height: 16),
            // Summary cards
            Row(children: [
              Expanded(
                child: _SummaryCard(
                  title: 'Total Penjualan',
                  value: _formatCurrency(_salesSummary['total_sales']),
                  color: Colors.green,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _SummaryCard(
                  title: 'Transaksi',
                  value: '${_salesSummary['total_transactions'] ?? 0}',
                  color: Colors.blue,
                ),
              ),
            ]),
            const SizedBox(height: 12),
            _SummaryCard(
              title: 'Rata-rata Transaksi',
              value: _formatCurrency(_salesSummary['average_transaction']),
              color: Colors.purple,
              fullWidth: true,
            ),
            const SizedBox(height: 16),
            // Sales data table
            if (_salesData.isEmpty)
              const Padding(
                padding: EdgeInsets.all(32),
                child: Center(child: Text('Tidak ada data', style: TextStyle(color: Colors.grey))),
              )
            else
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Detail Penjualan', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      Table(
                        columnWidths: const {
                          0: FlexColumnWidth(2),
                          1: FlexColumnWidth(2),
                          2: FlexColumnWidth(1),
                        },
                        children: [
                          const TableRow(
                            decoration: BoxDecoration(color: Colors.black12),
                            children: [
                              Padding(padding: EdgeInsets.all(8), child: Text('Periode', style: TextStyle(fontWeight: FontWeight.bold))),
                              Padding(padding: EdgeInsets.all(8), child: Text('Penjualan', style: TextStyle(fontWeight: FontWeight.bold))),
                              Padding(padding: EdgeInsets.all(8), child: Text('Txn', style: TextStyle(fontWeight: FontWeight.bold))),
                            ],
                          ),
                          ..._salesData.map((d) {
                            final date = d['date']?.toString() ??
                                '${d['year']}-${d['month']?.toString().padLeft(2, '0') ?? ''}' ??
                                '${d['year']}-W${d['week']}' ??
                                '${d['year']}';
                            return TableRow(children: [
                              Padding(padding: EdgeInsets.all(8), child: Text(date)),
                              Padding(padding: EdgeInsets.all(8), child: Text(_formatCurrency(d['total_sales']))),
                              Padding(padding: EdgeInsets.all(8), child: Text('${d['transaction_count'] ?? 0}')),
                            ]);
                          }),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildProductsTab() {
    return RefreshIndicator(
      onRefresh: _loadProducts,
      child: _productData.isEmpty
          ? const Center(child: Text('Tidak ada data', style: TextStyle(color: Colors.grey)))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _productData.length,
              itemBuilder: (context, idx) {
                final p = _productData[idx];
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    title: Text(p['product__name'] ?? '-'),
                    subtitle: Text('SKU: ${p['product__sku'] ?? '-'} • Terjual: ${p['total_sold'] ?? 0}'),
                    trailing: Text(
                      _formatCurrency(p['revenue']),
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                );
              },
            ),
    );
  }

  Widget _buildCustomersTab() {
    return RefreshIndicator(
      onRefresh: _loadCustomers,
      child: _customerData.isEmpty
          ? const Center(child: Text('Tidak ada data', style: TextStyle(color: Colors.grey)))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _customerData.length,
              itemBuilder: (context, idx) {
                final c = _customerData[idx];
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: Colors.indigo.shade50,
                      child: Text((c['name'] ?? '-')[0].toUpperCase()),
                    ),
                    title: Text(c['name'] ?? '-'),
                    subtitle: Text('${c['email'] ?? '-'} • ${c['order_count'] ?? 0} pesanan'),
                    trailing: Text(
                      _formatCurrency(c['total_spent']),
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                );
              },
            ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final String title, value;
  final Color color;
  final bool fullWidth;
  const _SummaryCard({required this.title, required this.value, required this.color, this.fullWidth = false});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: TextStyle(fontSize: 12, color: Colors.grey)),
            const SizedBox(height: 4),
            Text(value, style: TextStyle(fontSize: fullWidth ? 22 : 18, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
      ),
    );
  }
}
