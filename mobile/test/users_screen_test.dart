import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';
import 'package:dio/dio.dart';

import '../lib/screens/users/users_screen.dart';
import '../lib/api/api_client.dart';

// Generate mocks
@GenerateNiceMocks([MockSpec<ApiClient>()])
import 'users_screen_test.mocks.dart';

void main() {
  group('UsersScreen', () {
    late MockApiClient mockApi;

    final sampleUsers = [
      {'id': 1, 'email': 'owner@example.com', 'role': 'owner', 'phone': '08123', 'is_active': true, 'date_joined': '2025-01-01'},
      {'id': 2, 'email': 'admin@example.com', 'role': 'admin', 'phone': '', 'is_active': true, 'date_joined': '2025-02-01'},
      {'id': 3, 'email': 'kasir@example.com', 'role': 'kasir', 'phone': '08567', 'is_active': false, 'date_joined': '2025-03-01'},
    ];

    setUp(() {
      mockApi = MockApiClient();
    });

    testWidgets('shows loading indicator initially', (tester) async {
      when(mockApi.dio.get('/auth/users/manage/')).thenAnswer(
        (_) async => Response(data: sampleUsers, statusCode: 200, requestOptions: RequestOptions(path: '')),
      );

      await tester.pumpWidget(MaterialApp(home: UsersScreen()));
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('renders user list after loading', (tester) async {
      when(mockApi.dio.get('/auth/users/manage/')).thenAnswer(
        (_) async => Response(data: sampleUsers, statusCode: 200, requestOptions: RequestOptions(path: '')),
      );

      await tester.pumpWidget(MaterialApp(home: UsersScreen()));
      await tester.pumpAndSettle();

      expect(find.text('owner@example.com'), findsOneWidget);
      expect(find.text('admin@example.com'), findsOneWidget);
      expect(find.text('kasir@example.com'), findsOneWidget);
    });

    testWidgets('shows role chips', (tester) async {
      when(mockApi.dio.get('/auth/users/manage/')).thenAnswer(
        (_) async => Response(data: sampleUsers, statusCode: 200, requestOptions: RequestOptions(path: '')),
      );

      await tester.pumpWidget(MaterialApp(home: UsersScreen()));
      await tester.pumpAndSettle();

      expect(find.text('owner'), findsOneWidget);
      expect(find.text('admin'), findsOneWidget);
      expect(find.text('kasir'), findsOneWidget);
    });

    testWidgets('shows active/inactive status', (tester) async {
      when(mockApi.dio.get('/auth/users/manage/')).thenAnswer(
        (_) async => Response(data: sampleUsers, statusCode: 200, requestOptions: RequestOptions(path: '')),
      );

      await tester.pumpWidget(MaterialApp(home: UsersScreen()));
      await tester.pumpAndSettle();

      // 2 active, 1 inactive
      expect(find.text('Active'), findsNWidgets(2));
      expect(find.text('Inactive'), findsOneWidget);
    });

    testWidgets('filters users by search', (tester) async {
      when(mockApi.dio.get('/auth/users/manage/')).thenAnswer(
        (_) async => Response(data: sampleUsers, statusCode: 200, requestOptions: RequestOptions(path: '')),
      );

      await tester.pumpWidget(MaterialApp(home: UsersScreen()));
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextField), 'admin');
      await tester.pumpAndSettle();

      expect(find.text('admin@example.com'), findsOneWidget);
      expect(find.text('kasir@example.com'), findsNothing);
    });

    testWidgets('shows empty state when no users match', (tester) async {
      when(mockApi.dio.get('/auth/users/manage/')).thenAnswer(
        (_) async => Response(data: sampleUsers, statusCode: 200, requestOptions: RequestOptions(path: '')),
      );

      await tester.pumpWidget(MaterialApp(home: UsersScreen()));
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextField), 'nonexistent');
      await tester.pumpAndSettle();

      expect(find.text('Tidak ada user ditemukan'), findsOneWidget);
    });

    testWidgets('shows User Management title', (tester) async {
      when(mockApi.dio.get('/auth/users/manage/')).thenAnswer(
        (_) async => Response(data: sampleUsers, statusCode: 200, requestOptions: RequestOptions(path: '')),
      );

      await tester.pumpWidget(MaterialApp(home: UsersScreen()));
      await tester.pumpAndSettle();

      expect(find.text('User Management'), findsOneWidget);
    });
  });
}
