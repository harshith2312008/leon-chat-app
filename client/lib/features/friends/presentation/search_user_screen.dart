import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:client/features/friends/presentation/friend_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SearchUserScreen extends ConsumerStatefulWidget {
  const SearchUserScreen({super.key});

  @override
  ConsumerState<SearchUserScreen> createState() => _SearchUserScreenState();
}

class _SearchUserScreenState extends ConsumerState<SearchUserScreen> {
  final _searchController = TextEditingController();
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final searchResults = ref.watch(friendSearchProvider(_query));

    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _searchController,
          autofocus: true,
          decoration: const InputDecoration(
            hintText: 'Search people...',
            border: InputBorder.none,
          ),
          onChanged: (val) {
            setState(() {
              _query = val;
            });
          },
        ),
      ),
      body: searchResults.when(
        data: (users) {
          if (users.isEmpty) {
            return Center(
              child: Text(_query.isEmpty ? 'Type to search' : 'No users found'),
            );
          }
          return ListView.builder(
            itemCount: users.length,
            itemBuilder: (context, index) {
              final user = users[index];
              return ListTile(
                leading: CircleAvatar(
                  backgroundColor: Theme.of(context).colorScheme.primary,
                  foregroundColor: Theme.of(context).colorScheme.onPrimary,
                  child: Text(user['username'][0].toUpperCase()),
                ),
                title: Text(user['username']),
                trailing: IconButton(
                  icon: const Icon(Icons.person_add),
                  onPressed: () async {
                    try {
                      final prefs = await SharedPreferences.getInstance();
                      final myId = prefs.getInt('userId');
                      if (myId != null) {
                        await ref
                            .read(friendServiceProvider)
                            .sendRequest(myId, user['id']);

                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Request sent!')),
                          );
                          // Refresh search to hide this user
                          setState(() {});
                          ref.invalidate(friendSearchProvider(_query));
                        }
                      }
                    } catch (e) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(
                          context,
                        ).showSnackBar(SnackBar(content: Text('Error: $e')));
                      }
                    }
                  },
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
