import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:client/features/friends/presentation/friend_provider.dart';
import 'package:client/features/auth/presentation/auth_provider.dart';
import 'package:client/core/theme/theme_provider.dart';

class ChatListScreen extends ConsumerWidget {
  const ChatListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final friendsAsync = ref.watch(friendsListProvider);
    final requestsAsync = ref.watch(pendingRequestsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Chats',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: Badge(
              isLabelVisible: requestsAsync.asData?.value.isNotEmpty ?? false,
              label: Text('${requestsAsync.asData?.value.length ?? 0}'),
              child: const Icon(Icons.people),
            ),
            onPressed: () => context.push('/requests'),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              ref.read(authProvider.notifier).logout();
              context.go('/login');
            },
          ),
          IconButton(
            icon: const Icon(Icons.brightness_6),
            onPressed: () {
              ref.read(themeModeProvider.notifier).toggleTheme();
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(friendsListProvider);
          ref.invalidate(pendingRequestsProvider);
        },
        child: friendsAsync.when(
          data: (users) {
            if (users.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('No friends yet.'),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: () => context.push('/search'),
                      icon: const Icon(Icons.person_add),
                      label: const Text('Find People'),
                    ),
                  ],
                ),
              );
            }
            return ListView.builder(
              itemCount: users.length,
              padding: const EdgeInsets.all(16),
              itemBuilder: (context, index) {
                final user = users[index];
                return Card(
                  elevation: 0,
                  color: Theme.of(context).colorScheme.surfaceContainer,
                  margin: const EdgeInsets.only(bottom: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    leading: CircleAvatar(
                      backgroundColor: Theme.of(
                        context,
                      ).colorScheme.primaryContainer,
                      foregroundColor: Theme.of(
                        context,
                      ).colorScheme.onPrimaryContainer,
                      child: Text(
                        (user['username'] as String)[0].toUpperCase(),
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                    title: Text(
                      user['username'],
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    subtitle: const Text('Tap to chat'),
                    onTap: () {
                      context.push(
                        '/chat/${user['id']}?name=${user['username']}',
                      );
                    },
                  ),
                );
              },
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => Center(child: Text('Error: $err')),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/search'),
        child: const Icon(Icons.search),
      ),
    );
  }
}
