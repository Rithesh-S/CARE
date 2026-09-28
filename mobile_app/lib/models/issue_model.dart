class IssueModel {
  final String id;
  final String? reporterHash;
  final String submissionType; // 'PHOTO' or 'TEXT'
  final String category;
  final String locationMethod; // 'QR' or 'MANUAL'
  final String blockName;
  final String zone;
  final String originalImageUrl;
  final String studentDescription;
  final String aiIssueType;
  final List<String> aiPredictedClasses;
  final String aiCaption;
  final int aiCriticalScore;
  final bool isConfusingCritic;
  final String status; // 'UNASSIGNED', 'ASSIGNED_STAFF', 'ASSIGNED_ADMIN', 'PENDING_REVIEW', 'ARCHIVED', 'POSTED'
  final Map<String, dynamic>? assignedTo;
  final DateTime? slaDeadline;
  final int slaHours;
  final String slaSeverity;
  final bool extensionRequested;
  final int extensionDays;
  final String extensionReason;
  final String extensionStatus; // 'NONE', 'PENDING', 'APPROVED', 'REJECTED'
  final String? resolutionImageUrl;
  final String resolutionNotes;
  final String resolutionPushMessage;
  final bool resolutionNotifiedToStudent;
  final DateTime createdAt;
  final DateTime? resolvedAt;
  final DateTime? resolutionPushedAt;

  IssueModel({
    required this.id,
    this.reporterHash,
    this.submissionType = 'PHOTO',
    this.category = 'other concerns',
    required this.locationMethod,
    this.blockName = '',
    required this.zone,
    required this.originalImageUrl,
    required this.studentDescription,
    required this.aiIssueType,
    this.aiPredictedClasses = const [],
    this.aiCaption = '',
    required this.aiCriticalScore,
    required this.isConfusingCritic,
    required this.status,
    this.assignedTo,
    this.slaDeadline,
    this.slaHours = 48,
    this.slaSeverity = 'MEDIUM',
    this.extensionRequested = false,
    this.extensionDays = 0,
    this.extensionReason = '',
    this.extensionStatus = 'NONE',
    this.resolutionImageUrl,
    required this.resolutionNotes,
    this.resolutionPushMessage = '',
    this.resolutionNotifiedToStudent = false,
    required this.createdAt,
    this.resolvedAt,
    this.resolutionPushedAt,
  });

  bool get isOverdue {
    if (slaDeadline == null) return false;
    if (status != 'ASSIGNED_STAFF') return false;
    return slaDeadline!.isBefore(DateTime.now());
  }

  factory IssueModel.fromJson(Map<String, dynamic> json) {
    List<String> parsedClasses = [];
    if (json['ai_predicted_classes'] is List) {
      parsedClasses = (json['ai_predicted_classes'] as List)
          .map((e) => e.toString())
          .toList();
    }

    return IssueModel(
      id: json['_id'] ?? json['id'] ?? '',
      reporterHash: json['reporter_hash'],
      submissionType: json['submission_type'] ?? 'PHOTO',
      category: json['category'] ?? json['ai_issue_type'] ?? 'other concerns',
      locationMethod: json['location_method'] ?? 'MANUAL',
      blockName: json['block_name'] ?? '',
      zone: json['zone'] ?? 'Unknown Campus Zone',
      originalImageUrl: json['original_image_url'] ?? '',
      studentDescription: json['student_description'] ?? '',
      aiIssueType: json['ai_issue_type'] ?? 'General Issue',
      aiPredictedClasses: parsedClasses,
      aiCaption: json['ai_caption'] ?? '',
      aiCriticalScore: json['ai_critical_score'] is int 
          ? json['ai_critical_score'] 
          : (json['ai_critical_score'] != null ? int.tryParse(json['ai_critical_score'].toString()) ?? 5 : 5),
      isConfusingCritic: json['is_confusing_critic'] ?? false,
      status: json['status'] ?? 'UNASSIGNED',
      assignedTo: json['assigned_to'] is Map<String, dynamic> ? json['assigned_to'] : null,
      slaDeadline: json['sla_deadline'] != null 
          ? DateTime.tryParse(json['sla_deadline']) 
          : null,
      slaHours: json['sla_hours'] is int ? json['sla_hours'] : 48,
      slaSeverity: json['sla_severity'] ?? 'MEDIUM',
      extensionRequested: json['extension_requested'] ?? false,
      extensionDays: json['extension_days'] is int ? json['extension_days'] : 0,
      extensionReason: json['extension_reason'] ?? '',
      extensionStatus: json['extension_status'] ?? 'NONE',
      resolutionImageUrl: json['resolution_image_url'],
      resolutionNotes: json['resolution_notes'] ?? '',
      resolutionPushMessage: json['resolution_push_message'] ?? '',
      resolutionNotifiedToStudent: json['resolution_notified_to_student'] == true || json['resolution_notified_to_student'] == 'true',
      createdAt: json['createdAt'] != null 
          ? DateTime.tryParse(json['createdAt']) ?? DateTime.now() 
          : DateTime.now(),
      resolvedAt: json['resolved_at'] != null 
          ? DateTime.tryParse(json['resolved_at']) 
          : null,
      resolutionPushedAt: json['resolution_pushed_at'] != null 
          ? DateTime.tryParse(json['resolution_pushed_at']) 
          : null,
    );
  }
}
