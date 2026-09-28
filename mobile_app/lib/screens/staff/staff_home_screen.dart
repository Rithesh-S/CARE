import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/issue_model.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/critical_score_badge.dart';
import '../../widgets/image_viewer_card.dart';
import '../../widgets/status_badge.dart';
import '../login_screen.dart';
import 'resolve_issue_screen.dart';

class StaffHomeScreen extends StatefulWidget {
  const StaffHomeScreen({super.key});

  @override
  State<StaffHomeScreen> createState() => _StaffHomeScreenState();
}

class _StaffHomeScreenState extends State<StaffHomeScreen> {
  List<IssueModel> _assignedIssues = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadStaffTasks();
  }

  Future<void> _loadStaffTasks() async {
    setState(() => _isLoading = true);
    final issues = await ApiService().getStaffIssues();
    if (!mounted) return;
    setState(() {
      _assignedIssues = issues;
      _isLoading = false;
    });
  }

  void _handleLogout() async {
    await ApiService().logout();
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  void _openExtensionRequestDialog(IssueModel issue) {
    int selectedDays = 2;
    final reasonController = TextEditingController();
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.more_time_rounded, color: AppTheme.primary),
                          SizedBox(width: 8),
                          Text(
                            'Request SLA Deadline Extension',
                            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: AppTheme.textPrimary),
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: AppTheme.textMuted),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'If unable to complete resolution within the SLA deadline due to valid reasons (spares delay, power maintenance), request an extension for admin approval:',
                    style: TextStyle(fontSize: 12, color: AppTheme.textSecondary, height: 1.35),
                  ),
                  const SizedBox(height: 16),

                  const Text(
                    'EXTENSION DAYS REQUESTED',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textMuted),
                  ),
                  const SizedBox(height: 8),

                  Wrap(
                    spacing: 8,
                    children: [1, 2, 3, 5, 7].map((days) {
                      final isSelected = selectedDays == days;
                      return ChoiceChip(
                        label: Text('+$days Day${days > 1 ? 's' : ''}'),
                        selected: isSelected,
                        selectedColor: AppTheme.primary,
                        backgroundColor: const Color(0xFFF1F5F9),
                        labelStyle: TextStyle(
                          color: isSelected ? Colors.white : AppTheme.textPrimary,
                          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                          fontSize: 12,
                        ),
                        onSelected: (val) {
                          if (val) setModalState(() => selectedDays = days);
                        },
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 14),

                  const Text(
                    'JUSTIFICATION / REASON (REQUIRED)',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textMuted),
                  ),
                  const SizedBox(height: 6),

                  TextField(
                    controller: reasonController,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      hintText: 'Describe valid reason: e.g. Special plumbing fixtures ordered; arriving tomorrow morning.',
                    ),
                  ),
                  const SizedBox(height: 18),

                  ElevatedButton(
                    onPressed: isSubmitting
                        ? null
                        : () async {
                            final reason = reasonController.text.trim();
                            if (reason.length < 5) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Please provide a descriptive reason of at least 5 characters.'),
                                  backgroundColor: AppTheme.rose,
                                ),
                              );
                              return;
                            }

                            final messenger = ScaffoldMessenger.of(this.context);
                            final navigator = Navigator.of(context);

                            setModalState(() => isSubmitting = true);
                            final res = await ApiService().requestExtension(
                              issueId: issue.id,
                              days: selectedDays,
                              reason: reason,
                            );

                            navigator.pop();

                            if (!mounted) return;
                            if (res['success'] == true) {
                              messenger.showSnackBar(
                                SnackBar(
                                  content: Text('✅ Extension of +$selectedDays days submitted for Admin approval!'),
                                  backgroundColor: AppTheme.emerald,
                                ),
                              );
                              _loadStaffTasks();
                            } else {
                              messenger.showSnackBar(
                                SnackBar(
                                  content: Text(res['message'] ?? 'Failed to submit extension'),
                                  backgroundColor: AppTheme.rose,
                                ),
                              );
                            }
                          },
                    child: isSubmitting
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : Text('Submit Request (+$selectedDays Days)'),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ApiService().currentUser;
    final staffName = user?.name ?? 'Facilities Officer';

    final activeTasks = _assignedIssues.where((i) => i.status == 'ASSIGNED_STAFF').toList();
    final inReviewTasks = _assignedIssues.where((i) => i.status == 'PENDING_REVIEW' || i.status == 'POSTED').toList();

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Text('CARE Operations', style: TextStyle(fontWeight: FontWeight.w900)),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppTheme.emerald.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: AppTheme.emerald.withValues(alpha: 0.3)),
                  ),
                  child: const Text(
                    'STAFF DESK',
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.emerald),
                  ),
                ),
              ],
            ),
            Text(
              staffName,
              style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Refresh Task Queue',
            onPressed: _loadStaffTasks,
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: AppTheme.textSecondary),
            tooltip: 'Log Out',
            onPressed: _handleLogout,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : RefreshIndicator(
              onRefresh: _loadStaffTasks,
              color: AppTheme.primary,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Workload Statistics Cards
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: AppTheme.borderSubtle),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('ACTIVE SLA TASKS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.textMuted)),
                                const SizedBox(height: 6),
                                Text(
                                  '${activeTasks.length}',
                                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppTheme.primary),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: AppTheme.borderSubtle),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('IN REVIEW / FIXED', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.textMuted)),
                                const SizedBox(height: 6),
                                Text(
                                  '${inReviewTasks.length}',
                                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppTheme.emerald),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Section: Active Field Tasks
                    const Text(
                      'ACTIVE ASSIGNMENTS UNDER SLA DEADLINE',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textMuted, letterSpacing: 0.8),
                    ),
                    const SizedBox(height: 12),

                    if (activeTasks.isEmpty)
                      Container(
                        padding: const EdgeInsets.all(32),
                        decoration: BoxDecoration(
                          color: AppTheme.bgCard,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppTheme.borderSubtle),
                        ),
                        child: const Column(
                          children: [
                            Icon(Icons.check_circle_outline_rounded, size: 44, color: AppTheme.emerald),
                            SizedBox(height: 12),
                            Text(
                              'All Assigned Tasks Resolved!',
                              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: AppTheme.textPrimary),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'Check back later for new tasks dispatched by campus admin.',
                              textAlign: TextAlign.center,
                              style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
                            ),
                          ],
                        ),
                      )
                    else
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: activeTasks.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 16),
                        itemBuilder: (context, index) {
                          final issue = activeTasks[index];
                          return _buildStaffTaskCard(issue);
                        },
                      ),

                    if (inReviewTasks.isNotEmpty) ...[
                      const SizedBox(height: 32),
                      const Text(
                        'RECENTLY RESOLVED (WAITING ADMIN SIGNOFF)',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textMuted, letterSpacing: 0.8),
                      ),
                      const SizedBox(height: 12),
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: inReviewTasks.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final issue = inReviewTasks[index];
                          return _buildInReviewCard(issue);
                        },
                      ),
                    ],
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildStaffTaskCard(IssueModel issue) {
    final isUrgent = issue.aiCriticalScore >= 8;
    final isOverdue = issue.isOverdue;

    // SLA Countdown
    String slaText = 'SLA: 48h';
    if (issue.slaDeadline != null) {
      final diff = issue.slaDeadline!.difference(DateTime.now());
      if (diff.isNegative) {
        slaText = '🚨 OVERDUE by ${diff.inHours.abs()} hrs';
      } else {
        slaText = '⏰ Due in ${diff.inHours} hrs (${DateFormat('MMM d, h:mm a').format(issue.slaDeadline!)})';
      }
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isOverdue 
            ? const Color(0xFFFECDD3)
            : isUrgent 
            ? const Color(0xFFFECDD3) 
            : AppTheme.borderSubtle,
          width: isOverdue ? 1.8 : 1,
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A0F172A),
            blurRadius: 12,
            offset: Offset(0, 3),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // SLA Alert Banner
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            color: isOverdue ? const Color(0xFFFFF1F2) : const Color(0xFFEEF2FF),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(
                      isOverdue ? Icons.error_rounded : Icons.timer_rounded,
                      size: 14,
                      color: isOverdue ? const Color(0xFFBE123C) : const Color(0xFF4338CA),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      slaText,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: isOverdue ? const Color(0xFFBE123C) : const Color(0xFF4338CA),
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: isOverdue ? const Color(0xFFBE123C) : const Color(0xFF4338CA),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    issue.slaSeverity,
                    style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: Colors.white),
                  ),
                ),
              ],
            ),
          ),

          // Original Incident Photo (if present)
          if (issue.originalImageUrl.isNotEmpty)
            ImageViewerCard(
              imageUrl: issue.originalImageUrl,
              height: 170,
              badgeText: 'ACTION REQUIRED • SEVERITY ${issue.aiCriticalScore}/10',
              badgeColor: isUrgent ? AppTheme.rose : AppTheme.amber,
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
                        (issue.category.isNotEmpty ? issue.category : issue.aiIssueType).toUpperCase(),
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppTheme.textPrimary),
                      ),
                    ),
                    CriticalScoreBadge(score: issue.aiCriticalScore),
                  ],
                ),
                const SizedBox(height: 6),

                // Location Zone
                Row(
                  children: [
                    const Icon(Icons.location_on, size: 14, color: AppTheme.secondary),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        issue.zone,
                        style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                // Student Description Note
                if (issue.studentDescription.isNotEmpty)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppTheme.borderSubtle),
                    ),
                    child: Text(
                      'Student Note: "${issue.studentDescription}"',
                      style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                    ),
                  ),

                // Extension Request Status Badge (if exists)
                if (issue.extensionRequested) ...[
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFFBEB),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFFED7AA)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.more_time_rounded, size: 16, color: Color(0xFFB45309)),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Extension: +${issue.extensionDays} Days (${issue.extensionStatus})',
                                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Color(0xFF92400E)),
                              ),
                              Text(
                                'Reason: "${issue.extensionReason}"',
                                style: const TextStyle(fontSize: 11, color: Color(0xFFB45309)),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 16),

                // Action Buttons: Resolve Grievance & Request Extension
                Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: ElevatedButton.icon(
                        onPressed: () async {
                          final resolved = await Navigator.of(context).push<bool>(
                            MaterialPageRoute(
                              builder: (_) => ResolveIssueScreen(issue: issue),
                            ),
                          );
                          if (resolved == true) {
                            _loadStaffTasks();
                          }
                        },
                        icon: const Icon(Icons.camera_enhance_rounded, size: 16),
                        label: const Text('Capture Live Fix Photo', style: TextStyle(fontSize: 12)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.emerald,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    if (!issue.extensionRequested || issue.extensionStatus == 'REJECTED')
                      Expanded(
                        flex: 2,
                        child: OutlinedButton.icon(
                          onPressed: () => _openExtensionRequestDialog(issue),
                          icon: const Icon(Icons.more_time_rounded, size: 14),
                          label: const Text('Request Ext.', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFFB45309),
                            side: const BorderSide(color: Color(0xFFFED7AA)),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
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

  Widget _buildInReviewCard(IssueModel issue) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.borderSubtle),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: const Color(0xFFECFDF5),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.task_alt_rounded, color: AppTheme.emerald),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  (issue.category.isNotEmpty ? issue.category : issue.aiIssueType).toUpperCase(),
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                ),
                const SizedBox(height: 2),
                Text(
                  issue.zone,
                  style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                ),
              ],
            ),
          ),
          StatusBadge(status: issue.status),
        ],
      ),
    );
  }
}
