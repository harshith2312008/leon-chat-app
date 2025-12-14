import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:client/features/friends/presentation/friend_provider.dart';

class FriendRequestsScreen extends ConsumerWidget {
  const FriendRequestsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final requestsAsync = ref.watch(pendingRequestsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Friend Requests')),
      body: requestsAsync.when(
        data: (requests) {
          if (requests.isEmpty)
            return const Center(child: Text('No pending requests'));

          return ListView.builder(
            itemCount: requests.length,
            itemBuilder: (context, index) {
              final req = requests[index];
              return ListTile(
                leading: CircleAvatar(
                  backgroundColor: Theme.of(
                    context,
                  ).colorScheme.primaryContainer,
                  foregroundColor: Theme.of(
                    context,
                  ).colorScheme.onPrimaryContainer,
                  child: const Icon(Icons.person),
                ),
                title: Text(req['username']),
                subtitle: Text('Sent: ${req['created_at']}'),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.check, color: Colors.green),
                      onPressed: () async {
                        await ref
                            .read(friendServiceProvider)
                            .respondToRequest(req['id'], 'accepted');
                        ref.invalidate(pendingRequestsProvider);
                        ref.invalidate(
                          friendsListProvider,
                        ); // Refresh friends list too
                      },
                    ),
                    IconButton(
                      icon: Icon(
                        Icons.close,
                        color: Theme.of(context).colorScheme.error,
                      ),
                      onPressed: () async {
                        await ref
                            .read(friendServiceProvider)
                            .respondToRequest(req['id'], 'rejected');
                        ref.invalidate(pendingRequestsProvider);
                      },
                    ),
                  ],
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, s) => Center(child: Text('Error: $e')),
      ),
    );
  }
}
