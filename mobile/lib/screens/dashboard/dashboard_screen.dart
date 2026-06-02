import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../pos/pos_screen.dart';
import '../products/product_list_screen.dart';
import '../transactions/transaction_list_screen.dart';
import '../customers/customer_list_screen.dart';
import '../settings_screen.dart';
import 'reports_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ApiClient _api = ApiClient();
  bool _loading = true;
  Map<String, dynamic> _data = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await _api.getDashboard();
      setState(() { _data = data; _loading = false; });
    } catch (e) {
      setState(() { _data = {}; _loading = false; });
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
    final auth = context.watch<AuthService>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mercury POS'),
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => auth.logout(),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Selamat datang, ${auth.user?.email ?? "User"}!',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    const SizedBox(height: 16),
                    // Stat cards row 1: Today + comparison
                    Row(children: [
                      Expanded(
                        child: _StatCard(
                          title: 'Penjualan Hari Ini',
                          value: _formatCurrency(_data['summary']?['today_sales'] ?? _data['today_sales']),
                          icon: Icons.today,
                          color: Colors.blue,
                          change: _data['comparison']?['sales_change_pct']?.toDouble() ?? 0,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _StatCard(
                          title: 'Transaksi',
                          value: '${_data['summary']?['today_transactions'] ?? (_data['today_transactions'] ?? 0)}',
                          icon: Icons.receipt,
                          color: Colors.green,
                        ),
                      ),
                    ]),
                    const SizedBox(height: 12),
                    // Stat cards row 2: Week + Month with comparison
                    Row(children: [
                      Expanded(
                        child: _StatCard(
                          title: 'Penjualan Minggu',
                          value: _formatCurrency(_data['summary']?['week_sales'] ?? _data['week_sales']),
                          icon: Icons.calendar_view_week,
                          color: Colors.orange,
                          change: _data['comparison']?['week_change_pct']?.toDouble() ?? 0,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _StatCard(
                          title: 'Penjualan Bulan',
                          value: _formatCurrency(_data['summary']?['month_sales'] ?? _data['month_sales']),
                          icon: Icons.calendar_month,
                          color: Colors.purple,
                          change: _data['comparison']?['month_change_pct']?.toDouble() ?? 0,
                        ),
                      ),
                    ]),
                    const SizedBox(height: 12),
                    // Low stock alert
                    if ((_data['low_stock']?['count'] ?? 0) > 0)
                      Card(
                        color: Colors.orange.shade50,
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            children: [
                              Icon(Icons.warning_amber, color: Colors.orange.shade700),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Stok Menipis',
                                      style: TextStyle(fontWeight: FontWeight.bold, color: Colors.orange.shade900),
                                    ),
                                    Text(
                                      '${_data['low_stock']['count']} produk di bawah minimum stok',
                                      style: TextStyle(color: Colors.orange.shade700, fontSize: 13),
                                    ),
                                    if ((_data['low_stock']['products'] as List?)?.isNotEmpty == true)
                                      ...(_data['low_stock']['products'] as List).take(3).map((p) {
                                        return Padding(
                                          padding: const EdgeInsets.only(top: 2),
                                          child: Text(
                                            '• ${p['name'] ?? '-'}: ${p['stock'] ?? 0} tersisa',
                                            style: TextStyle(fontSize: 12, color: Colors.orange.shade600),
                                          ),
                                        );
                                      }),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    const SizedBox(height: 16),
                    // Payment method breakdown
                    if ((_data['payment_breakdown'] as List?)?.isNotEmpty == true)
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Metode Pembayaran (Bulan Ini)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 12),
                              ...(_data['payment_breakdown'] as List).map((p) {
                                final method = p['payment_method'] ?? '-';
                                final total = _formatCurrency(p['total']);
                                final count = p['count'] ?? 0;
                                return Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 4),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Row(children: [
                                        Icon(
                                          method == 'cash' ? Icons.payments :
                                          method == 'transfer' ? Icons.account_balance :
                                          method == 'ewallet' ? Icons.phone_android :
                                          Icons.payment,
                                          size: 18,
                                          color: Colors.grey,
                                        ),
                                        const SizedBox(width: 8),
                                        Text(method.toUpperCase()),
                                      ]),
                                      Text('$count txn • $total', style: const TextStyle(color: Colors.grey, fontSize: 13)),
                                    ],
                                  ),
                                );
                              }),
                            ],
                          ),
                        ),
                      ),
                    const SizedBox(height: 12),
                    // Top Products
                    if (_data['top_products'] != null && (_data['top_products'] as List).isNotEmpty) ...[
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Produk Terlaris', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 12),
                              ...(_data['top_products'] as List).take(5).map((p) {
                                final name = p['product__name'] ?? '-';
                                final sold = p['total_sold'] ?? 0;
                                return Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 4),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Expanded(child: Text(name, maxLines: 1, overflow: TextOverflow.ellipsis)),
                                      Text('$sold terjual', style: const TextStyle(color: Colors.grey)),
                                    ],
                                  ),
                                );
                              }),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],
                    // Recent Transactions
                    if (_data['recent_transactions'] != null && (_data['recent_transactions'] as List).isNotEmpty) ...[
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Transaksi Terakhir', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                                  TextButton(
                                    onPressed: () {
                                      // Navigate to transactions tab — handled by parent
                                    },
                                    child: const Text('Lihat Semua'),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              ...(_data['recent_transactions'] as List).take(5).map((t) {
                                final invoice = t['invoice_number'] ?? '-';
                                final total = _formatCurrency(t['total']);
                                final status = t['status'] ?? '-';
                                return ListTile(
                                  dense: true,
                                  title: Text(invoice, style: const TextStyle(fontSize: 14)),
                                  subtitle: Text(status, style: TextStyle(fontSize: 12, color: _statusColor(status))),
                                  trailing: Text(total, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                );
                              }),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'completed': return Colors.green;
      case 'hold': return Colors.orange;
      case 'cancelled': return Colors.red;
      case 'refunded': return Colors.grey;
      default: return Colors.grey;
    }
  }
}

class _StatCard extends StatelessWidget {
  final String title, value;
  final IconData icon;
  final Color color;
  final double? change;
  const _StatCard({required this.title, required this.value, required this.icon, required this.color, this.change});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(width: 8),
              Expanded(child: Text(title, style: const TextStyle(fontSize: 12, color: Colors.grey))),
            ]),
            const SizedBox(height: 8),
            Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            if (change != null && change != 0) ...[
              const SizedBox(height: 4),
              Row(children: [
                Icon(
                  change! >= 0 ? Icons.arrow_upward : Icons.arrow_downward,
                  size: 14,
                  color: change! >= 0 ? Colors.green : Colors.red,
                ),
                Text(
                  '${change!.abs().toStringAsFixed(1)}%',
                  style: TextStyle(fontSize: 12, color: change! >= 0 ? Colors.green : Colors.red),
                ),
              ]),
            ],
          ],
        ),
      ),
    );
  }
}

// ─── MainScreen with bottom navigation ───

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    DashboardScreen(),
    POSScreen(),
    ProductListScreen(),
    TransactionListScreen(),
    CustomerListScreen(),
    ReportsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (i) => setState(() => _currentIndex = i),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          NavigationDestination(
            icon: Icon(Icons.point_of_sale_outlined),
            selectedIcon: Icon(Icons.point_of_sale),
            label: 'POS',
          ),
          NavigationDestination(
            icon: Icon(Icons.inventory_2_outlined),
            selectedIcon: Icon(Icons.inventory_2),
            label: 'Produk',
          ),
          NavigationDestination(
            icon: Icon(Icons.receipt_long_outlined),
            selectedIcon: Icon(Icons.receipt_long),
            label: 'Transaksi',
          ),
          NavigationDestination(
            icon: Icon(Icons.people_outlined),
            selectedIcon: Icon(Icons.people),
            label: 'Pelanggan',
          ),
          NavigationDestination(
            icon: Icon(Icons.analytics_outlined),
            selectedIcon: Icon(Icons.analytics),
            label: 'Reports',
          ),
        ],
      ),
    );
  }
}
