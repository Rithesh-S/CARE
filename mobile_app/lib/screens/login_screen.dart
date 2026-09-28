import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import 'student/student_home_screen.dart';
import 'staff/staff_home_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _emailController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  Future<void> _handleLogin(String email, {String? name}) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final result = await ApiService().login(
      email: email,
      name: name ?? 'Campus User',
    );

    if (!mounted) return;

    setState(() {
      _isLoading = false;
    });

    if (result['success'] == true) {
      final user = ApiService().currentUser;
      if (user != null && (user.isStaff || user.isAdmin)) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const StaffHomeScreen()),
        );
      } else {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const StudentHomeScreen()),
        );
      }
    } else {
      setState(() {
        _errorMessage = result['message'] ?? 'Authentication failed';
      });
    }
  }

  void _openServerConfig() {
    final serverController = TextEditingController(text: ApiService.baseUrl);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.bgCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.settings_ethernet_rounded, color: AppTheme.primaryLight),
            SizedBox(width: 8),
            Text('Server Connection', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Specify Backend REST API Host URL:',
              style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: serverController,
              decoration: const InputDecoration(
                hintText: 'http://127.0.0.1:5000',
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                ActionChip(
                  label: const Text('USB (127.0.0.1:5000)', style: TextStyle(fontSize: 11)),
                  onPressed: () => serverController.text = 'http://127.0.0.1:5000',
                ),
                ActionChip(
                  label: const Text('Wi-Fi LAN (10.88.96.88:5000)', style: TextStyle(fontSize: 11)),
                  onPressed: () => serverController.text = 'http://10.88.96.88:5000',
                ),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final newUrl = serverController.text.trim();
              if (newUrl.isNotEmpty) {
                ApiService.setBaseUrl(newUrl);
                final prefs = await SharedPreferences.getInstance();
                await prefs.setString('spillit_server_url', newUrl);
                if (context.mounted) Navigator.pop(context);
              }
            },
            child: const Text('Save & Apply'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: AppTheme.textMuted),
            tooltip: 'Configure Backend Server IP',
            onPressed: _openServerConfig,
          ),
        ],
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // App Logo Icon
                Center(
                  child: Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppTheme.primary, AppTheme.purple],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.primary.withValues(alpha: 0.4),
                          blurRadius: 24,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.shield_outlined,
                      color: Colors.white,
                      size: 38,
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // App Title
                const Center(
                  child: Text(
                    'CARE',
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.5,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                const Center(
                  child: Text(
                    'Campus Autonomous Reporting & Escalation',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ),
                const SizedBox(height: 2),
                const Center(
                  child: Text(
                    'Sri Krishna College of Engineering & Technology',
                    style: TextStyle(
                      fontSize: 11,
                      color: AppTheme.textMuted,
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // Domain Restriction Tag
                Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppTheme.primary.withValues(alpha: 0.3)),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.lock_outline_rounded, size: 14, color: AppTheme.primaryLight),
                        SizedBox(width: 6),
                        Text(
                          'Restricted to @skcet.ac.in',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.primaryLight,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 32),

                // Error Banner
                if (_errorMessage != null) ...[
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppTheme.rose.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.rose.withValues(alpha: 0.35)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.error_outline_rounded, color: AppTheme.rose, size: 20),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            _errorMessage!,
                            style: const TextStyle(color: Color(0xFFFDA4AF), fontSize: 13, height: 1.3),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                ],

                // Fast Profile Switcher Section
                const Text(
                  'INSTITUTIONAL FAST LOGIN (DEV SSO)',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textMuted,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: 12),

                // Student Login Button
                _buildFastLoginButton(
                  title: 'Anonymous Student Account',
                  subtitle: 'student@skcet.ac.in (HMAC Anonymized)',
                  badge: 'STUDENT',
                  badgeColor: AppTheme.primary,
                  onTap: () => _handleLogin('student@skcet.ac.in', name: 'Student'),
                ),
                const SizedBox(height: 10),

                // Staff Login Button
                _buildFastLoginButton(
                  title: 'Campus Maintenance Staff',
                  subtitle: 'staff.priya@skcet.ac.in (Civil & Ground)',
                  badge: 'STAFF',
                  badgeColor: AppTheme.emerald,
                  onTap: () => _handleLogin('staff.priya@skcet.ac.in', name: 'P. Priya (Staff)'),
                ),
                const SizedBox(height: 10),

                // Electrical Staff Button
                _buildFastLoginButton(
                  title: 'Electrical Facilities Desk',
                  subtitle: 'staff.saravanan@skcet.ac.in',
                  badge: 'STAFF',
                  badgeColor: AppTheme.secondary,
                  onTap: () => _handleLogin('staff.saravanan@skcet.ac.in', name: 'M. Saravanan'),
                ),
                const SizedBox(height: 24),

                // Or Custom Email Sign In
                Row(
                  children: [
                    const Expanded(child: Divider(color: AppTheme.borderSubtle)),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Text('OR CUSTOM EMAIL', style: TextStyle(color: AppTheme.textMuted, fontSize: 11, fontWeight: FontWeight.w600)),
                    ),
                    const Expanded(child: Divider(color: AppTheme.borderSubtle)),
                  ],
                ),
                const SizedBox(height: 16),

                TextField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    hintText: 'yourname@skcet.ac.in',
                    prefixIcon: Icon(Icons.email_outlined, color: AppTheme.textMuted),
                  ),
                ),
                const SizedBox(height: 16),

                ElevatedButton.icon(
                  onPressed: _isLoading || _emailController.text.trim().isEmpty
                      ? null
                      : () => _handleLogin(_emailController.text.trim()),
                  icon: _isLoading
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Icon(Icons.login_rounded),
                  label: Text(_isLoading ? 'Authenticating...' : 'Sign In with Google SSO'),
                ),
                const SizedBox(height: 16),

                // Domain Rejection Test Button
                OutlinedButton.icon(
                  onPressed: () => _handleLogin('hacker@gmail.com'),
                  icon: const Icon(Icons.security, size: 16, color: AppTheme.rose),
                  label: const Text('Test Non-SKCET Domain Rejection (403 Test)', style: TextStyle(fontSize: 12, color: AppTheme.rose)),
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: AppTheme.rose.withValues(alpha: 0.3)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFastLoginButton({
    required String title,
    required String subtitle,
    required String badge,
    required Color badgeColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: _isLoading ? null : onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.borderSubtle),
          boxShadow: const [
            BoxShadow(
              color: Color(0x080F172A),
              blurRadius: 10,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppTheme.textPrimary),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: badgeColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: badgeColor.withValues(alpha: 0.25)),
              ),
              child: Text(
                badge,
                style: TextStyle(color: badgeColor, fontSize: 10, fontWeight: FontWeight.w800),
              ),
            ),
            const SizedBox(width: 8),
            const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppTheme.textMuted),
          ],
        ),
      ),
    );
  }
}
