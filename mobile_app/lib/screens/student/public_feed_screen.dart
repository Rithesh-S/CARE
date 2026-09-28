import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/issue_model.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/image_viewer_card.dart';

class PublicFeedScreen extends StatefulWidget {
  const PublicFeedScreen({super.key});

  @override
  State<PublicFeedScreen> createState() => _PublicFeedScreenState();
}

class _PublicFeedScreenState extends State<PublicFeedScreen> {
  List<IssueModel> _feed = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadFeed();
  }

  Future<void> _loadFeed() async {
    setState(() => _isLoading = true);
    final feed = await ApiService().getPublicFeed();
    if (!mounted) return;
    setState(() {
      _feed = feed;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    }

    if (_feed.isEmpty) {
      return RefreshIndicator(
        onRefresh: _loadFeed,
        color: AppTheme.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Container(
            padding: const EdgeInsets.all(32),
            height: MediaQuery.of(context).size.height * 0.7,
            alignment: Alignment.center,
            child: const Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.public_off_rounded, size: 54, color: AppTheme.textMuted),
                SizedBox(height: 16),
                Text(
                  'Campus Feed is Fresh',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                ),
                SizedBox(height: 6),
                Text(
                  'Resolved and verified grievances will appear here for student transparency.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadFeed,
      color: AppTheme.primary,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _feed.length,
        separatorBuilder: (_, __) => const SizedBox(height: 18),
        itemBuilder: (context, index) {
          final item = _feed[index];
          return _buildPublicFeedCard(item);
        },
      ),
    );
  }

  Widget _buildPublicFeedCard(IssueModel item) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFA7F3D0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0C0F172A),
            blurRadius: 12,
            offset: Offset(0, 3),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Dual Image Container (Before vs After)
          SizedBox(
            height: 170,
            child: Row(
              children: [
                Expanded(
                  child: ImageViewerCard(
                    imageUrl: item.originalImageUrl,
                    height: 170,
                    badgeText: 'BEFORE',
                    badgeColor: AppTheme.rose,
                  ),
                ),
                Container(width: 1, color: Colors.white.withValues(alpha: 0.1)),
                Expanded(
                  child: ImageViewerCard(
                    imageUrl: item.resolutionImageUrl ?? item.originalImageUrl,
                    height: 170,
                    badgeText: 'AFTER (FIXED)',
                    badgeColor: AppTheme.emerald,
                  ),
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        item.aiIssueType,
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.emerald.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppTheme.emerald.withValues(alpha: 0.3)),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.check_circle_rounded, size: 12, color: AppTheme.emerald),
                          SizedBox(width: 4),
                          Text(
                            'VERIFIED FIX',
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.emerald),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),

                // Zone
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined, size: 14, color: AppTheme.secondary),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        item.zone,
                        style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Resolution summary note
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.emerald.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppTheme.emerald.withValues(alpha: 0.15)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'RESOLUTION SUMMARY',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.emerald),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        item.resolutionNotes.isNotEmpty
                            ? item.resolutionNotes
                            : 'Grievance inspected, repaired, and safety verified by SKCET campus facilities team.',
                        style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),

                // Footer info
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Resolved by ${item.assignedTo?['name'] ?? 'Facilities Team'}',
                      style: const TextStyle(fontSize: 11, color: AppTheme.primaryLight, fontWeight: FontWeight.w600),
                    ),
                    Text(
                      item.resolvedAt != null
                          ? DateFormat('MMM d, yyyy').format(item.resolvedAt!)
                          : 'Recently',
                      style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
