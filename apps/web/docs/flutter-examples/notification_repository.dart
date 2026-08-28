import 'dart:convert';
import 'package:http/http.dart' as http';

class NotificationRepository {
  static const String _baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'https://your-domain.com',
  );

  final http.Client _client;
  final String _authToken;

  NotificationRepository({
    http.Client? client,
    required String authToken,
  })  : _client = client ?? http.Client(),
        _authToken = authToken;

  Future<List<Notification>> getNotifications({int limit = 50}) async {
    final response = await _client.get(
      Uri.parse('$_baseUrl/api/notifications?limit=$limit'),
      headers: {
        'Authorization': 'Bearer $_authToken',
        'Content-Type': 'application/json',
      },
    );

    final data = _handleResponse(response);
    final notificationsJson = data['notifications'] as List<dynamic>;

    return notificationsJson
        .map((json) => Notification.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  Future<void> markAsRead(String notificationId) async {
    final response = await _client.patch(
      Uri.parse('$_baseUrl/api/notifications'),
      headers: {
        'Authorization': 'Bearer $_authToken',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'notificationId': notificationId,
      }),
    );

    _handleResponse(response);
  }

  Future<void> markAllAsRead() async {
    final notifications = await getNotifications();

    for (final notification in notifications) {
      if (!notification.isRead) {
        await markAsRead(notification.id);
      }
    }
  }

  Future<NotificationPreferences> getPreferences() async {
    final response = await _client.get(
      Uri.parse('$_baseUrl/api/notifications/preferences'),
      headers: {
        'Authorization': 'Bearer $_authToken',
        'Content-Type': 'application/json',
      },
    );

    final data = _handleResponse(response);
    return NotificationPreferences.fromJson(data['preferences']);
  }

  Future<void> updatePreferences(NotificationPreferences preferences) async {
    final response = await _client.patch(
      Uri.parse('$_baseUrl/api/notifications/preferences'),
      headers: {
        'Authorization': 'Bearer $_authToken',
        'Content-Type': 'application/json',
      },
      body: jsonEncode(preferences.toJson()),
    );

    _handleResponse(response);
  }

  dynamic _handleResponse(http.Response response) {
    final data = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data;
    }

    throw ApiException(
      response.statusCode,
      data['error'] ?? 'Unknown error',
      details: data['details'],
    );
  }
}

class ApiException implements Exception {
  final int statusCode;
  final String message;
  final Map<String, dynamic>? details;

  ApiException(this.statusCode, this.message, {this.details});

  @override
  String toString() => 'ApiException($statusCode): $message';
}
