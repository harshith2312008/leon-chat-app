import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:client/features/auth/data/auth_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

final authServiceProvider = Provider((ref) => AuthService());

class AuthState {
  final bool isLoading;
  final String? error;
  final Map<String, dynamic>? user;

  AuthState({this.isLoading = false, this.error, this.user});

  AuthState copyWith({
    bool? isLoading,
    String? error,
    Map<String, dynamic>? user,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      user: user ?? this.user,
    );
  }
}

class AuthNotifier extends Notifier<AuthState> {
  late final AuthService _authService;

  @override
  AuthState build() {
    _authService = ref.watch(authServiceProvider);
    return AuthState();
  }

  Future<bool> login(String username, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final user = await _authService.login(username, password);
      // Save ID/Username to prefs if needed
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt('userId', user['id']);
      await prefs.setString('username', user['username']);

      state = state.copyWith(isLoading: false, user: user);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<bool> register(String username, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final user = await _authService.register(username, password);
      // Save ID/Username to prefs
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt('userId', user['id']);
      await prefs.setString('username', user['username']);

      state = state.copyWith(isLoading: false, user: user);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    state = AuthState();
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthState>(
  AuthNotifier.new,
);
