import 'package:dio/dio.dart';
import '../api_client.dart';
import '../../models/user.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthApi {
  static final _storage = const FlutterSecureStorage();

  static Future<User> login(String email, String password) async {
    final resp = await ApiClient.client.post('auth/login/', data: {
      'email': email,
      'password': password,
    });
    final token = resp.data['token'];
    await _storage.write(key: 'jwt', value: token);
    return User.fromJson(resp.data['user']);
  }

  static Future<User> register(String name, String email, String password) async {
    final resp = await ApiClient.client.post('auth/register/', data: {
      'name': name,
      'email': email,
      'password': password,
    });
    return User.fromJson(resp.data['user']);
  }

  static Future<User> getProfile() async {
    final resp = await ApiClient.client.get('auth/me/');
    return User.fromJson(resp.data);
  }
}
