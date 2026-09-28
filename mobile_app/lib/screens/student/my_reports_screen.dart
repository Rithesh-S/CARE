import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../models/issue_model.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';

class MyReportsScreen extends StatefulWidget {
  const MyReportsScreen({super.key});

  @override
  State<MyReportsScreen> createState() => _MyReportsScreenState();
}

class _MyReportsScreenState extends State<MyReportsScreen> {
  List<IssueModel> _myIssues = [];
  List<String> _dismissedIds = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSubmissions();
  }

  Future<void> _loadSubmissions() async {
    setState(() => _isLoading = true);
    final prefs = await SharedPreferences.getInstance();
    _dismissedIds = prefs.getStringList('dismissed_alerts') ?? [];
    
    final issues = await ApiService().getMySubmissions();
    if (!mounted) return;
    
    setState(() {
      _myIssues = issues.where((issue) => 
        issue.resolutionPushMessage.isNotEmpty && 
        !_dismissedIds.contains(issue.id)
      ).toList();
      _isLoading = false;
    });
  }

  Future<void> _dismissAlert(String id) async {
    final prefs = await SharedPreferences.getInstance();
    _dismissedIds.add(id);
    await prefs.setStringList('dismissed_alerts', _dismissedIds);
    setState(() {
      _myIssues.removeWhere((issue) => issue.id == id);
    });
    
    // Also notify backend so it's cleared globally for this student
    await ApiService().dismissAlert(id);
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    }

    return RefreshIndicator(
      onRefresh: _loadSubmissions,
      color: AppTheme.primary,
      child: _myIssues.isEmpty
          ? ListView(
              children: [
                Container(
                  padding: const EdgeInsets.all(32),
                  height: MediaQuery.of(context).size.height * 0.7,
                  alignment: Alignment.center,
                  child: const Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.notifications_none_rounded, size: 52, color: AppTheme.textMuted),
                      SizedBox(height: 14),
                      Text(
                        'No New Alerts',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                      ),
                      SizedBox(height: 6),
                      Text(
                        'You have no pending official resolution messages from the campus administration.',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                      ),
                    ],
                  ),
                )
              ],
            )
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: _myIssues.length,
              separatorBuilder: (_, __) => const SizedBox(height: 16),
              itemBuilder: (context, index) {
                final issue = _myIssues[index];
                return _buildAlertCard(issue);
              },
            ),
    );
  }

  Widget _buildAlertCard(IssueModel issue) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFECFDF5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFA7F3D0), width: 1.5),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.check_circle_rounded, color: AppTheme.emerald, size: 18),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        'RESOLUTION ALERT • ${issue.zone}',
                        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 11, color: Color(0xFF065F46), letterSpacing: 0.5),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, size: 20, color: Color(0xFF047857)),
                      onPressed: () => _dismissAlert(issue.id),
                      constraints: const BoxConstraints(),
                      padding: EdgeInsets.zero,
                    ),
                  ],
                ),
                if (issue.resolutionPushedAt != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    DateFormat('MMM d, h:mm a').format(issue.resolutionPushedAt!),
                    style: const TextStyle(fontSize: 10, color: Color(0xFF047857), fontWeight: FontWeight.w600),
                  ),
                ],
                const SizedBox(height: 10),
                Text(
                  '"${issue.resolutionPushMessage}"',
                  style: const TextStyle(fontSize: 13, color: Color(0xFF064E3B), fontWeight: FontWeight.w600, height: 1.3),
                ),
                if (issue.resolutionNotes.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Action Details: ${issue.resolutionNotes}',
                    style: const TextStyle(fontSize: 11, color: Color(0xFF047857)),
                  ),
                ],
                if (issue.resolutionImageUrl != null && issue.resolutionImageUrl!.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(
                      ApiService.resolveImageUrl(issue.resolutionImageUrl!),
                      height: 140,
                      width: double.infinity,
                      fit: BoxFit.cover,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
