import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../api/api_client.dart';
import '../../models/transaction.dart';

class TransactionListScreen extends StatefulWidget {
  const TransactionListScreen({super.key});

  @override
  State<TransactionListScreen> createState() => _TransactionListScreenState();
}

class _TransactionListScreenState extends State<TransactionListScreen> {
  final ApiClient _api = ApiClient();
  List<Transaction> _transactions = [];
  bool _loading = true;
  String _statusFilter = 'all';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final txs = await _api.getTransactions(
        status: _statusFilter == 'all' ? null : _statusFilter,
      );
      setState(() { _transactions = txs; _loading = false; });
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Gagal muat data: $e')));
      }
    }
  }

  void _showDetail(Transaction t) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.3,
        maxChildSize: 0.95,
        expand: false,
        builder: (_, controller) => _TransactionDetail(
          transaction: t,
          scrollController: controller,
          onAction: (action) async {
            try {
              if (action == 'hold') await _api.holdTransaction(t.id);
              if (action == 'cancel') await _api.cancelTransaction(t.id);
              if (action == 'refund') await _api.cancelTransaction(t.id); // TODO: refund endpoint
              if (ctx.mounted) Navigator.pop(ctx);
              _load();
            } catch (e) {
              if (ctx.mounted) {
                ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text('Gagal: $e')));
              }
            }
          },
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

  String _statusLabel(String status) {
    switch (status) {
      case 'completed': return 'Selesai';
      case 'hold': return 'Ditahan';
      case 'cancelled': return 'Dibatalkan';
      case 'refunded': return 'Refund';
      default: return status;
    }
  }

  String _paymentLabel(String method) {
    switch (method) {
      case 'cash': return 'Tunai';
      case 'transfer': return 'Transfer';
      case 'ewallet': return 'E-Wallet';
      case 'mixed': return 'Campuran';
      default: return method;
    }
  }

  @override
  Widget build(BuildContext context) {
    final currency = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);

    return Scaffold(
      appBar: AppBar(title: const Text('Riwayat Transaksi')),
      body: Column(
        children: [
          // Status filter
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            child: Row(
              children: [
                const SizedBox(width: 4),
                for (final s in ['all', 'completed', 'hold', 'cancelled'])
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(s == 'all' ? 'Semua' : _statusLabel(s)),
                      selected: _statusFilter == s,
                      onSelected: (selected) {
                        setState(() => _statusFilter = s);
                        _load();
                      },
                    ),
                  ),
              ],
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _transactions.isEmpty
                    ? const Center(child: Text('Belum ada transaksi'))
                    : RefreshIndicator(
                        onRefresh: _load,
                        child: ListView.builder(
                          itemCount: _transactions.length,
                          itemBuilder: (_, i) {
                            final t = _transactions[i];
                            return Card(
                              margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                              child: ListTile(
                                leading: CircleAvatar(
                                  backgroundColor: _statusColor(t.status).withOpacity(0.1),
                                  child: Icon(Icons.receipt_long, color: _statusColor(t.status)),
                                ),
                                title: Text(t.invoiceNumber, style: const TextStyle(fontWeight: FontWeight.bold)),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(t.formattedDate),
                                    Text('${_paymentLabel(t.paymentMethod)} • ${t.items.length} item'),
                                    if (t.customerName != null && t.customerName!.isNotEmpty)
                                      Text('👤 ${t.customerName}'),
                                  ],
                                ),
                                trailing: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text(currency.format(t.total), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                    const SizedBox(height: 4),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: _statusColor(t.status).withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        _statusLabel(t.status),
                                        style: TextStyle(fontSize: 10, color: _statusColor(t.status)),
                                      ),
                                    ),
                                  ],
                                ),
                                onTap: () => _showDetail(t),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}

class _TransactionDetail extends StatelessWidget {
  final Transaction transaction;
  final ScrollController scrollController;
  final Function(String) onAction;

  const _TransactionDetail({
    required this.transaction,
    required this.scrollController,
    required this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    final currency = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
      ),
      child: ListView(
        controller: scrollController,
        padding: const EdgeInsets.all(16),
        children: [
          Center(
            child: Container(
              width: 40, height: 4,
              decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
            ),
          ),
          const SizedBox(height: 16),
          Text(transaction.invoiceNumber, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          Text(transaction.formattedDate, style: const TextStyle(color: Colors.grey)),
          const SizedBox(height: 16),
          // Items
          const Text('Item:', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          ...transaction.items.map((item) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(
              children: [
                Expanded(child: Text('${item.productName} x${item.quantity}')),
                Text(currency.format(item.subtotal), style: const TextStyle(fontWeight: FontWeight.w500)),
              ],
            ),
          )),
          const Divider(height: 24),
          // Totals
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            const Text('Subtotal:'), Text(currency.format(transaction.subtotal)),
          ]),
          if (transaction.discountValue > 0)
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              const Text('Diskon:'), Text('-${currency.format(transaction.discountValue)}', style: const TextStyle(color: Colors.red)),
            ]),
          if (transaction.taxAmount > 0)
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              const Text('Pajak:'), Text(currency.format(transaction.taxAmount)),
            ]),
          const Divider(),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            const Text('Total:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            Text(currency.format(transaction.total), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          ]),
          const SizedBox(height: 24),
          // Actions
          if (transaction.status == 'completed') ...[
            Row(children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => onAction('refund'),
                  icon: const Icon(Icons.replay),
                  label: const Text('Refund'),
                ),
              ),
            ]),
          ] else if (transaction.status == 'hold') ...[
            Row(children: [
              Expanded(
                child: FilledButton.icon(
                  onPressed: () => onAction('complete'),
                  icon: const Icon(Icons.check),
                  label: const Text('Lanjutkan'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => onAction('cancel'),
                  icon: const Icon(Icons.close),
                  label: const Text('Batalkan'),
                ),
              ),
            ]),
          ],
        ],
      ),
    );
  }
}
