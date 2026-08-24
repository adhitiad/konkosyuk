import 'dart:io';
import 'package:grpc/grpc.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../network/grpc_channel.dart';
import 'package:gen/konkosyuk/v1/auth.pbgrpc.dart';

class AuthGrpcClient {
  final GrpcChannel channel;
  final FlutterSecureStorage storage;
  late final AuthServiceClient _client;

  AuthGrpcClient({
    required this.channel,
    required this.storage,
  }) : _client = AuthServiceClient(channel.channel);

  CallOptions _withToken() {
    return CallOptions(metadata: {
      'authorization': 'Bearer ${storage.readSync('access_token') ?? ''}',
    });
  }

  Future<void> register({
    required String email,
    required String password,
    required String name,
    String? phone,
  }) async {
    try {
      final response = await _client.register(
        RegisterRequest(
          email: email,
          password: password,
          name: name,
          phone: phone ?? '',
        ),
        options: _withToken(),
      );
      await storage.write(key: 'access_token', value: response.token);
    } catch (e) {
      throw Exception('Register failed: $e');
    }
  }

  Future<void> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _client.login(
        LoginRequest(email: email, password: password),
      );
      await storage.write(key: 'access_token', value: response.token);
    } catch (e) {
      throw Exception('Login failed: $e');
    }
  }

  Future<User> getMe() async {
    try {
      final response = await _client.getMe(
        GetMeRequest(),
        options: _withToken(),
      );
      return response.user;
    } catch (e) {
      throw Exception('GetMe failed: $e');
    }
  }

  Future<void> logout() async {
    try {
      await _client.logout(LogoutRequest(), options: _withToken());
      await storage.delete(key: 'access_token');
    } catch (e) {
      throw Exception('Logout failed: $e');
    }
  }
}

final authGrpcClientProvider = Provider<AuthGrpcClient>((ref) {
  final channel = ref.watch(grpcChannelProvider);
  final storage = const FlutterSecureStorage();
  return AuthGrpcClient(channel: channel, storage: storage);
});
