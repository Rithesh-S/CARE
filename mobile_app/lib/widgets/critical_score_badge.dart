import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class CriticalScoreBadge extends StatelessWidget {
  final int score;
  final bool showLabel;

  const CriticalScoreBadge({
    super.key,
    required this.score,
    this.showLabel = true,
  });

  @override
  Widget build(BuildContext context) {
    final bool isUrgent = score >= 8;
    final bool isHigh = score >= 6 && score < 8;

    final Color badgeColor = isUrgent
        ? AppTheme.rose
        : isHigh
            ? AppTheme.amber
            : AppTheme.emerald;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: badgeColor.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: badgeColor.withValues(alpha: 0.35)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: badgeColor,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            showLabel ? 'SEVERITY $score/10' : '$score/10',
            style: TextStyle(
              color: badgeColor,
              fontWeight: FontWeight.w700,
              fontSize: 11,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}
