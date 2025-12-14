import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:client/features/chat/data/chat_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:client/features/friends/presentation/friend_provider.dart';

final chatServiceProvider = Provider((ref) => ChatService());

// State for Chat List (Users)
final usersProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final service = ref.watch(chatServiceProvider);
  final users = await service.getUsers();

  // Filter out current user
  final prefs = await SharedPreferences.getInstance();
  final currentUserId = prefs.getInt('userId');

  if (currentUserId != null) {
    return users.where((u) => u['id'] != currentUserId).toList();
  }
  return users;
});

// State for Messages
class ChatState {
  final Map<int, List<Map<String, dynamic>>> messages;
  final String? error;

  const ChatState({this.messages = const {}, this.error});

  ChatState copyWith({
    Map<int, List<Map<String, dynamic>>>? messages,
    String? error,
  }) {
    return ChatState(
      messages: messages ?? this.messages,
      error: error ?? this.error,
    );
  }
}

class ChatNotifier extends Notifier<ChatState> {
  late final ChatService _service;
  int? _currentUserId;

  @override
  ChatState build() {
    _service = ref.watch(chatServiceProvider);
    // Initialize connection
    _init();
    return const ChatState();
  }

  Future<void> _init() async {
    final prefs = await SharedPreferences.getInstance();
    _currentUserId = prefs.getInt('userId');
    if (_currentUserId != null) {
      _service.connect(_currentUserId!);

      _service.onMessageReceived((data) {
        final senderId = data['senderId'];
        if (senderId != null) {
          addMessage(senderId, data);
        }
      });

      _service.onFriendUpdates(
        () {
          // New Request Received
          ref.invalidate(pendingRequestsProvider);
        },
        () {
          // Request Accepted
          ref.invalidate(friendsListProvider);
          ref.invalidate(pendingRequestsProvider);
        },
      );
    }
  }

  void sendMessage(int receiverId, String content) {
    if (_currentUserId == null) return;

    _service.sendMessage(_currentUserId!, receiverId, content);

    // Optimistically add to our list
    addMessage(receiverId, {
      'senderId': _currentUserId,
      'receiverId': receiverId,
      'content': content,
      'timestamp': DateTime.now().toIso8601String(),
    });
  }

  Future<void> loadMessages(int friendId) async {
    if (_currentUserId == null) return;
    try {
      final messages = await _service.getMessages(_currentUserId!, friendId);
      final currentMessages = Map<int, List<Map<String, dynamic>>>.from(
        state.messages,
      );
      currentMessages[friendId] = messages;
      state = state.copyWith(messages: currentMessages);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  void addMessage(int otherUserId, Map<String, dynamic> message) {
    final currentMessages = Map<int, List<Map<String, dynamic>>>.from(
      state.messages,
    );

    if (!currentMessages.containsKey(otherUserId)) {
      currentMessages[otherUserId] = [];
    }

    currentMessages[otherUserId]!.add(message);
    state = state.copyWith(messages: currentMessages);
  }
}

final chatProvider = NotifierProvider<ChatNotifier, ChatState>(
  ChatNotifier.new,
);
