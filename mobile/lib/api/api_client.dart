import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'models/user.dart';
import 'models/product.dart';
import 'models/transaction.dart';
import 'models/customer.dart';

class ApiClient {
  static const String baseUrl = 'http://localhost:8000/api';
  final Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  ApiClient() : _dio = Dio(BaseOptions(
    baseUrl: baseUrl,
    connectTimeout: const Duration(seconds: 30),
    receiveTimeout: const Duration(seconds: 30),
    headers: {'Content-Type': 'application/json'},
  )) {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'access_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          final refreshed = await _refreshToken();
          if (refreshed) {
            final token = await _storage.read(key: 'access_token');
            error.requestOptions.headers['Authorization'] = 'Bearer $token';
            final response = await _dio.fetch(error.requestOptions);
            handler.resolve(response);
            return;
          }
        }
        handler.next(error);
      },
    ));
  }

  Future<bool> _refreshToken() async {
    try {
      final refresh = await _storage.read(key: 'refresh_token');
      if (refresh == null) return false;
      final response = await _dio.post('/auth/token/refresh/', data: {'refresh': refresh});
      await _storage.write(key: 'access_token', value: response.data['access']);
      return true;
    } catch (_) {
      return false;
    }
  }

  // Auth
  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _dio.post('/auth/login/', data: {'email': email, 'password': password});
    return response.data;
  }

  Future<Map<String, dynamic>> register(Map<String, dynamic> data) async {
    final response = await _dio.post('/auth/register/', data: data);
    return response.data;
  }

  Future<User> getProfile() async {
    final response = await _dio.get('/auth/profile/');
    return User.fromJson(response.data);
  }

  // Products
  Future<List<Product>> getProducts({String? search, int? category}) async {
    final response = await _dio.get('/products/products/', queryParameters: {
      if (search != null) 'search': search,
      if (category != null) 'category': category,
    });
    return (response.data['results'] as List).map((e) => Product.fromJson(e)).toList();
  }

  Future<Product> getProduct(int id) async {
    final response = await _dio.get('/products/products/$id/');
    return Product.fromJson(response.data);
  }

  Future<Product> createProduct(Map<String, dynamic> data) async {
    final response = await _dio.post('/products/products/', data: data);
    return Product.fromJson(response.data);
  }

  Future<Product> updateProduct(int id, Map<String, dynamic> data) async {
    final response = await _dio.patch('/products/products/$id/', data: data);
    return Product.fromJson(response.data);
  }

  Future<void> deleteProduct(int id) async {
    await _dio.delete('/products/products/$id/');
  }

  // Categories
  Future<List<Category>> getCategories() async {
    final response = await _dio.get('/products/categories/');
    return (response.data['results'] as List).map((e) => Category.fromJson(e)).toList();
  }

  // Transactions
  Future<List<Transaction>> getTransactions({String? status, String? dateFrom, String? dateTo}) async {
    final response = await _dio.get('/transactions/', queryParameters: {
      if (status != null) 'status': status,
      if (dateFrom != null) 'date_from': dateFrom,
      if (dateTo != null) 'date_to': dateTo,
    });
    return (response.data['results'] as List).map((e) => Transaction.fromJson(e)).toList();
  }

  Future<Transaction> getTransaction(int id) async {
    final response = await _dio.get('/transactions/$id/');
    return Transaction.fromJson(response.data);
  }

  Future<Transaction> createTransaction(Map<String, dynamic> data) async {
    final response = await _dio.post('/transactions/', data: data);
    return Transaction.fromJson(response.data);
  }

  Future<Transaction> holdTransaction(int id) async {
    final response = await _dio.post('/transactions/$id/hold/');
    return Transaction.fromJson(response.data);
  }

  Future<Transaction> cancelTransaction(int id) async {
    final response = await _dio.post('/transactions/$id/cancel/');
    return Transaction.fromJson(response.data);
  }

  // Customers
  Future<List<Customer>> getCustomers({String? search}) async {
    final response = await _dio.get('/customers/', queryParameters: {
      if (search != null) 'search': search,
    });
    return (response.data['results'] as List).map((e) => Customer.fromJson(e)).toList();
  }

  Future<Customer> createCustomer(Map<String, dynamic> data) async {
    final response = await _dio.post('/customers/', data: data);
    return Customer.fromJson(response.data);
  }

  Future<Customer> updateCustomer(int id, Map<String, dynamic> data) async {
    final response = await _dio.patch('/customers/$id/', data: data);
    return Customer.fromJson(response.data);
  }

  // Dashboard
  Future<Map<String, dynamic>> getDashboard() async {
    final response = await _dio.get('/reports/dashboard/');
    return response.data;
  }

  // Store Settings
  Future<Map<String, dynamic>> getStoreSettings() async {
    final response = await _dio.get('/settings/');
    return response.data;
  }
}
