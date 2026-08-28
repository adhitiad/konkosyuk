import 'dart:convert';
import 'package:ably/ably';
import 'package:flutter/foundation.dart';

enum NotificationChannel { inApp, email, push }

class NotificationPreferences {
  final Map<String, ChannelPreferences> preferences;
  final String emailDigest;
  final String? quietHoursStart;
  final String? quietHoursEnd;
  final String timezone;

  NotificationPreferences({
    required this.preferences,
    required this.emailDigest,
    this.quietHoursStart,
    this.quietHoursEnd,
    this.timezone = 'Asia/Jakarta',
  });

  factory NotificationPreferences.fromJson(Map<String, dynamic> json) {
    final prefsJson = json['preferences'] as Map<String, dynamic>;
    final preferences = <String, ChannelPreferences>{};

    for (final entry in prefsJson.entries) {
      final channelJson = entry.value as Map<String, dynamic>;
      preferences[entry.key] = ChannelPreferences(
        inApp: channelJson['inApp'] as bool,
        email: channelJson['email'] as bool,
        push: channelJson['push'] as bool,
      );
    }

    return NotificationPreferences(
      preferences: preferences,
      emailDigest: json['emailDigest'] as String? ?? 'immediate',
      quietHoursStart: json['quietHoursStart'] as String?,
      quietHoursEnd: json['quietHoursEnd'] as String?,
      timezone: json['timezone'] as String? ?? 'Asia/Jakarta',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'preferences': preferences.map(
        (key, value) => MapEntry(key, value.toJson()),
      ),
      'emailDigest': emailDigest,
      'quietHoursStart': quietHoursStart,
      'quietHoursEnd': quietHoursEnd,
      'timezone': timezone,
    };
  }
}

class ChannelPreferences {
  final bool inApp;
  final bool email;
  final bool push;

  ChannelPreferences({
    required this.inApp,
    required this.email,
    required this.push,
  });

  factory ChannelPreferences.fromJson(Map<String, dynamic> json) {
    return ChannelPreferences(
      inApp: json['inApp'] as bool,
      email: json['email'] as bool,
      push: json['push'] as bool,
    );
  }

  Map<String, dynamic> toJson() {
    return {'inApp': inApp, 'email': email, 'push': push};
  }
}

class AblyService {
  static const String _baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'https://your-domain.com',
  );

  AblyRealtime? _ably;
  RealtimeChannel? _notificationChannel;
  final String _authToken;
  final String _userId;

  final ValueNotifier<bool> isConnected = ValueNotifier(false);
  final ValueNotifier<String?> lastError = ValueNotifier(null);

  AblyService({
    required String authToken,
    required String userId,
  })  : _authToken = authToken,
        _userId = userId;

  Future<void> initialize() async {
    try {
      final options = AblyOptions(
        authUrl: '$_baseUrl/api/ably/auth',
        token: _authToken,
      );

      _ably = AblyRealtime(options: options);

      await _ably!.connection.onceReady;

      _notificationChannel = _ably!.channels.get(
        'user:$_userId:notifications',
      );

      await _notificationChannel!.subscribe('notification:new', _onNewNotification);

      isConnected.value = true;
      lastError.value = null;
    } catch (e) {
      lastError.value = e.toString();
      isConnected.value = false;
      rethrow;
    }
  }

  void _onNewNotification(Message message) {
    final data = message.data as Map<String, dynamic>;
    final notification = Notification.fromJson(data);

    // Notify Flutter app about new notification
    // This can be used with a state management solution like Provider/Riverpod
    debugPrint('New notification: ${notification.title}');
  }

  Future<List<Notification>> getMissedNotifications({int limit = 50}) async {
    if (_notificationChannel == null) {
      throw StateError('Ably service not initialized');
    }

    final result = await _notificationChannel!.history(limit: limit);

    return result.items.map((message) {
      return Notification.fromJson(message.data as Map<String, dynamic>);
    }).toList();
  }

  Future<void> dispose() async {
    await _notificationChannel?.unsubscribe();
    await _ably?.close();
    isConnected.value = false;
  }
}

class Notification {
  final String id;
  final String userId;
  final String type;
  final String title;
  final String message;
  final String? actionUrl;
  final String? actionLabel;
  final String? referenceId;
  final String? referenceType;
  final Map<String, dynamic>? metadata;
  final bool isRead;
  final DateTime createdAt;

  Notification({
    required this.id,
    required this.userId,
    required this.type,
    required this.title,
    required this.message,
    this.actionUrl,
    this.actionLabel,
    this.referenceId,
    this.referenceType,
    this.metadata,
    required this.isRead,
    required this.createdAt,
  });

  factory Notification.fromJson(Map<String, dynamic> json) {
    return Notification(
      id: json['id'] as String,
      userId: json['userId'] as String,
      type: json['type'] as String,
      title: json['title'] as String,
      message: json['message'] as String,
      actionUrl: json['actionUrl'] as String?,
      actionLabel: json['actionLabel'] as String?,
      referenceId: json['referenceId'] as String?,
      referenceType: json['referenceType'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>?,
      isRead: json['isRead'] as bool,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'type': type,
      'title': title,
      'message': message,
      'actionUrl': actionUrl,
      'actionLabel': actionLabel,
      'referenceId': referenceId,
      'referenceType': referenceType,
      'metadata': metadata,
      'isRead': isRead,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
