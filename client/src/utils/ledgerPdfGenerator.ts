/**
 * Kunchinittu Ledger PDF Generator
 * Client-side PDF generation for Kunchinittu Ledger reports
 * Matches frontend design exactly with Inward/Outward sections
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// A4 dimensions in mm (portrait)
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 10;

interface LedgerEntry {
    id: number;
    slNo: string;
    date: string;
    movementType: string;
    broker?: string;
    fromLocation?: string;
    toLocation?: string;
    variety?: string;
    bags: number;
    moisture?: number;
    cutting?: string;
    wbNo?: string;
    netWeight: number;
    lorryNumber?: string;
    totalAmount?: number;
    averageRate?: number;
}

interface LedgerData {
    kunchinittu: {
        id: number;
        code: string;
        name?: string;
    };
    warehouse: {
        name: string;
        code?: string;
    };
    variety?: string;
    averageRate?: number;
    summary: {
        inward: { bags: number; netWeight: number };
        outward: { bags: number; netWeight: number };
        remaining: { bags: number; netWeight: number };
    };
    inwardRecords: LedgerEntry[];
    outwardRecords: LedgerEntry[];
}

/**
 * Generate PDF for Kunchinittu Ledger - matches frontend exactly
 */
export const generateKunchinintuLedgerPDF = (
    ledgerData: LedgerData,
    dateRange?: { from?: string; to?: string }
): void => {
    console.log('📊 Generating Kunchinittu Ledger PDF...');

    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = 297;
    const pageHeight = 210;
    const contentWidth = pageWidth - (MARGIN * 2);

    // Title header
    doc.setFillColor(245, 158, 11); // Amber #f59e0b
    doc.rect(0, 0, pageWidth, 20, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`Kunchinittu Ledger - ${ledgerData.kunchinittu.code}`, pageWidth / 2, 12, { align: 'center' });

    let yPos = 28;

    // Kunchinittu Info Box
    doc.setFillColor(248, 249, 250);
    doc.rect(MARGIN, yPos - 4, contentWidth, 18, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(MARGIN, yPos - 4, contentWidth, 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`Kanchi Nittu Code:`, MARGIN + 5, yPos + 2);
    doc.setFont('helvetica', 'normal');
    doc.text(ledgerData.kunchinittu.code, MARGIN + 45, yPos + 2);

    doc.setFont('helvetica', 'bold');
    doc.text(`Alloted Warehouse:`, MARGIN + 100, yPos + 2);
    doc.setFont('helvetica', 'normal');
    doc.text(ledgerData.warehouse.name || '-', MARGIN + 145, yPos + 2);

    doc.setFont('helvetica', 'bold');
    doc.text(`Alloted Variety:`, MARGIN + 5, yPos + 8);
    doc.setFont('helvetica', 'normal');
    doc.text(ledgerData.variety || 'SUM25 RNR', MARGIN + 40, yPos + 8);

    doc.setFont('helvetica', 'bold');
    doc.text(`Average Rate:`, MARGIN + 100, yPos + 8);
    doc.setFont('helvetica', 'normal');
    const avgRate = ledgerData.averageRate || 0;
    doc.setTextColor(16, 185, 129); // Green for rate
    doc.text(`₹${avgRate.toFixed(2)}/Q`, MARGIN + 135, yPos + 8);
    doc.setTextColor(0, 0, 0);

    yPos += 20;

    // Summary Section
    doc.setFillColor(243, 244, 246);
    doc.rect(MARGIN, yPos, contentWidth, 20, 'F');

    const summaryColWidth = contentWidth / 3;

    // Inward summary
    doc.setFillColor(209, 250, 229); // Light green
    doc.rect(MARGIN, yPos, summaryColWidth, 20, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 163, 74); // Green
    doc.text('INWARD', MARGIN + summaryColWidth / 2, yPos + 6, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`${ledgerData.summary.inward.bags} Bags`, MARGIN + summaryColWidth / 2, yPos + 12, { align: 'center' });
    doc.text(`${ledgerData.summary.inward.netWeight.toFixed(2)} kg`, MARGIN + summaryColWidth / 2, yPos + 17, { align: 'center' });

    // Outward summary
    doc.setFillColor(254, 226, 226); // Light red
    doc.rect(MARGIN + summaryColWidth, yPos, summaryColWidth, 20, 'F');
    doc.setTextColor(220, 38, 38); // Red
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('OUTWARD', MARGIN + summaryColWidth + summaryColWidth / 2, yPos + 6, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`${ledgerData.summary.outward.bags} Bags`, MARGIN + summaryColWidth + summaryColWidth / 2, yPos + 12, { align: 'center' });
    doc.text(`${ledgerData.summary.outward.netWeight.toFixed(2)} kg`, MARGIN + summaryColWidth + summaryColWidth / 2, yPos + 17, { align: 'center' });

    // Remaining summary
    doc.setFillColor(254, 243, 199); // Light amber
    doc.rect(MARGIN + summaryColWidth * 2, yPos, summaryColWidth, 20, 'F');
    doc.setTextColor(217, 119, 6); // Amber
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('REMAINING', MARGIN + summaryColWidth * 2 + summaryColWidth / 2, yPos + 6, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`${ledgerData.summary.remaining.bags} Bags`, MARGIN + summaryColWidth * 2 + summaryColWidth / 2, yPos + 12, { align: 'center' });
    doc.text(`${ledgerData.summary.remaining.netWeight.toFixed(2)} kg`, MARGIN + summaryColWidth * 2 + summaryColWidth / 2, yPos + 17, { align: 'center' });

    yPos += 28;

    // Inward Section
    if (ledgerData.inwardRecords && ledgerData.inwardRecords.length > 0) {
        doc.setFillColor(209, 250, 229); // Light green
        doc.rect(MARGIN, yPos - 4, contentWidth, 8, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(22, 163, 74);
        doc.text(`Inward (${ledgerData.inwardRecords.length} records)`, MARGIN + 5, yPos + 1);
        yPos += 8;

        // Inward table - matching frontend columns
        const inwardColumns = ['S.No', 'Date', 'Type', 'Broker', 'From', 'To', 'Variety', 'Bags', 'M%', 'Cutting', 'WB No', 'Net Wt', 'Lorry', 'Amount', 'Rate/Q'];

        autoTable(doc, {
            startY: yPos,
            head: [inwardColumns],
            body: ledgerData.inwardRecords.map((r, idx) => [
                (idx + 1).toString(),
                r.date ? new Date(r.date).toLocaleDateString('en-GB') : '-',
                r.movementType || '-',
                r.broker || '-',
                r.fromLocation || '-',
                r.toLocation || '-',
                r.variety || '-',
                r.bags?.toString() || '0',
                r.moisture?.toString() || '-',
                r.cutting || '-',
                r.wbNo || '-',
                r.netWeight?.toFixed(2) || '0.00',
                r.lorryNumber || '-',
                r.totalAmount ? `₹${r.totalAmount.toFixed(0)}` : '-',
                r.averageRate ? `₹${r.averageRate.toFixed(2)}` : '-'
            ]),
            theme: 'grid',
            styles: { fontSize: 6, cellPadding: 1.5 },
            headStyles: { fillColor: [74, 144, 226], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 249, 250] },
            margin: { left: MARGIN, right: MARGIN }
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Outward Section
    if (ledgerData.outwardRecords && ledgerData.outwardRecords.length > 0) {
        if (yPos > pageHeight - 50) {
            doc.addPage();
            yPos = MARGIN + 10;
        }

        doc.setFillColor(254, 226, 226); // Light red
        doc.rect(MARGIN, yPos - 4, contentWidth, 8, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 38, 38);
        doc.text(`Outward (${ledgerData.outwardRecords.length} records)`, MARGIN + 5, yPos + 1);
        yPos += 8;

        // Outward table - matching frontend columns
        const outwardColumns = ['S.No', 'Date', 'Type', 'Broker', 'From', 'To', 'Variety', 'Bags', 'M%', 'Cutting', 'WB No', 'Net Wt', 'Lorry', 'Amount', 'Rate/Q'];

        autoTable(doc, {
            startY: yPos,
            head: [outwardColumns],
            body: ledgerData.outwardRecords.map((r, idx) => [
                (idx + 1).toString(),
                r.date ? new Date(r.date).toLocaleDateString('en-GB') : '-',
                r.movementType || '-',
                r.broker || '-',
                r.fromLocation || '-',
                r.toLocation || '-',
                r.variety || '-',
                r.bags?.toString() || '0',
                r.moisture?.toString() || '-',
                r.cutting || '-',
                r.wbNo || '-',
                r.netWeight?.toFixed(2) || '0.00',
                r.lorryNumber || '-',
                r.totalAmount ? `₹${r.totalAmount.toFixed(0)}` : '-',
                r.averageRate ? `₹${r.averageRate.toFixed(2)}` : '-'
            ]),
            theme: 'grid',
            styles: { fontSize: 6, cellPadding: 1.5 },
            headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 249, 250] },
            margin: { left: MARGIN, right: MARGIN }
        });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - MARGIN, pageHeight - 5, { align: 'right' });
        doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`, MARGIN, pageHeight - 5);
    }

    // Download
    const filename = `Kunchinittu_Ledger_${ledgerData.kunchinittu.code}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    console.log(`✅ PDF Generated: ${filename}`);
};
