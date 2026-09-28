import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/critical_score_badge.dart';

class ReportIssueScreen extends StatefulWidget {
  const ReportIssueScreen({super.key});

  @override
  State<ReportIssueScreen> createState() => _ReportIssueScreenState();
}

class _ReportIssueScreenState extends State<ReportIssueScreen> with SingleTickerProviderStateMixin {
  final ImagePicker _picker = ImagePicker();
  XFile? _capturedImage;
  late TabController _tabController;

  // Block and Location Data
  final Map<String, List<String>> _campusBlockLocations = {
    'CSE Dept': [
      'CSE Toilet - Ground Floor',
      'CSE Bathroom / Restroom - 2nd Floor',
      'CSE Corridor - 1st Floor',
      'CSE Corridor - 2nd Floor',
      'CSE Programming Lab 1',
      'CSE AI & Data Science Lab',
      'CSE Staff Room',
      'CSE Seminar Hall',
    ],
    'IT Block': [
      'IT Toilet - 1st Floor',
      'IT Bathroom - 3rd Floor',
      'IT Corridor - Ground Floor',
      'IT Lab 4 - 3rd Floor',
      'IT Network & Cloud Lab',
      'IT Department Office',
    ],
    'Mechanical Block': [
      'Mech Toilet - Ground Floor',
      'Mech Corridor - West Wing',
      'Mech CNC & CAD/CAM Lab',
      'Mech Thermal Engineering Lab',
      'Mech Foundry Workshop',
    ],
    'ECE Block': [
      'ECE Toilet - 1st Floor',
      'ECE Bathroom - 2nd Floor',
      'ECE Corridor - East Wing',
      'ECE Microcontroller Lab',
      'ECE VLSI & Embedded Lab',
    ],
    'Civil Engineering Block': [
      'Civil Toilet - 1st Floor',
      'Civil Corridor - 1st Floor',
      'Civil Surveying Lab',
      'Civil Highway Lab',
    ],
    'Hostel Block': [
      'Hostel Toilet - Ground Floor',
      'Hostel Bathroom - 2nd Floor',
      'Hostel Corridor - 1st Floor',
      'Hostel Mess & Dining Hall',
      'Hostel Common Room',
    ],
    'Central Library': [
      'Library Restroom - Ground Floor',
      'Library Corridor - 1st Floor',
      'Library Digital Resource Section',
      'Library Reference Hall',
    ],
    'Main Admin Block': [
      'Admin Restroom - 1st Floor',
      'Admin Reception Foyer',
      'Examination Cell Corridor',
      'Accounts Office Corridor',
    ],
    'Main Canteen': [
      'Canteen Dining Hall East',
      'Canteen Handwash Area',
      'Canteen Kitchen Counter',
    ]
  };

  // The 8 User-Specified Categories for Textual Grievance Submissions
  final List<String> _textCategories = [
    'safety and security',
    'drug related issue',
    'harassment and discrimination',
    'ragging and bullying',
    'academic issues',
    'data privacy issues',
    'facilities and welfare issues',
    'other concerns'
  ];

  String _locationMethod = 'QR'; // 'QR' or 'MANUAL'
  String _selectedBlock = 'CSE Dept';
  String _selectedZone = 'CSE Toilet - Ground Floor';
  String _selectedCategory = 'facilities and welfare issues';

  final TextEditingController _descriptionController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _syncQuota();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _syncQuota() async {
    await ApiService().getMySubmissions();
    if (mounted) setState(() {});
  }

  void _onBlockChanged(String newBlock) {
    setState(() {
      _selectedBlock = newBlock;
      final places = _campusBlockLocations[newBlock] ?? [];
      _selectedZone = places.isNotEmpty ? places.first : '$newBlock - General';
    });
  }

  // Strictly Live Camera Capture (Data Integrity Rule)
  Future<void> _captureLivePhoto() async {
    try {
      final XFile? photo = await _picker.pickImage(
        source: ImageSource.camera,
        preferredCameraDevice: CameraDevice.rear,
      );

      if (photo != null) {
        setState(() {
          _capturedImage = photo;
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Live camera capture notice: $e'),
          backgroundColor: AppTheme.amber,
        ),
      );
    }
  }

  // Block-Coded QR Scanner / Simulator
  void _openQrScanner() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.bgCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.qr_code_scanner_rounded, color: AppTheme.secondary),
                      SizedBox(width: 8),
                      Text(
                        'Scan Campus Block QR Plaque',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
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
              const Text(
                'QR codes are coded with the Campus Block Name. Scanning automatically filters the location dropdown to particular places in that block:',
                style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
              ),
              const SizedBox(height: 16),
              
              // Simulated Block QR Plaques
              Expanded(
                child: ListView(
                  children: _campusBlockLocations.keys.map((blockName) {
                    final qrCodeStr = 'CARE-BLOCK:${blockName.toUpperCase().replaceAll(' ', '-')}';
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8.0),
                      child: OutlinedButton.icon(
                        onPressed: () {
                          _locationMethod = 'QR';
                          _onBlockChanged(blockName);
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('✅ Scanned $blockName QR! Places filtered to $blockName.'),
                              backgroundColor: AppTheme.emerald,
                            ),
                          );
                        },
                        icon: const Icon(Icons.qr_code_2_rounded, size: 20, color: AppTheme.secondary),
                        label: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(blockName, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                            Text(qrCodeStr, style: const TextStyle(fontSize: 10, fontFamily: 'monospace', color: AppTheme.textMuted)),
                          ],
                        ),
                        style: OutlinedButton.styleFrom(
                          alignment: Alignment.centerLeft,
                          side: const BorderSide(color: AppTheme.borderSubtle),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // Handle Grievance Submission (Photo or Text)
  Future<void> _submitGrievance() async {
    final isTextMode = _tabController.index == 1;

    // Check submission quota (limit 3)
    if (ApiService().remainingQuota <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('🚫 You have reached the maximum limit of 3 submissions per student.'),
          backgroundColor: AppTheme.rose,
        ),
      );
      return;
    }

    if (!isTextMode && _capturedImage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('⚠️ Live camera photo is strictly required for photo triage!'),
          backgroundColor: AppTheme.rose,
        ),
      );
      return;
    }

    if (isTextMode && _descriptionController.text.trim().length < 5) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('⚠️ Please provide detailed notes of at least 5 characters.'),
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
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(
                  width: 44,
                  height: 44,
                  child: CircularProgressIndicator(color: AppTheme.primary, strokeWidth: 3.5),
                ),
                const SizedBox(height: 20),
                Text(
                  isTextMode ? 'Logging Grievance...' : 'Processing Live Photo...',
                  style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                ),
                const SizedBox(height: 8),
                Text(
                  isTextMode 
                    ? 'Registering category and assigning automated SLA deadline...'
                    : 'Analyzing image with Campus AI ML VLM Model and assigning SLA...',
                  style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary, height: 1.4),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );

    Map<String, dynamic> result;
    if (isTextMode) {
      result = await ApiService().submitTextIssue(
        category: _selectedCategory,
        blockName: _selectedBlock,
        zone: _selectedZone,
        description: _descriptionController.text.trim(),
        locationMethod: _locationMethod,
      );
    } else {
      result = await ApiService().submitIssue(
        imageFile: _capturedImage!,
        locationMethod: _locationMethod,
        blockName: _selectedBlock,
        zone: _selectedZone,
        category: _selectedCategory,
        description: _descriptionController.text.trim(),
      );
    }

    if (!mounted) return;
    Navigator.of(context, rootNavigator: true).pop(); // dismiss loading dialog

    setState(() => _isSubmitting = false);

    if (result['success'] == true) {
      final aiResult = result['ai_result'];
      _showSuccessDialog(aiResult, isTextMode);
      
      setState(() {
        _capturedImage = null;
        _descriptionController.clear();
      });
      _syncQuota();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message'] ?? 'Submission failed'),
          backgroundColor: AppTheme.rose,
        ),
      );
    }
  }

  void _showSuccessDialog(dynamic aiResult, bool isText) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        final issueType = isText 
          ? _selectedCategory 
          : (aiResult?['issue_type'] ?? 'Campus Grievance');
        final int score = isText ? 6 : (aiResult?['critical_score'] ?? 5);

        return AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Row(
            children: [
              Icon(Icons.check_circle_rounded, color: AppTheme.emerald, size: 28),
              SizedBox(width: 10),
              Text(
                'Report Submitted!',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18, color: AppTheme.textPrimary),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Your grievance is HMAC-anonymized and registered in the CARE incident ledger with SLA tracking:',
                style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
              ),
              const SizedBox(height: 16),

              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.borderSubtle),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isText ? 'CHOSEN CATEGORY' : 'AI CLASSIFIED CATEGORY',
                      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.textMuted),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      issueType.toUpperCase(),
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppTheme.textPrimary),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        CriticalScoreBadge(score: score),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            'SLA ASSIGNED',
                            style: TextStyle(color: AppTheme.primary, fontSize: 10, fontWeight: FontWeight.w700),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          actions: [
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Acknowledge & Track'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final remaining = ApiService().remainingQuota;
    final currentPlaces = _campusBlockLocations[_selectedBlock] ?? [_selectedZone];

    return Scaffold(
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header Quota & Privacy Banner
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFEEF2FF), Color(0xFFF0F9FF)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFC7D2FE)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.shield_outlined, color: AppTheme.primary, size: 28),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'CARE Anonymous Reporting',
                              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                            ),
                          ],
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Direct admin notification upon fix.',
                          style: TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),

            // Mode Selector: Photo Capture (ML) vs Text Grievance (Categories)
            Container(
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(12),
              ),
              child: TabBar(
                controller: _tabController,
                indicator: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  color: AppTheme.primary,
                ),
                labelColor: Colors.white,
                unselectedLabelColor: AppTheme.textSecondary,
                indicatorSize: TabBarIndicatorSize.tab,
                dividerColor: Colors.transparent,
                labelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                tabs: const [
                  Tab(icon: Icon(Icons.camera_alt_rounded, size: 18), text: 'Photo (AI Scan)'),
                  Tab(icon: Icon(Icons.edit_note_rounded, size: 20), text: 'Text Grievance'),
                ],
              ),
            ),
            const SizedBox(height: 18),

            // Content Based on Mode
            AnimatedBuilder(
              animation: _tabController,
              builder: (context, _) {
                final isText = _tabController.index == 1;

                if (isText) {
                  // Textual Grievance Mode: Categories Selector
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'SELECT GRIEVANCE CATEGORY',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textMuted, letterSpacing: 0.8),
                      ),
                      const SizedBox(height: 8),

                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _textCategories.map((cat) {
                          final isSelected = _selectedCategory == cat;
                          return ChoiceChip(
                            label: Text(
                              cat,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                color: isSelected ? Colors.white : AppTheme.textPrimary,
                              ),
                            ),
                            selected: isSelected,
                            selectedColor: AppTheme.primary,
                            backgroundColor: Colors.white,
                            side: BorderSide(
                              color: isSelected ? AppTheme.primary : AppTheme.borderSubtle,
                            ),
                            onSelected: (val) {
                              if (val) setState(() => _selectedCategory = cat);
                            },
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 18),
                    ],
                  );
                }

                // Photo Mode: Camera Capture Box
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '1. LIVE CAMERA PHOTO (NO GALLERY)',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textMuted, letterSpacing: 0.8),
                    ),
                    const SizedBox(height: 10),

                    InkWell(
                      onTap: _captureLivePhoto,
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        height: 200,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: _capturedImage != null ? AppTheme.emerald : AppTheme.borderSubtle,
                            width: _capturedImage != null ? 1.5 : 1,
                          ),
                          boxShadow: const [
                            BoxShadow(color: Color(0x080F172A), blurRadius: 10, offset: Offset(0, 2)),
                          ],
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: _capturedImage != null
                            ? Stack(
                                fit: StackFit.expand,
                                children: [
                                  kIsWeb
                                      ? Image.network(_capturedImage!.path, fit: BoxFit.cover)
                                      : Image.file(File(_capturedImage!.path), fit: BoxFit.cover),
                                  Positioned(
                                    bottom: 12,
                                    right: 12,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: Colors.black.withValues(alpha: 0.8),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: const Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(Icons.camera_alt, size: 14, color: Colors.white),
                                          SizedBox(width: 6),
                                          Text('Retake Photo', style: TextStyle(color: Colors.white, fontSize: 11)),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              )
                            : const Center(
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.add_a_photo_rounded, size: 40, color: AppTheme.primaryLight),
                                    SizedBox(height: 8),
                                    Text('Tap to Launch Live Camera', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppTheme.textPrimary)),
                                    SizedBox(height: 2),
                                    Text('Live camera strictly required', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                                  ],
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(height: 18),
                  ],
                );
              },
            ),

            // Block & Filtered Places Location Selector
            const Text(
              'CAMPUS LOCATION (BLOCK QR SCAN / SELECTION)',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textMuted, letterSpacing: 0.8),
            ),
            const SizedBox(height: 8),

            // Scan QR Button & Manual Switcher
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _openQrScanner,
                    icon: const Icon(Icons.qr_code_scanner, size: 16),
                    label: const Text('Scan Block QR'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: _locationMethod == 'QR' ? AppTheme.secondary : AppTheme.textSecondary,
                      side: BorderSide(
                        color: _locationMethod == 'QR' ? AppTheme.secondary : AppTheme.borderSubtle,
                        width: _locationMethod == 'QR' ? 1.5 : 1,
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 11),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => setState(() => _locationMethod = 'MANUAL'),
                    icon: const Icon(Icons.apartment_rounded, size: 16),
                    label: const Text('Manual Block'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: _locationMethod == 'MANUAL' ? AppTheme.primaryLight : AppTheme.textSecondary,
                      side: BorderSide(
                        color: _locationMethod == 'MANUAL' ? AppTheme.primary : AppTheme.borderSubtle,
                        width: _locationMethod == 'MANUAL' ? 1.5 : 1,
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 11),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Block Selector
            if (_locationMethod == 'QR')
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
                decoration: BoxDecoration(
                  color: AppTheme.bgCard,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.secondary),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.qr_code_scanner, color: AppTheme.secondary, size: 18),
                    const SizedBox(width: 10),
                    Text(
                      _selectedBlock,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                    ),
                  ],
                ),
              )
            else
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.borderSubtle),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedBlock,
                    isExpanded: true,
                    dropdownColor: AppTheme.bgCard,
                    items: _campusBlockLocations.keys.map((block) {
                      return DropdownMenuItem(
                        value: block,
                        child: Text('Block: $block', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) _onBlockChanged(val);
                    },
                  ),
                ),
              ),
            const SizedBox(height: 10),

            // Particular Places in That Block Dropdown
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFC7D2FE)),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: currentPlaces.contains(_selectedZone) ? _selectedZone : currentPlaces.first,
                  isExpanded: true,
                  dropdownColor: AppTheme.bgCard,
                  icon: const Icon(Icons.place_rounded, color: AppTheme.secondary, size: 18),
                  items: currentPlaces.map((place) {
                    return DropdownMenuItem(
                      value: place,
                      child: Text(place, style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary)),
                    );
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => _selectedZone = val);
                  },
                ),
              ),
            ),
            const SizedBox(height: 18),

            // Description Field
            const Text(
              'GRIEVANCE DESCRIPTION / DETAILS',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textMuted, letterSpacing: 0.8),
            ),
            const SizedBox(height: 8),

            TextField(
              controller: _descriptionController,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: 'e.g. Broken water tap causing water leakage in washroom...',
              ),
            ),
            const SizedBox(height: 24),

            // Submit Button with Quota check
            ElevatedButton(
              onPressed: (_isSubmitting || remaining <= 0) ? null : _submitGrievance,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 15),
              ),
              child: _isSubmitting
                  ? const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)),
                        SizedBox(width: 10),
                        Text('Submitting to CARE...'),
                      ],
                    )
                  : Text(
                      remaining <= 0 
                        ? 'Submission Limit Reached (3/3 Used)' 
                        : 'Submit Grievance ($remaining/3 remaining)',
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
