class Customer {
  final int id;
  final String name;
  final String? email;
  final String? phone;
  final String? address;
  final int loyaltyPoints;
  final bool isActive;

  Customer({
    required this.id,
    required this.name,
    this.email,
    this.phone,
    this.address,
    this.loyaltyPoints = 0,
    this.isActive = true,
  });

  factory Customer.fromJson(Map<String, dynamic> json) {
    return Customer(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      email: json['email'],
      phone: json['phone'],
      address: json['address'],
      loyaltyPoints: json['loyalty_points'] ?? 0,
      isActive: json['is_active'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email ?? '',
      'phone': phone ?? '',
      'address': address ?? '',
    };
  }
}
