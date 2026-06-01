import 'package:flutter/material.dart';
import '../../api/api_client.dart';
import '../../models/invoice.dart';

class InvoiceListScreen extends StatefulWidget {
  const InvoiceListScreen({super.key});

  @override
  State<InvoiceListScreen> createState() => _InvoiceListScreenState();
}

class _InvoiceListScreenState extends State<InvoiceListScreen> {
  final ApiClient _api = ApiClient();
  List<Invoice> _invoices = [];
  bool _loading = true;
  String _statusFilter = '';
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final invoices = await _api.getInvoices(
        status: _statusFilter.isEmpty ? null : _statusFilter,
        search: _searchController.text.isEmpty ? null : _searchController.text,
      );
      setState(() { _invoices = invoices; _loading = false; });
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Gagal muat data: $e')));
      }
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'paid': return Colors.green;
      case 'pending': return Colors.orange;
      case 'overdue': return Colors.red;
      case 'cancelled': return Colors.grey;
      default: return Colors.grey;
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'paid': return 'Lunas';
      case 'pending': return 'Pending';
      case 'overdue': return 'Jatuh Tempo';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
  }

  void _showDetail(Invoice inv) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        minChildSize: 0.3,
        maxChildSize: 0.9,
        expand: false,
        builder: (_, controller) => _InvoiceDetail(
          invoice: inv,
          scrollController: controller,
          onAction: () {
            Navigator.pop(ctx);
            _load();
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Invoices')),
      body: Column(
        children: [
          // Search + Filter
          Padding(
            padding: const EdgeInsets.all(8),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    decoration: const InputDecoration(
                      hintText: 'Cari invoice...',
                      prefixIcon: Icon(Icons.search),
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    onSubmitted: (_) => _load(),
                  ),
                ),
                const SizedBox(width: 8),
                DropdownButton<String>(
                  value: _statusFilter.isEmpty ? '' : _statusFilter,
                  items: const [
                    DropdownMenuItem(value: '', child: Text('Semua')),
                    DropdownMenuItem(value: 'pending', child: Text('Pending')),
                    DropdownMenuItem(value: 'paid', child: Text('Lunas')),
                    DropdownMenuItem(value: 'overdue', child: Text('Jatuh Tempo')),
                    DropdownMenuItem(value: 'cancelled', child: Text('Dibatalkan')),
                  ],
                  onChanged: (v) {
                    setState(() => _statusFilter = v ?? '');
                    _load();
                  },
                ),
              ],
            ),
          ),
          // List
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _invoices.isEmpty
                    ? const Center(child: Text('Tidak ada invoice'))
                    : RefreshIndicator(
                        onRefresh: _load,
                        child: ListView.builder(
                          itemCount: _invoices.length,
                          itemBuilder: (_, i) {
                            final inv = _invoices[i];
                            return Card(
                              margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                              child: ListTile(
                                leading: CircleAvatar(
                                  backgroundColor: _statusColor(inv.status).withOpacity(0.1),
                                  child: Icon(Icons.description, color: _statusColor(inv.status)),
                                ),
                                title: Text(inv.invoiceNumber, style: const TextStyle(fontWeight: FontWeight.bold)),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    if (inv.customerName != null && inv.customerName!.isNotEmpty)
                                      Text('👤 ${inv.customerName}'),
                                    if (inv.issuedDate.isNotEmpty)
                                      Text('📅 ${inv.issuedDate}'),
                                  ],
                                ),
                                trailing: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text(inv.formattedTotal, style: const TextStyle(fontWeight: FontWeight.bold)),
                                    const SizedBox(height: 4),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: _statusColor(inv.status).withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        _statusLabel(inv.status),
                                        style: TextStyle(fontSize: 10, color: _statusColor(inv.status)),
                                      ),
                                    ),
                                  ],
                                ),
                                onTap: () => _showDetail(inv),
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

class _InvoiceDetail extends StatelessWidget {
  final Invoice invoice;
  final ScrollController scrollController;
  final VoidCallback onAction;

  const _InvoiceDetail({
    required this.invoice,
    required this.scrollController,
    required this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    final api = ApiClient();

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
          Text(invoice.invoiceNumber, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          _row('Status', invoice.status.toUpperCase()),
          _row('Total', invoice.formattedTotal),
          if (invoice.customerName != null) _row('Customer', invoice.customerName!),
          if (invoice.issuedDate.isNotEmpty) _row('Issued', invoice.issuedDate),
          if (invoice.dueDate != null && invoice.dueDate!.isNotEmpty) _row('Due', invoice.dueDate!),
          if (invoice.notes != null && invoice.notes!.isNotEmpty) ...[
            const SizedBox(height: 8),
            const Text('Notes:', style: TextStyle(fontWeight: FontWeight.bold)),
            Text(invoice.notes!),
          ],
          const SizedBox(height: 24),
          // Actions
          if (invoice.isPending) ...[
            Row(children: [
              Expanded(
                child: FilledButton.icon(
                  onPressed: () async {
                    try {
                      await api.markInvoicePaid(invoice.id);
                      onAction();
                    } catch (e) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Gagal: $e')));
                      }
                    }
                  },
                  icon: const Icon(Icons.check),
                  label: const Text('Mark Paid'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () async {
                    final confirm = await showDialog<bool>(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        title: const Text('Batalkan Invoice?'),
                        content: const Text('Invoice ini akan dibatalkan.'),
                        actions: [
                          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Tidak')),
                          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Ya, Batalkan')),
                        ],
                      ),
                    );
                    if (confirm == true) {
                      try {
                        await api.cancelInvoice(invoice.id);
                        onAction();
                      } catch (e) {
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Gagal: $e')));
                        }
                      }
                    }
                  },
                  icon: const Icon(Icons.close),
                  label: const Text('Cancel'),
                ),
              ),
            ]),
            const SizedBox(height: 8),
          ],
          OutlinedButton.icon(
            onPressed: () async {
              try {
                await api.generateInvoicePdf(invoice.id);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('PDF generated')));
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Gagal generate PDF: $e')));
                }
              }
            },
            icon: const Icon(Icons.picture_as_pdf),
            label: const Text('Generate PDF'),
          ),
        ],
      ),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}
