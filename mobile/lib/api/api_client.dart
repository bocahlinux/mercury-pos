import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'models/user.dart';
import 'models/product.dart';
import 'models/transaction.dart';
import 'models/customer.dart';
import 'models/invoice.dart';

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

  /// Extract list from response — handles both paginated {results: [...]} and plain [...]
  List<dynamic> _extractList(dynamic data) {
    if (data is List) return data;
    if (data is Map && data['results'] is List) return data['results'] as List;
    return [];
  }

  // ─── Auth ───────────────────────────────────────────

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _dio.post('/auth/login/', data: {'email': email, 'password': password});
    return response.data;  // {access, refresh, user}
  }

  Future<Map<String, dynamic>> register(Map<String, dynamic> data) async {
    final response = await _dio.post('/auth/register/', data: data);
    return response.data;
  }

  Future<User> getProfile() async {
    final response = await _dio.get('/auth/profile/');
    return User.fromJson(response.data);
  }

  // ─── Products ───────────────────────────────────────

  Future<List<Product>> getProducts({String? search, int? category}) async {
    final response = await _dio.get('/products/products/', queryParameters: {
      if (search != null) 'search': search,
      if (category != null) 'category': category,
    });
    return _extractList(response.data).map((e) => Product.fromJson(e)).toList();
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

  // ─── Invoices ────────────────────────────────────────
  // InvoiceViewSet registered under r"invoices" in invoices/urls.py,
  // included from "api/invoices/" in root. Full path = /api/invoices/invoices/

  Future<List<Invoice>> getInvoices({String? status, String? search, String? dateFrom, String? dateTo}) async {
    final response = await _dio.get('/invoices/invoices/', queryParameters: {
      if (status != null && status.isNotEmpty) 'status': status,
      if (search != null && search.isNotEmpty) 'invoice_number': search,
      if (dateFrom != null && dateFrom.isNotEmpty) 'date_from': dateFrom,
      if (dateTo != null && dateTo.isNotEmpty) 'date_to': dateTo,
    });
    return _extractList(response.data).map((e) => Invoice.fromJson(e)).toList();
  }

  Future<Invoice> getInvoice(int id) async {
    final response = await _dio.get('/invoices/invoices/$id/');
    return Invoice.fromJson(response.data);
  }

  Future<void> generateInvoicePdf(int id) async {
    await _dio.post('/invoices/invoices/$id/generate_pdf/');
  }

  Future<void> markInvoicePaid(int id) async {
    await _dio.post('/invoices/invoices/$id/mark_paid/');
  }

  Future<void> cancelInvoice(int id) async {
    await _dio.post('/invoices/invoices/$id/cancel/');
  }

  // ─── Categories ─────────────────────────────────────

  Future<List<Category>> getCategories() async {
    final response = await _dio.get('/products/categories/');
    return _extractList(response.data).map((e) => Category.fromJson(e)).toList();
  }

  /// Note: TransactionViewSet is registered under r"transactions" in transactions/urls.py,
  /// included from "api/transactions/" in root urls. Full path = /api/transactions/transactions/

  // ─── Transactions ───────────────────────────────────

  Future<List<Transaction>> getTransactions({String? status, String? dateFrom, String? dateTo}) async {
    final response = await _dio.get('/transactions/transactions/', queryParameters: {
      if (status != null) 'status': status,
      if (dateFrom != null) 'date_from': dateFrom,
      if (dateTo != null) 'date_to': dateTo,
    });
    return _extractList(response.data).map((e) => Transaction.fromJson(e)).toList();
  }

  Future<Transaction> getTransaction(int id) async {
    final response = await _dio.get('/transactions/transactions/$id/');
    return Transaction.fromJson(response.data);
  }

  Future<Transaction> createTransaction(Map<String, dynamic> data) async {
    final response = await _dio.post('/transactions/transactions/', data: data);
    return Transaction.fromJson(response.data);
  }

  Future<Transaction> holdTransaction(int id) async {
    final response = await _dio.post('/transactions/transactions/$id/hold/');
    return Transaction.fromJson(response.data);
  }

  Future<Transaction> resumeTransaction(int id) async {
    final response = await _dio.post('/transactions/transactions/$id/resume/');
    return Transaction.fromJson(response.data);
  }

  Future<Transaction> cancelTransaction(int id) async {
    final response = await _dio.post('/transactions/transactions/$id/cancel/');
    return Transaction.fromJson(response.data);
  }

  Future<Transaction> refundTransaction(int id, {String reason = 'Refund'}) async {
    final response = await _dio.post('/transactions/transactions/$id/refund/', data: {'reason': reason});
    return Transaction.fromJson(response.data);
  }

  Future<void> printReceipt(int id) async {
    // Just fetch receipt data — actual printing needs platform channel
    await _dio.get('/transactions/transactions/$id/receipt/');
  }

  // ─── Customers ──────────────────────────────────────
  // CustomerViewSet registered under r"" in customers/urls.py,
  // included from "api/customers/" in root. Full path = /api/customers/ (single prefix, OK)

  Future<List<Customer>> getCustomers({String? search}) async {
    final response = await _dio.get('/customers/', queryParameters: {
      if (search != null) 'search': search,
    });
    return _extractList(response.data).map((e) => Customer.fromJson(e)).toList();
  }

  Future<Customer> createCustomer(Map<String, dynamic> data) async {
    final response = await _dio.post('/customers/', data: data);
    return Customer.fromJson(response.data);
  }

  Future<Customer> updateCustomer(int id, Map<String, dynamic> data) async {
    final response = await _dio.patch('/customers/$id/', data: data);
    return Customer.fromJson(response.data);
  }

  // ─── Dashboard ──────────────────────────────────────

  Future<Map<String, dynamic>> getDashboard() async {
    final response = await _dio.get('/reports/dashboard/');
    return response.data;
  }

  // ─── Reports ─────────────────────────────────────────

  Future<Map<String, dynamic>> getSalesReport({String period = 'daily', String? dateFrom, String? dateTo}) async {
    final response = await _dio.get('/reports/sales-report/', queryParameters: {
      'period': period,
      if (dateFrom != null && dateFrom.isNotEmpty) 'date_from': dateFrom,
      if (dateTo != null && dateTo.isNotEmpty) 'date_to': dateTo,
    });
    return response.data;
  }

  Future<List<dynamic>> getProductReport({String? dateFrom, String? dateTo}) async {
    final response = await _dio.get('/reports/product-report/', queryParameters: {
      if (dateFrom != null && dateFrom.isNotEmpty) 'date_from': dateFrom,
      if (dateTo != null && dateTo.isNotEmpty) 'date_to': dateTo,
    });
    return _extractList(response.data['data']);
  }

  Future<List<dynamic>> getCustomerReport({String? dateFrom, String? dateTo}) async {
    final response = await _dio.get('/reports/customer-report/', queryParameters: {
      if (dateFrom != null && dateFrom.isNotEmpty) 'date_from': dateFrom,
      if (dateTo != null && dateTo.isNotEmpty) 'date_to': dateTo,
    });
    return _extractList(response.data['data']);
  }

  // ─── Store Settings ─────────────────────────────────
  // StoreSettingsViewSet registered under r"" in core/urls.py,
  // included from "api/settings/" in root. Full path = /api/settings/ (single prefix, OK)

  Future<Map<String, dynamic>> getStoreSettings() async {
    final response = await _dio.get('/settings/');
    return response.data;
  }
}
