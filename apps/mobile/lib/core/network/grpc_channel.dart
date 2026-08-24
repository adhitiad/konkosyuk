import 'dart:io';
import 'package:grpc/grpc.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class GrpcChannel {
  final String host;
  final int port;
  final bool useTls;

  late final ClientChannel _channel;
  late final CallOptions? _callOptions;

  GrpcChannel({
    required this.host,
    this.port = 50051,
    this.useTls = true,
    List<String>? interceptors,
  }) {
    _channel = ClientChannel(
      host,
      port: port,
      options: ChannelOptions(
        credentials: useTls ? const ChannelCredentials.secure() : const ChannelCredentials.insecure(),
        idleTimeout: const Duration(minutes: 5),
      ),
    );

    if (interceptors != null && interceptors.isNotEmpty) {
      _callOptions = CallOptions(interceptors: interceptors);
    } else {
      _callOptions = null;
    }
  }

  ClientChannel get channel => _channel;
  CallOptions? get callOptions => _callOptions;

  Future<void> close() async {
    await _channel.shutdown();
  }
}

final grpcChannelProvider = Provider<GrpcChannel>((ref) {
  const host = String.fromEnvironment('GRPC_HOST', defaultValue: 'localhost');
  return GrpcChannel(host: host, port: 50051, useTls: false);
});
