import 'package:ably_flutter/ably_flutter.dart' as ably;

class NotificationModel {
  final String id;
  final String userId;
  final String title;
  final String message;
  final String type;
  final String? referenceId;
  final bool isRead;
  final DateTime createdAt;

  NotificationModel({
    required this.id,
    required this.userId,
    required this.title,
    required this.message,
    required this.type,
    this.referenceId,
    required this.isRead,
    required this.createdAt,
  });

  factory NotificationModel.fromAblyMessage(ably.Message message) {
    final data = message.data as Map<String, dynamic>;
    return NotificationModel(
      id: message.id ?? message.name ?? DateTime.now().millisecondsSinceEpoch.toString(),
      userId: data['userId'] as String,
      title: data['title'] as String,
      message: data['message'] as String,
      type: data['type'] as String,
      referenceId: data['referenceId'] as String?,
      isRead: false,
      createdAt: message.timestamp ?? DateTime.now(),
    );
  }
}