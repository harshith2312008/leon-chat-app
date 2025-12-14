import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:client/core/constants/api_constants.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class ChatService {
  io.Socket? _socket;

  // Initialize Socket connection
  void connect(int userId) {
    if (_socket != null && _socket!.connected) return;

    _socket = io.io(
      ApiConstants.baseUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .build(),
    );

    _socket!.connect();

    _socket!.onConnect((_) {
      debugPrint('Connected to Socket Server');
      _socket!.emit('join', userId);
    });

    _socket!.onDisconnect((_) => debugPrint('Disconnected from Socket Server'));
  }

  void disconnect() {
    _socket?.disconnect();
  }

  // Send Message
  void sendMessage(int senderId, int receiverId, String content) {
    _socket?.emit('private_message', {
      'senderId': senderId,
      'receiverId': receiverId,
      'content': content,
    });
  }

  // Listen for messages
  void onMessageReceived(Function(Map<String, dynamic>) callback) {
    _socket?.on('receive_message', (data) {
      callback(data);
    });
  }

  // Listen for friend updates
  void onFriendUpdates(Function() onNewRequest, Function() onRequestAccepted) {
    _socket?.on('new_friend_request', (_) => onNewRequest());
    _socket?.on('friend_request_accepted', (_) => onRequestAccepted());
  }

  // Fetch Users for contact list
  Future<List<Map<String, dynamic>>> getUsers() async {
    final response = await http.get(Uri.parse('${ApiConstants.baseUrl}/users'));
    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(jsonDecode(response.body));
    } else {
      throw Exception('Failed to load users');
    }
  }

  // Fetch Message History
  Future<List<Map<String, dynamic>>> getMessages(int myId, int friendId) async {
    final response = await http.get(
      Uri.parse('${ApiConstants.baseUrl}/messages/$myId/$friendId'),
    );
    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(jsonDecode(response.body));
    } else {
      throw Exception('Failed to load messages');
    }
  }
}
