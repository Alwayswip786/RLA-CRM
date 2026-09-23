import { apiClient } from '../lib/apiClient';
import type { TestAnalyticsResponse } from '../types/testAnalytics.types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Fetch the authenticated student's test scorecards & latest test analytics
 */
export const fetchMyTestAnalytics = async (): Promise<TestAnalyticsResponse> => {
  const res = await apiClient.get<TestAnalyticsResponse>('/tests/analytics/my');
  return res.data;
};

/**
 * Record a new completed test attempt
 */
export const recordTestAttempt = async (attemptData: {
  testTitle: string;
  testType?: string;
  targetExam?: string;
  totalQuestions?: number;
  maxScore?: number;
  correct: number;
  incorrect: number;
  unattempted?: number;
  negativeMarkWeight?: number;
  avgTimePerMcq?: number;
  timeSpentMinutes?: number;
}) => {
  const res = await apiClient.post('/tests/analytics/attempts', attemptData);
  return res.data;
};

/**
 * Generate and download branded Academy Candidate Performance PDF Dossier
 */
export const exportPerformancePdf = (
  analytics: TestAnalyticsResponse,
  studentName: string = 'Adv. Rohit Verma'
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor: [number, number, number] = [10, 28, 54]; // #0a1c36 Navy
  const goldColor: [number, number, number] = [193, 155, 72]; // #c19b48 Gold
  const slateDark: [number, number, number] = [51, 65, 85];

  // Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('RAJINDER LAW ACADEMY', 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(232, 207, 141);
  doc.text('All-India Judicial Services Mentorship CRM | Official Scorecard & Rank Dossier', 14, 22);

  doc.setFontSize(8);
  doc.setTextColor(200, 215, 235);
  doc.text(
    `Candidate: ${studentName} | Generated: ${new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })}`,
    14,
    29
  );

  // Latest Test Spotlight Section
  if (analytics.latestTest) {
    const lt = analytics.latestTest;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 42, 182, 38, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 42, 182, 38, 3, 3, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...primaryColor);
    doc.text(`Latest Test Spotlight: ${lt.title}`, 20, 50);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...slateDark);
    doc.text(
      `Attempted: ${new Date(lt.attemptedAt).toLocaleDateString('en-IN')} | Exam: ${lt.targetExam || 'Judicial Services'}`,
      20,
      55
    );

    // 4 Key Stats Box
    const metrics = [
      { label: 'All-India Rank', val: `AIR #${lt.rank}`, sub: lt.percentileBand },
      { label: 'Score Achieved', val: lt.scoreFormatted, sub: `${lt.accuracy}% Accuracy` },
      { label: 'Avg Pace / MCQ', val: `${lt.avgTimePerMcq}s`, sub: 'Speed metric' },
      { label: 'Negative Penalty', val: lt.negativeMarksFormatted, sub: `${lt.incorrect} incorrect` },
    ];

    metrics.forEach((m, idx) => {
      const x = 20 + idx * 44;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(m.label.toUpperCase(), x, 63);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...goldColor);
      doc.text(m.val, x, 69);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(m.sub.slice(0, 22), x, 74);
    });
  }

  // Completed Test Reports Table
  const startY = analytics.latestTest ? 88 : 46;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text('Completed Mock Tests & MCQ Reports', 14, startY);

  const tableRows = (analytics.reports || []).map((r) => [
    r.title,
    r.dateFormatted,
    r.score,
    r.rank,
    r.accuracy,
    `${r.correct} / ${r.incorrect} / ${r.unattempted}`,
    `${r.avgTimePerMcq}s`,
    r.negativeMarksFormatted,
  ]);

  autoTable(doc, {
    startY: startY + 4,
    head: [['Test Title', 'Date', 'Score', 'Rank', 'Accuracy', 'C / W / U', 'Pace', 'Penalty']],
    body: tableRows.length > 0 ? tableRows : [['No tests attempted yet.', '-', '-', '-', '-', '-', '-', '-']],
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Confidential Candidate Report • Rajinder Law Academy • Strictly for enrolled student guidance',
    14,
    pageHeight - 10
  );

  doc.save(`RLA_Performance_Dossier_${studentName.replace(/\s+/g, '_')}.pdf`);
};
