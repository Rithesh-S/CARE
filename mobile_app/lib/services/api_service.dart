import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import '../models/issue_model.dart';

class ApiService {
  // Singleton instance
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  static String _customBaseUrl = 'http://10.88.96.88:5000';

  static String get baseUrl => _customBaseUrl;

  static void setBaseUrl(String url) {
    _customBaseUrl = url.endsWith('/') ? url.substring(0, url.length - 1) : url;
  }

  static String resolveImageUrl(String path) {
    if (path.isEmpty) return '';
    if (path.startsWith('http')) return path;
    return '$baseUrl$path';
  }

  String? _token;
  UserModel? _currentUser;
  int _remainingQuota = 3;

  String? get token => _token;
  UserModel? get currentUser => _currentUser;
  bool get isAuthenticated => _token != null;
  int get remainingQuota => _remainingQuota;

  Future<bool> initSession() async {
    final prefs = await SharedPreferences.getInstance();
    final savedUrl = prefs.getString('care_server_url') ?? prefs.getString('spillit_server_url');
    if (savedUrl != null && savedUrl.isNotEmpty) {
      _customBaseUrl = savedUrl;
    }
    _token = prefs.getString('care_jwt_token') ?? prefs.getString('spillit_jwt_token');
    final userJson = prefs.getString('care_user_data') ?? prefs.getString('spillit_user_data');
    if (_token != null && userJson != null) {
      try {
        _currentUser = UserModel.fromJson(jsonDecode(userJson));
        return true;
      } catch (e) {
        debugPrint('Failed to decode stored user data: $e');
      }
    }
    return false;
  }

  // Google SSO / Dev Login
  Future<Map<String, dynamic>> login({
    required String email,
    String? name,
    String? idToken,
  }) async {
    try {
      final url = Uri.parse('$baseUrl/api/auth/google');
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email.trim(),
          'name': name,
          'id_token': idToken,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        _token = data['token'];
        _currentUser = UserModel.fromJson(data['user']);

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('care_jwt_token', _token!);
        await prefs.setString('care_user_data', jsonEncode(_currentUser!.toJson()));

        return {'success': true, 'user': _currentUser};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Authentication rejected',
          'error': data['error'] ?? 'AUTH_FAILED',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network connection error: $e'};
    }
  }

  // Logout
  Future<void> logout() async {
    _token = null;
    _currentUser = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('care_jwt_token');
    await prefs.remove('care_user_data');
    await prefs.remove('spillit_jwt_token');
    await prefs.remove('spillit_user_data');
  }

  // Submit Grievance with Live Camera Photo (ML flow)
  Future<Map<String, dynamic>> submitIssue({
    required XFile imageFile,
    required String locationMethod, // 'QR' or 'MANUAL'
    required String zone,
    String blockName = '',
    String category = 'facilities and welfare issues',
    String description = '',
  }) async {
    try {
      final url = Uri.parse('$baseUrl/api/issues');
      final request = http.MultipartRequest('POST', url);

      request.headers['Authorization'] = 'Bearer $_token';
      request.fields['submission_type'] = 'PHOTO';
      request.fields['location_method'] = locationMethod;
      request.fields['block_name'] = blockName;
      request.fields['zone'] = zone;
      request.fields['category'] = category;
      request.fields['student_description'] = description;

      final bytes = await imageFile.readAsBytes();
      final String rawName = imageFile.name.isNotEmpty 
          ? imageFile.name 
          : (imageFile.path.isNotEmpty ? imageFile.path.split(RegExp(r'[\\/]')).last : 'capture.jpg');
      final multipartFile = http.MultipartFile.fromBytes(
        'image',
        bytes,
        filename: rawName,
      );
      request.files.add(multipartFile);

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      final data = jsonDecode(response.body);

      if (response.statusCode == 201 && data['success'] == true) {
        if (data['remaining_quota'] != null) {
          _remainingQuota = data['remaining_quota'] is int ? data['remaining_quota'] : 0;
        }
        return {
          'success': true,
          'issue': IssueModel.fromJson(data['issue']),
          'remaining_quota': _remainingQuota,
          'ai_result': data['ai_result'],
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Submission failed',
          'error': data['error'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Upload error: $e'};
    }
  }

  // Submit Textual Grievance without Live Photo (Categorized Flow)
  Future<Map<String, dynamic>> submitTextIssue({
    required String category,
    required String blockName,
    required String zone,
    required String description,
    required String locationMethod,
  }) async {
    try {
      final url = Uri.parse('$baseUrl/api/issues');
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_token',
        },
        body: jsonEncode({
          'submission_type': 'TEXT',
          'category': category,
          'block_name': blockName,
          'zone': zone,
          'student_description': description,
          'location_method': locationMethod,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 201 && data['success'] == true) {
        if (data['remaining_quota'] != null) {
          _remainingQuota = data['remaining_quota'] is int ? data['remaining_quota'] : 0;
        }
        return {
          'success': true,
          'issue': IssueModel.fromJson(data['issue']),
          'remaining_quota': _remainingQuota,
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Textual grievance submission failed',
          'error': data['error'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Submission network error: $e'};
    }
  }

  // Get My Anonymous Submissions (Student)
  Future<List<IssueModel>> getMySubmissions() async {
    try {
      final url = Uri.parse('$baseUrl/api/issues/my-submissions');
      final response = await http.get(url, headers: {
        'Authorization': 'Bearer $_token',
      });

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['remaining_quota'] != null) {
          _remainingQuota = data['remaining_quota'] is int ? data['remaining_quota'] : 0;
        }
        final list = (data['issues'] as List)
            .map((i) => IssueModel.fromJson(i))
            .toList();
        return list;
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching my submissions: $e');
      return [];
    }
  }

  // Get Public Feed (All users)
  Future<List<IssueModel>> getPublicFeed() async {
    try {
      final url = Uri.parse('$baseUrl/api/issues/feed');
      final response = await http.get(url);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final list = (data['feed'] as List)
            .map((i) => IssueModel.fromJson(i))
            .toList();
        return list;
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching public feed: $e');
      return [];
    }
  }

  // Get Staff Assigned Issues
  Future<List<IssueModel>> getStaffIssues() async {
    try {
      final url = Uri.parse('$baseUrl/api/staff/issues');
      final response = await http.get(url, headers: {
        'Authorization': 'Bearer $_token',
      });

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final list = (data['issues'] as List)
            .map((i) => IssueModel.fromJson(i))
            .toList();
        return list;
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching staff issues: $e');
      return [];
    }
  }

  // Resolve Issue (Staff - live resolution photo)
  Future<Map<String, dynamic>> resolveIssue({
    required String issueId,
    required XFile resolutionImage,
    String resolutionNotes = '',
  }) async {
    try {
      final url = Uri.parse('$baseUrl/api/staff/issues/$issueId/resolve');
      final request = http.MultipartRequest('POST', url);

      request.headers['Authorization'] = 'Bearer $_token';
      request.fields['resolution_notes'] = resolutionNotes;

      final bytes = await resolutionImage.readAsBytes();
      final String rawName = resolutionImage.name.isNotEmpty 
          ? resolutionImage.name 
          : (resolutionImage.path.isNotEmpty ? resolutionImage.path.split(RegExp(r'[\\/]')).last : 'resolution.jpg');
      final multipartFile = http.MultipartFile.fromBytes(
        'resolution_image',
        bytes,
        filename: rawName,
      );
      request.files.add(multipartFile);

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        return {
          'success': true,
          'message': data['message'],
          'issue': IssueModel.fromJson(data['issue']),
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Resolution upload failed',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Resolution error: $e'};
    }
  }

  // Request SLA Extension (Staff)
  Future<Map<String, dynamic>> requestExtension({
    required String issueId,
    required int days,
    required String reason,
  }) async {
    try {
      final url = Uri.parse('$baseUrl/api/staff/issues/$issueId/request-extension');
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_token',
        },
        body: jsonEncode({
          'days': days,
          'reason': reason,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        return {
          'success': true,
          'message': data['message'],
          'issue': IssueModel.fromJson(data['issue']),
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to submit extension request',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Dismiss Alert
  Future<bool> dismissAlert(String issueId) async {
    try {
      final url = Uri.parse('$baseUrl/api/issues/$issueId/dismiss-alert');
      final response = await http.post(
        url,
        headers: {
          'Authorization': 'Bearer $_token',
        },
      );

      final data = jsonDecode(response.body);
      return response.statusCode == 200 && data['success'] == true;
    } catch (e) {
      debugPrint('Error dismissing alert: $e');
      return false;
    }
  }
}
