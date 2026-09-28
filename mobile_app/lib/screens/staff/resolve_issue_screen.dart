import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../models/issue_model.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/image_viewer_card.dart';

class ResolveIssueScreen extends StatefulWidget {
  final IssueModel issue;

  const ResolveIssueScreen({super.key, required this.issue});

  @override
  State<ResolveIssueScreen> createState() => _ResolveIssueScreenState();
}

class _ResolveIssueScreenState extends State<ResolveIssueScreen> {
  final ImagePicker _picker = ImagePicker();
  XFile? _resolutionImage;
  final TextEditingController _notesController = TextEditingController();
  bool _isSubmitting = false;

  // Strictly Live Camera Capture (Data integrity enforcement)
  Future<void> _captureResolutionPhoto() async {
    try {
      final XFile? photo = await _picker.pickImage(
        source: ImageSource.camera,
        preferredCameraDevice: CameraDevice.rear,
      );

      if (photo != null) {
        setState(() {
          _resolutionImage = photo;
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Camera capture error: $e'),
          backgroundColor: AppTheme.amber,
        ),
      );
    }
  }

  Future<void> _submitResolution() async {
    if (_resolutionImage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('⚠️ Live "After" photo is strictly required to resolve this task!'),
          backgroundColor: AppTheme.rose,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    // Show Progress Dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => PopScope(
        canPop: false,
        child: Center(
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 32),
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppTheme.borderSubtle),
              boxShadow: const [
                BoxShadow(color: Color(0x220F172A), blurRadius: 24, spreadRadius: 4),
              ],
            ),
            child: const Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 44,
                  height: 44,
                  child: CircularProgressIndicator(color: AppTheme.primary, strokeWidth: 3.5),
                ),
                SizedBox(height: 20),
                Text(
                  'Submitting Resolution...',
                  style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                ),
                SizedBox(height: 8),
                Text(
                  'Uploading resolution proof and updating task ledger...',
                  style: TextStyle(fontSize: 12, color: AppTheme.textSecondary, height: 1.4),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );

    final result = await ApiService().resolveIssue(
      issueId: widget.issue.id,
      resolutionImage: _resolutionImage!,
      resolutionNotes: _notesController.text.trim(),
    );

    if (!mounted) return;

    // Dismiss dialog
    Navigator.of(context, rootNavigator: true).pop();

    setState(() => _isSubmitting = false);

    if (result['success'] == true) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          backgroundColor: AppTheme.bgCard,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Row(
            children: [
              Icon(Icons.check_circle_rounded, color: AppTheme.emerald, size: 28),
              SizedBox(width: 10),
              Text('Resolution Submitted!', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            ],
          ),
          content: const Text(
            'Your "After" photo and notes have been logged.\n\nThe grievance status has transitioned to PENDING_REVIEW for campus admin sign-off.',
            style: TextStyle(fontSize: 13, color: AppTheme.textSecondary, height: 1.4),
          ),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context); // close dialog
                Navigator.pop(context, true); // return to staff home with reload
              },
              child: const Text('Return to Task Queue'),
            ),
          ],
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message'] ?? 'Resolution submission failed'),
          backgroundColor: AppTheme.rose,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Resolve Grievance Task'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Original Reported Incident Reference
            const Text(
              '1. ORIGINAL REPORTED INCIDENT (BEFORE)',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textMuted, letterSpacing: 0.8),
            ),
            const SizedBox(height: 10),

            ImageViewerCard(
              imageUrl: widget.issue.originalImageUrl,
              height: 180,
              badgeText: 'ORIGINAL ISSUE (BEFORE)',
              badgeColor: AppTheme.rose,
            ),
            const SizedBox(height: 10),

            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppTheme.bgCard,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.borderSubtle),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.issue.aiIssueType,
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined, size: 14, color: AppTheme.secondary),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          widget.issue.zone,
                          style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                        ),
                      ),
                    ],
                  ),
                  if (widget.issue.studentDescription.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(
                      'Student note: "${widget.issue.studentDescription}"',
                      style: const TextStyle(fontSize: 12, color: AppTheme.textMuted, fontStyle: FontStyle.italic),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Live Camera Capture of "After" Photo
            const Text(
              '2. CAPTURE RESOLUTION PHOTO ("AFTER" FIX)',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textMuted, letterSpacing: 0.8),
            ),
            const SizedBox(height: 10),

            InkWell(
              onTap: _captureResolutionPhoto,
              borderRadius: BorderRadius.circular(16),
              child: Container(
                height: 200,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: _resolutionImage != null ? AppTheme.emerald : AppTheme.borderSubtle,
                    width: _resolutionImage != null ? 1.5 : 1,
                  ),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x080F172A),
                      blurRadius: 10,
                      offset: Offset(0, 2),
                    ),
                  ],
                ),
                clipBehavior: Clip.antiAlias,
                child: _resolutionImage != null
                    ? Stack(
                        fit: StackFit.expand,
                        children: [
                          kIsWeb
                              ? Image.network(_resolutionImage!.path, fit: BoxFit.cover)
                              : Image.file(File(_resolutionImage!.path), fit: BoxFit.cover),
                          Positioned(
                            top: 10,
                            right: 10,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppTheme.emerald.withValues(alpha: 0.9),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text(
                                'AFTER PHOTO CAPTURED',
                                style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700),
                              ),
                            ),
                          ),
                          Positioned(
                            bottom: 10,
                            right: 10,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.black.withValues(alpha: 0.75),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text('Tap to Retake', style: TextStyle(color: Colors.white, fontSize: 11)),
                            ),
                          ),
                        ],
                      )
                    : const Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.add_a_photo_rounded, size: 40, color: AppTheme.emerald),
                                SizedBox(height: 8),
                                Text(
                                  'Capture Live "After" Photo',
                                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppTheme.textPrimary),
                                ),
                                SizedBox(height: 4),
                                Text(
                                  'Photographic proof required for admin sign-off',
                                  style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
                                ),
                              ],
                            ),
                          ),
              ),
            ),
            const SizedBox(height: 24),

            // Resolution Notes
            const Text(
              '3. STAFF RESOLUTION NOTES',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textMuted, letterSpacing: 0.8),
            ),
            const SizedBox(height: 10),

            TextField(
              controller: _notesController,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: 'e.g. Replaced leaking valve with new pressure-tested brass fitting...',
              ),
            ),
            const SizedBox(height: 28),

            // Submit Button
            ElevatedButton.icon(
              onPressed: _isSubmitting ? null : _submitResolution,
              icon: _isSubmitting
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.check_circle_rounded),
              label: Text(_isSubmitting ? 'Uploading Resolution...' : 'Submit Resolution for Admin Review'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.emerald,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
