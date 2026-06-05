import 'package:flutter/material.dart';
import '../../api/api_client.dart';

class UserItem {
  final int id;
  final String email;
  final String role;
  final String? phone;
  final bool isActive;
  final String dateJoined;

  UserItem({
    required this.id,
    required this.email,
    required this.role,
    this.phone,
    required this.isActive,
    required this.dateJoined,
  });

  factory UserItem.fromJson(Map<String, dynamic> json) => UserItem(
    id: json['id'],
    email: json['email'],
    role: json['role'],
    phone: json['phone'],
    isActive: json['is_active'] ?? true,
    dateJoined: json['date_joined'] ?? '',
  );
}

class UsersScreen extends StatefulWidget {
  const UsersScreen({super.key});

  @override
  State<UsersScreen> createState() => _UsersScreenState();
}

class _UsersScreenState extends State<UsersScreen> {
  final _api = ApiClient();
  List<UserItem> _users = [];
  List<UserItem> _filtered = [];
  bool _loading = true;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _fetchUsers();
  }

  Future<void> _fetchUsers() async {
    try {
      final res = await _api.dio.get('/auth/users/manage/');
      final list = (res.data as List).map((e) => UserItem.fromJson(e)).toList();
      setState(() {
        _users = list;
        _filtered = list;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  void _onSearch(String q) {
    setState(() {
      _search = q;
      _filtered = _users.where((u) => u.email.toLowerCase().contains(q.toLowerCase())).toList();
    });
  }

  Future<void> _changeRole(UserItem user) async {
    final roles = ['owner', 'admin', 'kasir'];
    final selected = await showDialog<String>(
      context: context,
      builder: (ctx) => SimpleDialog(
        title: Text('Change Role: ${user.email}'),
        children: roles.map((r) => SimpleDialogOption(
          onPressed: () => Navigator.pop(ctx, r),
          child: Text(r.toUpperCase()),
        )).toList(),
      ),
    );
    if (selected == null || selected == user.role) return;
    try {
      await _api.dio.patch('/auth/users/manage/${user.id}/update_role/', data: {'role': selected});
      _fetchUsers();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Role updated')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  Future<void> _toggleActive(UserItem user) async {
    try {
      if (user.isActive) {
        await _api.dio.post('/auth/users/manage/${user.id}/deactivate/');
      } else {
        await _api.dio.post('/auth/users/manage/${user.id}/activate/');
      }
      _fetchUsers();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  Future<void> _deleteUser(UserItem user) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete User'),
        content: Text('Hapus user ${user.email}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Hapus', style: TextStyle(color: Colors.red))),
        ],
      ),
    );
    if (confirm != true) return;
    try {
      await _api.dio.delete('/auth/users/manage/${user.id}/');
      _fetchUsers();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  Color _roleColor(String role) {
    switch (role) {
      case 'owner': return Colors.purple;
      case 'admin': return Colors.blue;
      case 'kasir': return Colors.green;
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(title: const Text('User Management')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Cari user...',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
              ),
              onChanged: _onSearch,
            ),
          ),
          Expanded(
            child: _filtered.isEmpty
                ? const Center(child: Text('Tidak ada user ditemukan'))
                : ListView.builder(
                    itemCount: _filtered.length,
                    itemBuilder: (ctx, i) {
                      final user = _filtered[i];
                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: _roleColor(user.role).withOpacity(0.2),
                            child: Text(user.email[0].toUpperCase(), style: TextStyle(color: _roleColor(user.role))),
                          ),
                          title: Text(user.email),
                          subtitle: Row(
                            children: [
                              Chip(
                                label: Text(user.role, style: const TextStyle(fontSize: 11)),
                                backgroundColor: _roleColor(user.role).withOpacity(0.1),
                                padding: EdgeInsets.zero,
                                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              ),
                              const SizedBox(width: 8),
                              Icon(user.isActive ? Icons.check_circle : Icons.cancel,
                                  size: 16, color: user.isActive ? Colors.green : Colors.red),
                              const SizedBox(width: 4),
                              Text(user.isActive ? 'Active' : 'Inactive', style: const TextStyle(fontSize: 12)),
                            ],
                          ),
                          trailing: PopupMenuButton<String>(
                            onSelected: (action) {
                              switch (action) {
                                case 'role': _changeRole(user); break;
                                case 'toggle': _toggleActive(user); break;
                                case 'delete': _deleteUser(user); break;
                              }
                            },
                            itemBuilder: (ctx) => [
                              const PopupMenuItem(value: 'role', child: Text('Change Role')),
                              PopupMenuItem(value: 'toggle', child: Text(user.isActive ? 'Deactivate' : 'Activate')),
                              const PopupMenuItem(value: 'delete', child: Text('Delete')),
                            ],
                          ),
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
