import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:mobile/services/ably_service.dart';
import 'package:mobile/features/notifications/presentation/notifications_screen.dart';

void main() {
  runApp(const ProviderScope(child: MyApp()));
}

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp(
      title: 'KonkosYuk Mobile',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.teal),
        useMaterial3: true,
      ),
      home: const LoginExample(),
    );
  }
}

class LoginExample extends ConsumerWidget {
  const LoginExample({super.key});

  Future<void> _loginAndInitializeAbly(WidgetRef ref, String userId) async {
    final ablyService = ref.read(ablyServiceProvider);

    try {
      await ablyService.initialize(userId);

      if (ref.context.mounted) {
        ScaffoldMessenger.of(ref.context).showSnackBar(
          const SnackBar(content: Text('Notifikasi real-time aktif')),
        );
      }
    } catch (e) {
      if (ref.context.mounted) {
        ScaffoldMessenger.of(ref.context).showSnackBar(
          SnackBar(content: Text('Gagal inisialisasi notifikasi: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Login')),
      body: Center(
        child: ElevatedButton(
          onPressed: () => _loginAndInitializeAbly(ref, 'user-123'),
          child: const Text('Login & Aktifkan Notifikasi'),
        ),
      ),
    );
  }
}

class MainScreen extends ConsumerStatefulWidget {
  final String userId;

  const MainScreen({super.key, required this.userId});

  @override
  ConsumerState<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends ConsumerState<MainScreen> {
  late final StreamSubscription<ConnectivityResult> _connectivitySubscription;

  @override
  void initState() {
    super.initState();
    _connectivitySubscription = Connectivity()
        .onConnectivityChanged
        .listen((result) => _onConnectivityChanged(result));
  }

  Future<void> _onConnectivityChanged(ConnectivityResult result) async {
    if (result == ConnectivityResult.none) return;

    final ablyService = ref.read(ablyServiceProvider);
    try {
      final missedMessages = await ablyService.fetchMissedMessages(widget.userId);
      for (final message in missedMessages) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Notifikasi tertunda: ${message.name}')),
          );
        }
      }
    } catch (e) {
      debugPrint('Gagal memuat notifikasi tertunda: $e');
    }
  }

  @override
  void dispose() {
    _connectivitySubscription.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return NotificationsScreen(userId: widget.userId);
  }
}