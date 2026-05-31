class User {
  final int id;
  final String email;
  final String role;
  final String? phone;
  final String? avatar;

  User({
    required this.id,
    required this.email,
    required this.role,
    this.phone,
    this.avatar,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? 0,
      email: json['email'] ?? '',
      role: json['role'] ?? 'kasir',
      phone: json['phone'],
      avatar: json['avatar'],
    );
  }
}
