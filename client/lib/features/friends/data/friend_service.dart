import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:client/core/constants/api_constants.dart';

class FriendService {
  Future<List<Map<String, dynamic>>> searchUsers(
    String query,
    int userId,
  ) async {
    final response = await http.get(
      Uri.parse(
        '${ApiConstants.baseUrl}/users/search?query=$query&userId=$userId',
      ),
    );
    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(jsonDecode(response.body));
    }
    return [];
  }

  Future<void> sendRequest(int senderId, int receiverId) async {
    final response = await http.post(
      Uri.parse('${ApiConstants.baseUrl}/friend-request'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'senderId': senderId, 'receiverId': receiverId}),
    );
    if (response.statusCode != 200) {
      final body = jsonDecode(response.body);
      throw Exception(body['error'] ?? 'Failed to send request');
    }
  }

  Future<List<Map<String, dynamic>>> getPendingRequests(int userId) async {
    final response = await http.get(
      Uri.parse('${ApiConstants.baseUrl}/friend-requests/pending/$userId'),
    );
    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(jsonDecode(response.body));
    }
    return [];
  }

  Future<void> respondToRequest(int requestId, String status) async {
    final response = await http.put(
      Uri.parse('${ApiConstants.baseUrl}/friend-request/$requestId'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'status': status}),
    );
    if (response.statusCode != 200) throw Exception('Failed to update request');
  }

  Future<List<Map<String, dynamic>>> getFriends(int userId) async {
    final response = await http.get(
      Uri.parse('${ApiConstants.baseUrl}/friends/$userId'),
    );
    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(jsonDecode(response.body));
    }
    return [];
  }
}
