import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/notification_model.dart';
import '../../services/ably_service.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  final String userId;

  const NotificationsScreen({super.key, required this.userId});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  List<NotificationModel> _notifications = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() => _isLoading = true);

    try {
      final missedMessages = await ref.read(ablyMissedMessagesProvider(widget.userId).future);
      final notifications = missedMessages.map((msg) => NotificationModel.fromAblyMessage(msg)).toList();

      setState(() {
        _notifications = notifications;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _markAsRead(List<String> messageIds) async {
    try {
      final service = ref.read(ablyServiceProvider);
      await service.markAsRead(messageIds);
      setState(() {
        _notifications = _notifications.map((n) {
          if (messageIds.contains(n.id)) {
            return NotificationModel(
              id: n.id,
              userId: n.userId,
              title: n.title,
              message: n.message,
              type: n.type,
              referenceId: n.referenceId,
              isRead: true,
              createdAt: n.createdAt,
            );
          }
          return n;
        }).toList();
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal menandai notifikasi: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final notificationsAsync = ref.watch(ablyNotificationsProvider(widget.userId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifikasi'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadNotifications,
          ),
        ],
      ),
      body: notificationsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Error: $error')),
        data: (message) {
          final newNotification = NotificationModel.fromAblyMessage(message);
          setState(() {
            _notifications.insert(0, newNotification);
          });

          if (newNotification.title.isNotEmpty) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(newNotification.title)),
            );
          }

          return _buildNotificationList();
        },
      ),
    );
  }

  Widget _buildNotificationList() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_notifications.isEmpty) {
      return const Center(child: Text('Tidak ada notifikasi'));
    }

    return ListView.builder(
      itemCount: _notifications.length,
      itemBuilder: (context, index) {
        final notification = _notifications[index];
        return ListTile(
          leading: Icon(
            _getIconForType(notification.type),
            color: notification.isRead ? Colors.grey : Colors.blue,
          ),
          title: Text(
            notification.title,
            style: TextStyle(
              fontWeight: notification.isRead ? FontWeight.normal : FontWeight.bold,
            ),
          ),
          subtitle: Text(notification.message),
          trailing: notification.isRead
              ? null
              : IconButton(
                  icon: const Icon(Icons.check_circle_outline),
                  onPressed: () => _markAsRead([notification.id]),
                ),
        );
      },
    );
  }

  IconData _getIconForType(String type) {
    switch (type) {
      case 'booking':
        return Icons.calendar_today;
      case 'payment':
        return Icons.payment;
      case 'chat':
        return Icons.chat_bubble;
      default:
        return Icons.notifications;
    }
  }
}