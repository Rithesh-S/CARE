import { jsPDF } from 'jspdf';

/**
 * Generates an official, beautifully formatted Institutional Memorandum PDF
 * for a staff member who failed to resolve a grievance within due time.
 */
export function generateStaffMemoPdf(memo) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // 1. Institutional Letterhead Border & Header
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(1.2);
  doc.rect(margin - 5, margin - 5, contentWidth + 10, pageHeight - margin * 2 + 10);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.rect(margin - 3, margin - 3, contentWidth + 6, pageHeight - margin * 2 + 6);

  // Institution Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('SRI KRISHNA COLLEGE OF ENGINEERING AND TECHNOLOGY', pageWidth / 2, margin + 8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('An Autonomous Institution | Accredited by NAAC with \'A\' Grade | Affiliated to Anna University', pageWidth / 2, margin + 13, { align: 'center' });
  doc.text('Kuniamuthur, Coimbatore - 641 008, Tamil Nadu, India', pageWidth / 2, margin + 17, { align: 'center' });

  // Divider line
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.8);
  doc.line(margin, margin + 21, pageWidth - margin, margin + 21);

  // CARE Banner
  doc.setFillColor(238, 242, 255);
  doc.roundedRect(margin, margin + 24, contentWidth, 12, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(67, 56, 202);
  doc.text('CARE • CAMPUS AUTONOMOUS REPORTING & ESCALATION SYSTEM', pageWidth / 2, margin + 31.5, { align: 'center' });

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(225, 29, 72);
  const warningLabel = memo.warning_level === 'FINAL_NOTICE'
    ? 'FINAL ADMINISTRATIVE SHOW-CAUSE NOTICE'
    : memo.warning_level === 'SHOW_CAUSE'
      ? 'SHOW-CAUSE MEMORANDUM (SLA BREACH)'
      : 'OFFICIAL ADVISORY & EXPLANATION MEMORANDUM';
  doc.text(warningLabel, pageWidth / 2, margin + 46, { align: 'center' });

  // Ref Number and Date Row
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Ref. No: ${memo.memo_number || 'CARE/MEMO/2026/001'}`, margin, margin + 55);
  doc.text(`Date of Issuance: ${new Date(memo.issued_at || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth - margin, margin + 55, { align: 'right' });

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(margin, margin + 58, pageWidth - margin, margin + 58);

  // To / Recipient Info Block
  let y = margin + 66;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('MEMORANDUM ISSUED TO:', margin, y);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(memo.staff_name || 'Designated Staff Officer', margin + 4, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Email Address: ${memo.staff_email || 'staff@skcet.ac.in'}`, margin + 4, y);
  doc.text(`Designation: Campus Facilities & Maintenance Personnel`, margin + 4, y + 4.5);

  y += 13;
  // Subject
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('SUBJECT:', margin, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(190, 18, 60);
  const subjectLines = doc.splitTextToSize(memo.subject || 'Failure to resolve assigned campus grievance within mandated SLA deadline.', contentWidth - 25);
  doc.text(subjectLines, margin + 22, y);

  y += (subjectLines.length * 5) + 6;

  // Grievance Details Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(79, 70, 229);
  doc.text('INCIDENT & SLA SPECIFICATIONS', margin + 6, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  const col1 = margin + 6;
  const col2 = margin + 85;

  doc.text(`• Incident Reference ID: ${memo.issue_id?._id || memo.issue_id || 'N/A'}`, col1, y + 13);
  doc.text(`• Campus Zone / Block: ${memo.zone || 'Campus Premises'}`, col1, y + 19);
  doc.text(`• Incident Classification: ${memo.category || 'Facilities & Welfare'}`, col1, y + 25);
  doc.text(`• Escalation Severity: Critical Campus Maintenance`, col1, y + 31);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(225, 29, 72);
  doc.text(`• Elapsed Overdue: ${memo.days_overdue || 1} Day(s) past SLA`, col2, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(`• Extension Status: None / Not Approved`, col2, y + 19);
  doc.text(`• Direct Public Safety Impact: High Priority`, col2, y + 25);
  doc.text(`• Accountability Index: Breach Recorded`, col2, y + 31);

  y += 46;

  // Memo Body Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. STATEMENT OF INFRACTION', margin, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(51, 65, 85);
  const statement = memo.reason || 'You were designated and notified regarding the above campus grievance. Records indicate that despite automated notifications and SLA countdown tracking, you hesitated and failed to inspect or complete the required rectification within the stipulated SLA timeframe.';
  const statementLines = doc.splitTextToSize(statement, contentWidth);
  doc.text(statementLines, margin, y);

  y += (statementLines.length * 4.5) + 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. REQUIRED CORRECTIVE ACTION & COMPLIANCE TIMELINE', margin, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(51, 65, 85);
  const actionText = memo.action_required || 'You are hereby directed to immediately inspect the reported site, execute necessary corrective measures, and submit live photographic evidence via the CARE staff interface within 24 hours. Furthermore, a formal written explanation specifying reasons for the delay must be submitted to the administration within 48 hours.';
  const actionLines = doc.splitTextToSize(actionText, contentWidth);
  doc.text(actionLines, margin, y);

  y += (actionLines.length * 4.5) + 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. ADMINISTRATIVE DISCIPLINARY CLAUSE', margin, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  const clauseText = 'Failure to comply with this notice within the stipulated duration shall warrant escalation to the Standing Disciplinary Committee and will be entered into your institutional performance dossier under Sri Krishna College of Engineering & Technology service bylaws.';
  const clauseLines = doc.splitTextToSize(clauseText, contentWidth);
  doc.text(clauseLines, margin, y);

  // Signature Block
  const sigY = pageHeight - margin - 24;

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(margin, sigY - 4, pageWidth - margin, sigY - 4);

  // Left Stamp Placeholder
  doc.setDrawColor(79, 70, 229);
  doc.roundedRect(margin, sigY, 44, 18, 2, 2);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(79, 70, 229);
  doc.text('CARE DISPATCH SEAL', margin + 22, sigY + 7, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('AUTHENTICATED DIGITAL COPY', margin + 22, sigY + 12, { align: 'center' });

  // Right Signatory
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Office of Campus Administration & Student Welfare', pageWidth - margin, sigY + 4, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Sri Krishna College of Engineering and Technology', pageWidth - margin, sigY + 9, { align: 'right' });
  doc.text('Issued electronically via CARE Command Engine', pageWidth - margin, sigY + 14, { align: 'right' });

  // Trigger download
  const safeName = (memo.staff_name || 'Staff').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `CARE_Official_Staff_Memo_${safeName}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

/**
 * Generates an Executive Incident & Grievance Report PDF
 * for a requested date range (up to 31 days).
 */
export function generateAnalyticsReportPdf(analyticsData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('SRI KRISHNA COLLEGE OF ENGINEERING AND TECHNOLOGY', pageWidth / 2, margin + 6, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('CARE System • Executive Campus Grievance & SLA Performance Report', pageWidth / 2, margin + 11, { align: 'center' });

  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.8);
  doc.line(margin, margin + 15, pageWidth - margin, margin + 15);

  const p = analyticsData?.period || {};
  const s = analyticsData?.summary || {};

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(67, 56, 202);
  doc.text(`REPORT PERIOD: ${p.start_date || 'N/A'} to ${p.end_date || 'N/A'} (${p.days_count || 31} Days Window)`, margin, margin + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth - margin, margin + 22, { align: 'right' });

  // Summary Metrics Grid (Table format)
  let y = margin + 28;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 24);

  const colW = contentWidth / 4;
  const metrics = [
    { label: 'TOTAL INCIDENTS', val: `${s.total_incidents || 0}` },
    { label: 'RESOLVED & VERIFIED', val: `${s.total_resolved || 0}` },
    { label: 'SLA COMPLIANCE', val: `${s.sla_compliance_rate || 0}%` },
    { label: 'AVG TURNAROUND', val: `${s.avg_resolution_time_hours || 0} hrs` }
  ];

  metrics.forEach((m, idx) => {
    const x = margin + (idx * colW);
    if (idx > 0) {
      doc.line(x, y, x, y + 24);
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, x + (colW / 2), y + 7, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(m.val, x + (colW / 2), y + 17, { align: 'center' });
  });

  y += 32;

  // Daily Progress Breakdown Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DATE-WISE INCIDENT LEDGER & PROGRESSION', margin, y);

  y += 6;

  // Table header
  doc.setFillColor(79, 70, 229);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);

  const tCols = [
    { label: 'Date', x: margin + 4 },
    { label: 'Reported', x: margin + 35 },
    { label: 'Unassigned', x: margin + 65 },
    { label: 'Assigned', x: margin + 95 },
    { label: 'In Review', x: margin + 125 },
    { label: 'Resolved', x: margin + 155 }
  ];

  tCols.forEach(c => doc.text(c.label, c.x, y + 4.8));

  y += 7;

  // Table rows
  const timeline = analyticsData?.date_wise_timeline || [];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(30, 41, 59);

  const displayRows = timeline.slice(0, 16); // Up to 16 rows to fit page cleanly
  displayRows.forEach((row, i) => {
    if (i % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 5.5, 'F');
    }
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 5.5, pageWidth - margin, y + 5.5);

    doc.text(row.display_date || row.date, tCols[0].x, y + 4);
    doc.text(`${row.reported || 0}`, tCols[1].x, y + 4);
    doc.text(`${row.unassigned || 0}`, tCols[2].x, y + 4);
    doc.text(`${row.assigned_staff || 0}`, tCols[3].x, y + 4);
    doc.text(`${row.pending_review || 0}`, tCols[4].x, y + 4);
    doc.text(`${row.resolved || 0}`, tCols[5].x, y + 4);

    y += 5.5;
  });

  y += 8;

  // Category Distribution & Hotspots Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('INCIDENT CATEGORIES & CAMPUS HOTSPOTS SUMMARY', margin, y);

  y += 5;
  const categories = Object.entries(analyticsData?.category_breakdown || {});
  const hotspots = Object.entries(analyticsData?.block_hotspots || {});

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  const topCategories = categories.slice(0, 5).map(([c, count]) => `${c}: ${count}`).join('  |  ');
  const topHotspots = hotspots.slice(0, 5).map(([b, count]) => `${b}: ${count}`).join('  |  ');

  doc.text(`Categories: ${topCategories || 'None recorded'}`, margin, y + 4);
  doc.text(`Hotspot Blocks: ${topHotspots || 'None recorded'}`, margin, y + 9);

  // Footer Sign-Off
  const footerY = pageHeight - margin - 10;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('CARE Autonomous Analytics Engine • Sri Krishna College of Engineering & Technology', margin, footerY + 6);
  doc.text('Page 1 of 1 • Official System Export', pageWidth - margin, footerY + 6, { align: 'right' });

  const filename = `CARE_Analytics_Report_${p.start_date}_to_${p.end_date}.pdf`;
  doc.save(filename);
}
