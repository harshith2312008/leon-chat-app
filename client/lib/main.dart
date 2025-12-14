import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:client/core/theme/app_theme.dart';
import 'package:client/core/theme/theme_provider.dart';
import 'package:client/features/auth/presentation/login_screen.dart';
import 'package:client/features/auth/presentation/register_screen.dart';
import 'package:client/features/chat/presentation/chat_list_screen.dart';
import 'package:client/features/chat/presentation/chat_screen.dart';
import 'package:client/features/friends/presentation/search_user_screen.dart';
import 'package:client/features/friends/presentation/friend_requests_screen.dart';

void main() {
  runApp(const ProviderScope(child: LeonApp()));
}

final _router = GoRouter(
  initialLocation: '/login',
  routes: [
    GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
    GoRoute(
      path: '/register',
      builder: (context, state) => const RegisterScreen(),
    ),
    GoRoute(
      path: '/chats',
      builder: (context, state) => const ChatListScreen(),
    ),
    GoRoute(
      path: '/search',
      builder: (context, state) => const SearchUserScreen(),
    ),
    GoRoute(
      path: '/requests',
      builder: (context, state) => const FriendRequestsScreen(),
    ),
    GoRoute(
      path: '/chat/:userId',
      builder: (context, state) {
        final userId = int.parse(state.pathParameters['userId']!);
        final userName = state.uri.queryParameters['name'] ?? 'Chat';
        return ChatScreen(userId: userId, userName: userName);
      },
    ),
  ],
);

class LeonApp extends ConsumerWidget {
  const LeonApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);

    return MaterialApp.router(
      title: 'Leon',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      themeAnimationDuration: Duration.zero,
      routerConfig: _router,
      debugShowCheckedModeBanner: false,
    );
  }
}
