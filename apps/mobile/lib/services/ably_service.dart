import 'dart:async';
import 'dart:convert';
import 'package:ably_flutter/ably_flutter.dart' as ably;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;

class AblyService {
  final String baseUrl;
  final String? sessionCookie;
  ably.Realtime? _realtime;
  ably.RealtimeChannel? _notificationsChannel;

  AblyService({
    required this.baseUrl,
    this.sessionCookie,
  });

  Future<void> initialize(String userId) async {
    try {
      await _disconnect();
      await _connect(userId);
      await subscribeToUserChannel(userId);
    } catch (e) {
      throw Exception('Gagal inisialisasi Ably: $e');
    }
  }

  Future<void> _connect(String userId) async {
    _realtime = ably.Realtime(
      authCallback: (ably.AblyAuthOptions options, ably.AblyAuthCallback callback) async {
        try {
          final token = await _fetchToken(userId);
          callback(ably.TokenDetails(token: token));
        } catch (e) {
          callback(e, null);
        }
      },
    );

    await _realtime!.connection.onceStateChanges.first;
  }

  Future<String> _fetchToken(String userId) async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (sessionCookie != null && sessionCookie!.isNotEmpty) {
      headers['Cookie'] = sessionCookie!;
    }

    final response = await http.get(
      Uri.parse('$baseUrl/api/ably/auth'),
      headers: headers,
    );

    if (response.statusCode != 200) {
      throw Exception('Gagal mengambil token Ably: ${response.statusCode}');
    }

    final data = json.decode(response.body) as Map<String, dynamic>;
    final token = data['token'] as String?;
    if (token == null || token.isEmpty) {
      throw Exception('Token Ably tidak valid');
    }

    return token;
  }

  Future<void> subscribeToUserChannel(String userId) async {
    if (_realtime == null) {
      throw Exception('Ably belum diinisialisasi');
    }

    final channelName = 'user:$userId:notifications';
    _notificationsChannel = _realtime!.channels.get(channelName);

    await _notificationsChannel!.subscribe();
  }

  Stream<ably.Message> get notificationStream {
    if (_notificationsChannel == null) {
      throw Exception('Channel notifikasi belum disubscribe');
    }
    return _notificationsChannel!.messages.stream;
  }

  Future<List<ably.Message>> fetchMissedMessages(String userId) async {
    if (_notificationsChannel == null) {
      throw Exception('Ably belum diinisialisasi');
    }

    final historyResult = await _notificationsChannel!.history();
    final messages = historyResult.items.toList();
    messages.sort((a, b) => b.timestamp.compareTo(a.timestamp));
    return messages;
  }

  Future<void> markAsRead(List<String> messageIds) async {
    if (messageIds.isEmpty) return;

    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (sessionCookie != null && sessionCookie!.isNotEmpty) {
      headers['Cookie'] = sessionCookie!;
    }

    final response = await http.post(
      Uri.parse('$baseUrl/api/notifications/mark-read'),
      headers: headers,
      body: json.encode({'messageIds': messageIds}),
    );

    if (response.statusCode != 200) {
      throw Exception('Gagal menandai notifikasi sebagai dibaca');
    }
  }

  Future<void> _disconnect() async {
    await _notificationsChannel?.unsubscribe();
    await _realtime?.close();
    _notificationsChannel = null;
    _realtime = null;
  }

  Future<void> disconnect() async {
    await _disconnect();
  }
}

final ablyServiceProvider = Provider<AblyService>((ref) {
  const baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000',
  );
  return AblyService(baseUrl: baseUrl);
});

final ablyInitializedProvider = FutureProvider.family<void, String>((ref, userId) async {
  final service = ref.read(ablyServiceProvider);
  await service.initialize(userId);
});

final ablyNotificationsProvider = StreamProvider.family<ably.Message, String>((ref, userId) {
  final service = ref.read(ablyServiceProvider);
  return service.notificationStream;
});

final ablyMissedMessagesProvider = FutureProvider.family<List<ably.Message>, String>((ref, userId) async {
  final service = ref.read(ablyServiceProvider);
  return service.fetchMissedMessages(userId);
});