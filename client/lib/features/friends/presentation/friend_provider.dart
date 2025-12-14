import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:client/features/friends/data/friend_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

final friendServiceProvider = Provider((ref) => FriendService());

final friendSearchProvider =
    FutureProvider.family<List<Map<String, dynamic>>, String>((
      ref,
      query,
    ) async {
      if (query.isEmpty) {
        return [];
      }
      final service = ref.watch(friendServiceProvider);
      final prefs = await SharedPreferences.getInstance();
      final userId = prefs.getInt('userId');
      if (userId == null) {
        return [];
      }

      return service.searchUsers(query, userId);
    });

final pendingRequestsProvider = FutureProvider<List<Map<String, dynamic>>>((
  ref,
) async {
  final service = ref.watch(friendServiceProvider);
  final prefs = await SharedPreferences.getInstance();
  final userId = prefs.getInt('userId');
  if (userId == null) {
    return [];
  }

  return service.getPendingRequests(userId);
});

final friendsListProvider = FutureProvider<List<Map<String, dynamic>>>((
  ref,
) async {
  final service = ref.watch(friendServiceProvider);
  final prefs = await SharedPreferences.getInstance();
  final userId = prefs.getInt('userId');
  if (userId == null) {
    return [];
  }

  return service.getFriends(userId);
});
