import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';
import 'package:dio/dio.dart';

import '../lib/screens/audit/audit_log_screen.dart';
import '../lib/api/api_client.dart';

@GenerateNiceMocks([MockSpec<ApiClient>()])
import 'audit_log_screen_test.mocks.dart';

void main() {
  group('AuditLogScreen', () {
    late MockApiClient mockApi;

    final sampleLogs = [
      {
        'id': 1, 'user_email': 'owner@example.com', 'user_role': 'owner',
        'action': 'create', 'model_name': 'Product', 'object_id': '1',
        'object_repr': 'Test Product', 'detail': 'Created Product',
        'ip_address': '127.0.0.1', 'created_at': '2025-06-01T10:00:00Z',
      },
      {
        'id': 2, 'user_email': 'admin@example.com', 'user_role': 'admin',
        'action': 'update', 'model_name': 'User', 'object_id': '2',
        'object_repr': 'admin@example.com', 'detail': 'Updated User',
        'ip_address': '192.168.1.1', 'created_at': '2025-06-01T11:00:00Z',
      },
      {
        'id': 3, 'user_email': 'kasir@example.com', 'user_role': 'kasir',
        'action': 'login', 'model_name': 'User', 'object_id': '',
        'object_repr': 'kasir@example.com', 'detail': 'User logged in',
        'ip_address': null, 'created_at': '2025-06-01T12:00:00Z',
      },
    ];

    setUp(() {
      mockApi = MockApiClient();
    });

    testWidgets('shows loading indicator initially', (tester) async {
      when(mockApi.dio.get('/auth/audit-log/', queryParameters: anyNamed('queryParameters'))).thenAnswer(
        (_) async => Response(data: sampleLogs, statusCode: 200, requestOptions: RequestOptions(path: '')),
      );

      await tester.pumpWidget(MaterialApp(home: AuditLogScreen()));
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('renders log entries after loading', (tester) async {
      when(mockApi.dio.get('/auth/audit-log/', queryParameters: anyNamed('queryParameters'))).thenAnswer(
        (_) async => Response(data: sampleLogs, statusCode: 200, requestOptions: RequestOptions(path: '')),
      );

      await tester.pumpWidget(MaterialApp(home: AuditLogScreen()));
      await tester.pumpAndSettle();

      expect(find.text('Test Product'), findsOneWidget);
      expect(find.text('Created Product'), findsOneWidget);
    });

    testWidgets('shows action chips', (tester) async {
      when(mockApi.dio.get('/auth/audit-log/', queryParameters: anyNamed('queryParameters'))).thenAnswer(
        (_) async => Response(data: sampleLogs, statusCode: 200, requestOptions: RequestOptions(path: '')),
      );

      await tester.pumpWidget(MaterialApp(home: AuditLogScreen()));
      await tester.pumpAndSettle();

      expect(find.text('create'), findsOneWidget);
      expect(find.text('update'), findsOneWidget);
      expect(find.text('login'), findsOneWidget);
    });

    testWidgets('shows user emails', (tester) async {
      when(mockApi.dio.get('/auth/audit-log/', queryParameters: anyNamed('queryParameters'))).thenAnswer(
        (_) async => Response(data: sampleLogs, statusCode: 200, requestOptions: RequestOptions(path: '')),
      );

      await tester.pumpWidget(MaterialApp(home: AuditLogScreen()));
      await tester.pumpAndSettle();

      expect(find.text('owner@example.com'), findsOneWidget);
      expect(find.text('admin@example.com'), findsOneWidget);
    });

    testWidgets('shows IP address when present', (tester) async {
      when(mockApi.dio.get('/auth/audit-log/', queryParameters: anyNamed('queryParameters'))).thenAnswer(
        (_) async => Response(data: sampleLogs, statusCode: 200, requestOptions: RequestOptions(path: '')),
      );

      await tester.pumpWidget(MaterialApp(home: AuditLogScreen()));
      await tester.pumpAndSettle();

      expect(find.text('127.0.0.1'), findsOneWidget);
      expect(find.text('192.168.1.1'), findsOneWidget);
    });

    testWidgets('shows empty state when no logs', (tester) async {
      when(mockApi.dio.get('/auth/audit-log/', queryParameters: anyNamed('queryParameters'))).thenAnswer(
        (_) async => Response(data: [], statusCode: 200, requestOptions: RequestOptions(path: '')),
      );

      await tester.pumpWidget(MaterialApp(home: AuditLogScreen()));
      await tester.pumpAndSettle();

      expect(find.text('No audit log entries'), findsOneWidget);
    });

    testWidgets('shows Audit Log title', (tester) async {
      when(mockApi.dio.get('/auth/audit-log/', queryParameters: anyNamed('queryParameters'))).thenAnswer(
        (_) async => Response(data: sampleLogs, statusCode: 200, requestOptions: RequestOptions(path: '')),
      );

      await tester.pumpWidget(MaterialApp(home: AuditLogScreen()));
      await tester.pumpAndSettle();

      expect(find.text('Audit Log'), findsOneWidget);
    });

    testWidgets('has filter dropdown', (tester) async {
      when(mockApi.dio.get('/auth/audit-log/', queryParameters: anyNamed('queryParameters'))).thenAnswer(
        (_) async => Response(data: sampleLogs, statusCode: 200, requestOptions: RequestOptions(path: '')),
      );

      await tester.pumpWidget(MaterialApp(home: AuditLogScreen()));
      await tester.pumpAndSettle();

      expect(find.text('Filter Action'), findsOneWidget);
    });
  });
}
