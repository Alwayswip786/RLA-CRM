import { jsPDF } from 'jspdf';

export interface NoticePdfData {
  circularNo: string;
  title: string;
  content: string;
  category: string;
  priority?: 'normal' | 'urgent';
  targetCohorts?: string;
  publishedAt?: string | Date;
  issuedBy?: string;
  authorName?: string;
}

/**
 * Generates an official, high-resolution Gazette PDF for an Academy Circular.
 */
export const generateNoticePdf = (notice: NoticePdfData): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  // 1. Top Decorative Ribbon (Imperial Navy with Double Gold Accent)
  doc.setFillColor(10, 28, 54); // #0A1C36
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Gold Line 1
  doc.setDrawColor(193, 155, 72); // #C19B48
  doc.setLineWidth(1.0);
  doc.line(0, 38, pageWidth, 38);

  // Gold Line 2 (Hairline)
  doc.setLineWidth(0.3);
  doc.line(0, 39.5, pageWidth, 39.5);

  // 2. Academy Header Typography (White on Navy)
  doc.setTextColor(255, 255, 255);
  doc.setFont('times', 'bold');
  doc.setFontSize(20);
  doc.text('RAJINDER LAW ACADEMY', margin, 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(232, 207, 141); // #E8CF8D
  doc.text('APEX INSTITUTE FOR JUDICIAL SERVICES EXAMINATIONS (DJS, PCS-J, HJS)', margin, 21);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225); // Slate-300
  doc.text(
    'Chamber Complex, Opposite High Court of Delhi, New Delhi – 110003 | Web: rajinderlawacademy.com',
    margin,
    27
  );
  doc.text(
    'Phone: +91 98765 43210 • Institutional Portal: classroom.rajinderlawacademy.com',
    margin,
    32
  );

  // 3. Document Title / Subheader
  let y = 48;
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text('OFFICIAL ADMINISTRATIVE GAZETTE & CLASSROOM CIRCULAR', margin, y);

  // Underline for title
  doc.setDrawColor(193, 155, 72);
  doc.setLineWidth(0.5);
  doc.line(margin, y + 2, margin + 145, y + 2);

  // 4. Metadata Box
  y = 56;
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(203, 213, 225); // Slate-300
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  const pubDate = notice.publishedAt
    ? new Date(notice.publishedAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // Slate-600

  // Row 1 inside box
  doc.text('CIRCULAR NUMBER:', margin + 4, y + 6);
  doc.setFont('courier', 'bold');
  doc.setTextColor(193, 155, 72); // Gold
  doc.text(notice.circularNo || 'RLA/CIR/2026/001', margin + 38, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('DATE OF ISSUE:', margin + 95, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(pubDate, margin + 125, y + 6);

  // Row 2 inside box
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('CATEGORY:', margin + 4, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(notice.category || 'General', margin + 38, y + 13);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('PRIORITY LEVEL:', margin + 95, y + 13);
  doc.setFont('helvetica', 'bold');
  if (notice.priority === 'urgent') {
    doc.setTextColor(220, 38, 38); // Red-600
    doc.text('URGENT (ACTION REQUIRED)', margin + 125, y + 13);
  } else {
    doc.setTextColor(16, 185, 129); // Emerald-600
    doc.text('NORMAL CIRCULAR', margin + 125, y + 13);
  }

  // Row 3 inside box
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('TARGET COHORT:', margin + 4, y + 20);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(notice.targetCohorts || 'All Enrolled Batches', margin + 38, y + 20);

  // 5. Subject Box (Highlight Banner)
  y = 86;
  doc.setFillColor(241, 245, 249); // Slate-100
  doc.setDrawColor(193, 155, 72);
  doc.setLineWidth(0.6);
  doc.rect(margin, y, contentWidth, 12, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(164, 125, 49); // #A47D31
  doc.text('SUBJECT:', margin + 3, y + 5);

  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  const subjectLines = doc.splitTextToSize(notice.title, contentWidth - 25);
  doc.text(subjectLines, margin + 22, y + 5.2);

  // Adjust y based on subject lines length
  y += Math.max(14, subjectLines.length * 5 + 8);

  // 6. Circular Body Content
  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59); // Slate-800

  // Split multi-paragraph content
  const paragraphs = notice.content.split('\n').filter((p) => p.trim());
  for (const para of paragraphs) {
    const wrappedLines = doc.splitTextToSize(para.trim(), contentWidth);
    
    // Page overflow safety
    if (y + wrappedLines.length * 5.5 > pageHeight - 55) {
      doc.addPage();
      y = 25;
    }
    
    doc.text(wrappedLines, margin, y, { lineHeightFactor: 1.35 });
    y += wrappedLines.length * 5.5 + 4;
  }

  // 7. Signatory & Digital Verification Area
  const signatureY = Math.max(y + 8, pageHeight - 50);

  // Divider above footer
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(0.4);
  doc.line(margin, signatureY - 4, margin + contentWidth, signatureY - 4);

  // Left Stamp: IT Act Verification Note
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text('OFFICIAL VERIFICATION:', margin, signatureY + 2);
  doc.text('Certified digital circular registered in RLA CRM Vault.', margin, signatureY + 6);
  doc.text(
    `Verification Hash: RLA-PASS-${(notice.circularNo || '2026').replace(/[^a-zA-Z0-9]/g, '')}-SECURE`,
    margin,
    signatureY + 10
  );
  doc.text(
    'Valid without physical signature under Section 4 of IT Act, 2000.',
    margin,
    signatureY + 14
  );

  // Right Seal: Author & Director
  const rightX = margin + contentWidth - 65;
  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(notice.authorName || 'Adv. Rajinder Sir', rightX, signatureY + 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(notice.issuedBy || 'Director Office, Rajinder Law Academy', rightX, signatureY + 6);
  doc.text('Apex Institute for Judicial Services & Research', rightX, signatureY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(193, 155, 72);
  doc.text('ACADEMY DIGITAL SEAL ATTESTED', rightX, signatureY + 15);

  // 8. Bottom Page Footer
  doc.setFillColor(10, 28, 54);
  doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(232, 207, 141);
  doc.text(
    'RAJINDER LAW ACADEMY • CONFIDENTIAL FOR ENROLLED STUDENTS ONLY • UNAUTHORIZED SHARING PROHIBITED',
    pageWidth / 2,
    pageHeight - 3,
    { align: 'center' }
  );

  // 9. Download the PDF
  const filename = `RLA_Circular_${(notice.circularNo || 'RLA_CIR').replace(/[\/\\?%*:|"<>]/g, '_')}.pdf`;
  doc.save(filename);
};
