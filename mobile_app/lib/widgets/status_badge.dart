import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class StatusBadge extends StatelessWidget {
  final String status;

  const StatusBadge({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    String label;

    switch (status) {
      case 'UNASSIGNED':
        bg = AppTheme.rose.withValues(alpha: 0.15);
        fg = const Color(0xFFFDA4AF);
        label = 'UNASSIGNED';
        break;
      case 'ASSIGNED_STAFF':
        bg = AppTheme.primary.withValues(alpha: 0.15);
        fg = const Color(0xFFA5B4FC);
        label = 'IN PROGRESS (STAFF)';
        break;
      case 'ASSIGNED_ADMIN':
        bg = AppTheme.secondary.withValues(alpha: 0.15);
        fg = const Color(0xFF67E8F9);
        label = 'IN PROGRESS (ADMIN)';
        break;
      case 'PENDING_REVIEW':
        bg = AppTheme.amber.withValues(alpha: 0.15);
        fg = const Color(0xFFFDE047);
        label = 'PENDING REVIEW';
        break;
      case 'POSTED':
        bg = AppTheme.emerald.withValues(alpha: 0.15);
        fg = const Color(0xFF6EE7B7);
        label = 'RESOLVED & POSTED';
        break;
      case 'ARCHIVED':
        bg = Colors.white.withValues(alpha: 0.08);
        fg = const Color(0xFF94A3B8);
        label = 'ARCHIVED';
        break;
      default:
        bg = Colors.white.withValues(alpha: 0.08);
        fg = Colors.white;
        label = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: fg.withValues(alpha: 0.3)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: fg,
          fontSize: 10,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
