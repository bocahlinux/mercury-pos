import 'package:flutter/material.dart';
import '../../api/api_client.dart';

class AuditLogEntry {
  final int id;
  final String userEmail;
  final String userRole;
  final String action;
  final String modelName;
  final String objectId;
  final String objectRepr;
  final String detail;
  final String? ipAddress;
  final String createdAt;

  AuditLogEntry({
    required this.id,
    required this.userEmail,
    required this.userRole,
    required this.action,
    required this.modelName,
    required this.objectId,
    required this.objectRepr,
    required this.detail,
    this.ipAddress,
    required this.createdAt,
  });

  factory AuditLogEntry.fromJson(Map<String, dynamic> json) => AuditLogEntry(
    id: json['id'],
    userEmail: json['user_email'] ?? '',
    userRole: json['user_role'] ?? '',
    action: json['action'] ?? '',
    modelName: json['model_name'] ?? '',
    objectId: json['object_id'] ?? '',
    objectRepr: json['object_repr'] ?? '',
    detail: json['detail'] ?? '',
    ipAddress: json['ip_address'],
    createdAt: json['created_at'] ?? '',
  );
}

class AuditLogScreen extends StatefulWidget {
  const AuditLogScreen({super.key});

  @override
  State<AuditLogScreen> createState() => _AuditLogScreenState();
}

class _AuditLogScreenState extends State<AuditLogScreen> {
  final _api = ApiClient();
  List<AuditLogEntry> _logs = [];
  bool _loading = true;
  String _filterAction = '';

  final _actions = ['', 'create', 'update', 'delete', 'login', 'logout', 'role_change', 'activate', 'deactivate', 'export', 'pdf_generate'];

  @override
  void initState() {
    super.initState();
    _fetchLogs();
  }

  Future<void> _fetchLogs() async {
    setState(() => _loading = true);
    try {
      final params = <String, dynamic>{};
      if (_filterAction.isNotEmpty) params['action'] = _filterAction;
      final res = await _api.dio.get('/auth/audit-log/', queryParameters: params);
      final list = (res.data as List).map((e) => AuditLogEntry.fromJson(e)).toList();
      setState(() {
        _logs = list;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  Color _actionColor(String action) {
    switch (action) {
      case 'create': return Colors.green;
      case 'update': return Colors.blue;
      case 'delete': return Colors.red;
      case 'login': return Colors.teal;
      case 'logout': return Colors.grey;
      case 'role_change': return Colors.purple;
      case 'activate': return Colors.lightGreen;
      case 'deactivate': return Colors.orange;
      case 'export': return Colors.indigo;
      case 'pdf_generate': return Colors.amber.shade700;
      default: return Colors.grey;
    }
  }

  IconData _actionIcon(String action) {
    switch (action) {
      case 'create': return Icons.add_circle;
      case 'update': return Icons.edit;
      case 'delete': return Icons.delete;
      case 'login': return Icons.login;
      case 'logout': return Icons.logout;
      case 'role_change': return Icons.admin_panel_settings;
      case 'activate': return Icons.check_circle;
      case 'deactivate': return Icons.cancel;
      case 'export': return Icons.download;
      case 'pdf_generate': return Icons.picture_as_pdf;
      default: return Icons.info;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Audit Log')),
      body: Column(
        children: [
          // Filter
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _filterAction,
                    decoration: const InputDecoration(
                      labelText: 'Filter Action',
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    ),
                    items: _actions.map((a) => DropdownMenuItem(
                      value: a,
                      child: Text(a.isEmpty ? 'All Actions' : a),
                    )).toList(),
                    onChanged: (v) {
                      setState(() => _filterAction = v ?? '');
                      _fetchLogs();
                    },
                  ),
                ),
              ],
            ),
          ),
          // Log list
          Expanded(
            child: _logs.isEmpty
                ? const Center(child: Text('No audit log entries'))
                : ListView.builder(
                    itemCount: _logs.length,
                    itemBuilder: (ctx, i) {
                      final log = _logs[i];
                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: _actionColor(log.action).withOpacity(0.15),
                            child: Icon(_actionIcon(log.action), color: _actionColor(log.action), size: 20),
                          ),
                          title: Text(log.objectRepr.isNotEmpty ? log.objectRepr : log.modelName, maxLines: 1, overflow: TextOverflow.ellipsis),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (log.detail.isNotEmpty)
                                Text(log.detail, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12)),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Chip(
                                    label: Text(log.action, style: const TextStyle(fontSize: 10)),
                                    backgroundColor: _actionColor(log.action).withOpacity(0.1),
                                    padding: EdgeInsets.zero,
                                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(log.userEmail, style: const TextStyle(fontSize: 11, color: Colors.grey)),
                                  if (log.ipAddress != null) ...[
                                    const SizedBox(width: 8),
                                    Text(log.ipAddress!, style: const TextStyle(fontSize: 10, color: Colors.grey)),
                                  ],
                                ],
                              ),
                            ],
                          ),
                          trailing: Text(
                            log.createdAt.substring(0, 16).replaceFirst('T', ' '),
                            style: const TextStyle(fontSize: 10, color: Colors.grey),
                          ),
                          isThreeLine: true,
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
