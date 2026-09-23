import { jsPDF } from 'jspdf';
import type { DailyLegalDigestEdition } from '../types/dailyDigest.types';

/**
 * Compiles and downloads an institutional PDF of the Daily Legal Digest & Case Law Brief
 */
export const generateDailyDigestPdf = (edition: DailyLegalDigestEdition): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // 1. Imperial Navy Banner with Double Gold Accent
  doc.setFillColor(10, 28, 54); // #0A1C36
  doc.rect(0, 0, pageWidth, 36, 'F');

  // Gold Lines
  doc.setDrawColor(193, 155, 72); // #C19B48
  doc.setLineWidth(1.0);
  doc.line(0, 36, pageWidth, 36);
  doc.setLineWidth(0.3);
  doc.line(0, 37.5, pageWidth, 37.5);

  // Header Typography
  doc.setTextColor(255, 255, 255);
  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.text('RAJINDER LAW ACADEMY', margin, 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(232, 207, 141); // Gold accent
  doc.text('JUDICIAL SERVICE EXAMINATION FOUNDATION • MORNING LEGAL BRIEF', margin, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    'Chamber Complex, Opposite High Court of Delhi | Web: rajinderlawacademy.com',
    margin,
    26
  );
  doc.text(
    `Date: ${edition.editionDateIST} • Edition #${edition.editionNumber} • Curated by: ${edition.curatedBy}`,
    margin,
    31
  );

  let y = 46;

  // 2. Digest Document Title
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text(edition.title, margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(edition.subtitle, margin, y);
  y += 9;

  // 3. Featured Legal Maxim Box (Dark Navy / Gold Card)
  if (edition.featuredMaxim) {
    const maxim = edition.featuredMaxim;
    doc.setFillColor(10, 28, 54); // #0A1C36
    doc.roundedRect(margin, y, contentWidth, 26, 3, 3, 'F');
    doc.setDrawColor(193, 155, 72);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, y, contentWidth, 26, 3, 3, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(232, 207, 141);
    doc.text('LEGAL MAXIM OF THE DAY', margin + 5, y + 6);

    doc.setFont('times', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(254, 240, 138); // Amber-200
    doc.text(maxim.latinText, margin + 5, y + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(226, 232, 240); // Slate-200
    const meaningLines = doc.splitTextToSize(
      `${maxim.englishMeaning} ${maxim.jurisprudenceContext}`,
      contentWidth - 10
    );
    doc.text(meaningLines, margin + 5, y + 17);

    y += 33;
  }

  // 4. Content Items Loop
  edition.items.forEach((item, idx) => {
    // Check if new page needed
    if (y > pageHeight - 50) {
      doc.addPage();
      y = 20;
    }



    // Badges: Category & Subject
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(193, 155, 72); // Gold
    doc.text(item.categoryBadge, margin, y);

    const catWidth = doc.getTextWidth(item.categoryBadge);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.setFont('helvetica', 'normal');
    doc.text(`•  ${item.subject}`, margin + catWidth + 3, y);
    y += 5;

    // Title
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42); // Slate-900
    const titleLines = doc.splitTextToSize(item.title, contentWidth);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 5;

    // Citation (if present)
    if (item.citation) {
      doc.setFont('courier', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(180, 83, 9); // Amber-700
      doc.text(item.citation, margin, y);
      y += 4.5;
    }

    // Summary
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85); // Slate-700
    const summaryLines = doc.splitTextToSize(item.summary, contentWidth);
    doc.text(summaryLines, margin, y);
    y += summaryLines.length * 4 + 2;

    // Examination Tip Box
    if (item.examinationTip) {
      doc.setFillColor(248, 250, 252); // Slate-50
      const tipLines = doc.splitTextToSize(
        `Judicial Examination Tip: ${item.examinationTip}`,
        contentWidth - 6
      );
      const tipBoxHeight = tipLines.length * 4 + 4;

      doc.roundedRect(margin, y, contentWidth, tipBoxHeight, 1.5, 1.5, 'F');
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, contentWidth, tipBoxHeight, 1.5, 1.5, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(tipLines, margin + 3, y + 4);
      y += tipBoxHeight + 6;
    } else {
      y += 4;
    }

    // Divider Line between items
    if (idx < edition.items.length - 1) {
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(margin, y - 2, margin + contentWidth, y - 2);
      y += 4;
    }
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, margin + contentWidth, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text(
      '© Rajinder Law Academy — Exclusively for Enrolled Judicial Aspirants',
      margin,
      pageHeight - 8
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 15, pageHeight - 8);
  }

  // Trigger browser download
  const safeFilename = `RLA_Daily_Legal_Digest_${edition.editionDateIST}.pdf`;
  doc.save(safeFilename);
};
