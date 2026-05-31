class Category {
  final int id;
  final String name;
  final String slug;
  final String? description;
  final int? parentId;

  Category({
    required this.id,
    required this.name,
    required this.slug,
    this.description,
    this.parentId,
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      slug: json['slug'] ?? '',
      description: json['description'],
      parentId: json['parent'],
    );
  }
}

class Product {
  final int id;
  final String name;
  final String slug;
  final String? sku;
  final String? barcode;
  final String? description;
  final int? categoryId;
  final String? categoryName;
  final String? image;
  final double buyPrice;
  final double sellPrice;
  final int stock;
  final int minStockAlert;
  final String? unit;
  final bool isActive;

  Product({
    required this.id,
    required this.name,
    required this.slug,
    this.sku,
    this.barcode,
    this.description,
    this.categoryId,
    this.categoryName,
    this.image,
    this.buyPrice = 0,
    this.sellPrice = 0,
    this.stock = 0,
    this.minStockAlert = 5,
    this.unit = 'pcs',
    this.isActive = true,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      slug: json['slug'] ?? '',
      sku: json['sku'],
      barcode: json['barcode'],
      description: json['description'],
      categoryId: json['category'],
      categoryName: json['category_name'],
      image: json['image'],
      buyPrice: (json['buy_price'] ?? 0).toDouble(),
      sellPrice: (json['sell_price'] ?? 0).toDouble(),
      stock: json['stock'] ?? 0,
      minStockAlert: json['min_stock_alert'] ?? 5,
      unit: json['unit'] ?? 'pcs',
      isActive: json['is_active'] ?? true,
    );
  }
}
