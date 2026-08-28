import 'dart:convert';
import 'package:http/http.dart' as http;

class AuthException implements Exception {
  final int statusCode;
  final String message;
  final Map<String, dynamic>? details;

  AuthException(this.statusCode, this.message, {this.details});

  @override
  String toString() => 'AuthException($statusCode): $message';
}

class AuthService {
  static const String _baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'https://your-domain.com',
  );

  final http.Client _client;
  final FlutterSecureStorage _storage;

  AuthService({
    http.Client? client,
    FlutterSecureStorage? storage,
  })  : _client = client ?? http.Client(),
        _storage = storage ?? const FlutterSecureStorage();

  Future<AuthResponse> login({
    required String email,
    required String password,
  }) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/api/auth/sign-in/email'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
      }),
    );

    final data = _handleResponse(response);

    await _saveToken(data['token'] as String);

    return AuthResponse.fromJson(data);
  }

  Future<AuthResponse> register({
    required String email,
    required String password,
    required String name,
  }) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/api/auth/sign-up/email'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
        'name': name,
      }),
    );

    final data = _handleResponse(response);

    await _saveToken(data['token'] as String);

    return AuthResponse.fromJson(data);
  }

  Future<User?> getSession() async {
    final token = await _getToken();
    if (token == null) return null;

    final response = await _client.get(
      Uri.parse('$_baseUrl/api/auth/get-session'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 401) {
      await _clearToken();
      return null;
    }

    final data = _handleResponse(response);
    return User.fromJson(data['user'] as Map<String, dynamic>);
  }

  Future<void> logout() async {
    final token = await _getToken();
    if (token != null) {
      try {
        await _client.post(
          Uri.parse('$_baseUrl/api/auth/sign-out'),
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        );
      } catch (e) {
        // Ignore logout errors
      }
    }

    await _clearToken();
  }

  Future<String?> _getToken() async {
    return await _storage.read(key: 'auth_token');
  }

  Future<void> _saveToken(String token) async {
    await _storage.write(key: 'auth_token', value: token);
  }

  Future<void> _clearToken() async {
    await _storage.delete(key: 'auth_token');
  }

  dynamic _handleResponse(http.Response response) {
    final data = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data;
    }

    throw AuthException(
      response.statusCode,
      data['error'] ?? 'Unknown error',
      details: data['details'],
    );
  }
}

class AuthResponse {
  final String token;
  final User user;

  AuthResponse({required this.token, required this.user});

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      token: json['token'] as String,
      user: User.fromJson(json['user'] as Map<String, dynamic>),
    );
  }
}

class User {
  final String id;
  final String email;
  final String name;
  final String role;
  final String? phone;
  final String? image;
  final String? province;
  final String? city;
  final String? district;
  final String? kycStatus;
  final double? reputationScore;
  final double? balance;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  User({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.phone,
    this.image,
    this.province,
    this.city,
    this.district,
    this.kycStatus,
    this.reputationScore,
    this.balance,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String,
      role: json['role'] as String,
      phone: json['phone'] as String?,
      image: json['image'] as String?,
      province: json['province'] as String?,
      city: json['city'] as String?,
      district: json['district'] as String?,
      kycStatus: json['kycStatus'] as String?,
      reputationScore: (json['reputationScore'] as num?)?.toDouble(),
      balance: (json['balance'] as num?)?.toDouble(),
      isActive: json['isActive'] as bool,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }
}
