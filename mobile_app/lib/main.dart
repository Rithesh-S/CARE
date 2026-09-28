import 'package:flutter/material.dart';
import 'services/api_service.dart';
import 'theme/app_theme.dart';
import 'screens/login_screen.dart';
import 'screens/student/student_home_screen.dart';
import 'screens/staff/staff_home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Check if existing token/user is persisted
  final bool hasSession = await ApiService().initSession();

  runApp(CareApp(hasSession: hasSession));
}

class CareApp extends StatelessWidget {
  final bool hasSession;

  const CareApp({super.key, required this.hasSession});

  @override
  Widget build(BuildContext context) {
    Widget initialScreen = const LoginScreen();

    if (hasSession) {
      final user = ApiService().currentUser;
      if (user != null && (user.isStaff || user.isAdmin)) {
        initialScreen = const StaffHomeScreen();
      } else {
        initialScreen = const StudentHomeScreen();
      }
    }

    return MaterialApp(
      title: 'CARE • Campus Autonomous Reporting & Escalation',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: initialScreen,
    );
  }
}
