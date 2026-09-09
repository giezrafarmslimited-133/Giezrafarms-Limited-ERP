import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AIAutomatedReport } from '../../../types/erp';

export function exportReportToPdf(report: AIAutomatedReport) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 15;

  // Header Banner Background
  doc.setFillColor(27, 67, 50); // #1b4332 Deep Emerald
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Decorative Gold Accent Line
  doc.setFillColor(212, 175, 55); // #d4af37 Gold
  doc.rect(0, 27, pageWidth, 2, 'F');

  // Company Name & System Label
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('GIEZRA FARMS LIMITED', 14, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(212, 175, 55);
  doc.text('COMMERCIAL POULTRY ABATTOIR & BUSINESS INTELLIGENCE SYSTEM', 14, 18);

  doc.setFontSize(7);
  doc.setTextColor(220, 240, 230);
  doc.text('TIN: 142-890-321 | VRN: 40-029182-K | Dar es Salaam & Coast Region, Tanzania', 14, 23);

  // Top-right Date & Ref
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('EXECUTIVE AUDIT REPORT', pageWidth - 14, 12, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(212, 175, 55);
  doc.text(`Ref: ${report.id.toUpperCase()}`, pageWidth - 14, 18, { align: 'right' });
  doc.setTextColor(230, 230, 230);
  doc.text(`Date: ${new Date(report.generatedAt).toLocaleDateString('en-GB')}`, pageWidth - 14, 23, { align: 'right' });

  currentY = 38;

  // Report Title Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(27, 67, 50);
  doc.text(report.title, 14, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(report.subtitle, 14, currentY);

  currentY += 4;
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Scope Period: ${report.dateRange}  |  Compiled By: ${report.generatedBy}  |  Authorized by: CEO Office`, 14, currentY);

  currentY += 8;

  // Key Metrics Badges / Summary Grid
  if (report.keyMetrics && Object.keys(report.keyMetrics).length > 0) {
    const entries = Object.entries(report.keyMetrics);
    const boxWidth = (pageWidth - 28 - (entries.length > 4 ? 3 : (entries.length - 1)) * 3) / Math.min(entries.length, 3);
    let startX = 14;
    let cardY = currentY;

    entries.slice(0, 6).forEach(([key, val], idx) => {
      if (idx > 0 && idx % 3 === 0) {
        cardY += 16;
        startX = 14;
      }

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(startX, cardY, boxWidth, 13, 2, 2, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(key.toUpperCase(), startX + 3, cardY + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(27, 67, 50);
      doc.text(String(val), startX + 3, cardY + 10.5);

      startX += boxWidth + 3;
    });

    currentY = cardY + 18;
  }

  // Executive AI Narrative
  doc.setFillColor(241, 248, 245);
  doc.setDrawColor(180, 220, 200);
  doc.roundedRect(14, currentY, pageWidth - 28, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(27, 67, 50);
  doc.text('AI EXECUTIVE SYNTHESIS & COMMENTARY (GEMINI 3.8 FLASH):', 18, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const narrativeLines = doc.splitTextToSize(report.executiveNarrative, pageWidth - 36);
  doc.text(narrativeLines.slice(0, 4), 18, currentY + 10);

  currentY += 26;

  // Tabular Data
  autoTable(doc, {
    startY: currentY,
    head: [report.tableHeaders],
    body: report.tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [27, 67, 50],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14 },
    tableWidth: 'auto',
    didDrawPage: (data) => {
      currentY = data.cursor?.y || currentY;
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Check page overflow before recommendations
  if (currentY > 235) {
    doc.addPage();
    currentY = 20;
  }

  // Strategic Directives
  if (report.strategicRecommendations && report.strategicRecommendations.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(27, 67, 50);
    doc.text('STRATEGIC ACTIONS & OPERATIONAL DIRECTIVES:', 14, currentY);
    currentY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);

    report.strategicRecommendations.forEach((rec) => {
      doc.setFillColor(212, 175, 55);
      doc.circle(17, currentY - 1, 1, 'F');
      const recText = doc.splitTextToSize(rec, pageWidth - 34);
      doc.text(recText, 21, currentY);
      currentY += recText.length * 4 + 1;
    });
  }

  currentY += 6;

  // Authorization Signatures
  if (currentY > 245) {
    doc.addPage();
    currentY = 20;
  }

  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(14, currentY + 12, 70, currentY + 12);
  doc.line(pageWidth - 70, currentY + 12, pageWidth - 14, currentY + 12);

  doc.setLineDashPattern([], 0);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('CHIEF EXECUTIVE OFFICER (CEO)', 14, currentY + 16);
  doc.text('GIEZRA FARMS LIMITED', 14, currentY + 20);

  doc.text('DIRECTOR OF ABATTOIR OPERATIONS', pageWidth - 14, currentY + 16, { align: 'right' });
  doc.text('COLD-CHAIN COMPLIANCE & QUALITY', pageWidth - 14, currentY + 20, { align: 'right' });

  // Footer Disclaimer
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'CONFIDENTIAL - For internal executive leadership & board governance review only. Generated by GIEZRA ERP Intelligence Engine.',
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 8,
    { align: 'center' }
  );

  // Save the PDF
  const safeFilename = `${report.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(safeFilename);
}
