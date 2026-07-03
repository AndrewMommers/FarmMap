import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type Cell = string | number | boolean | null | undefined;

// ─── CSV ─────────────────────────────────────────────────────────────────────

function escapeCSV(value: Cell): string {
  const s = String(value ?? '');
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

export function downloadCSV(filename: string, headers: string[], rows: Cell[][]): void {
  const lines = [
    headers.map(escapeCSV).join(','),
    ...rows.map((r) => r.map(escapeCSV).join(',')),
  ];
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

// ─── PDF ─────────────────────────────────────────────────────────────────────

/** Farm-branded PDF with an autoTable. */
export function downloadPDF(
  filename: string,
  title: string,
  headers: string[],
  rows: Cell[][],
  subtitle?: string,
): void {
  const doc = new jsPDF({ orientation: rows[0]?.length > 6 ? 'landscape' : 'portrait' });

  const farmGreen: [number, number, number] = [21, 128, 61];
  const lightGreen: [number, number, number] = [240, 253, 244];
  const generated = new Date().toLocaleDateString('en-AU', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  // Branding header
  doc.setFillColor(...farmGreen);
  doc.rect(0, 0, doc.internal.pageSize.width, 14, 'F');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('FarmMap', 14, 9);
  doc.setFontSize(9);
  doc.text(`Generated ${generated}`, doc.internal.pageSize.width - 14, 9, { align: 'right' });

  // Title block
  doc.setFontSize(15);
  doc.setTextColor(21, 128, 61);
  doc.text(title, 14, 24);
  let y = 30;
  if (subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, 14, y);
    y += 6;
  }

  autoTable(doc, {
    startY: y + 2,
    head: [headers],
    body: rows.map((r) => r.map((v) => String(v ?? ''))),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: farmGreen, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: lightGreen },
    margin: { left: 14, right: 14 },
  });

  // Page numbers
  const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 6, { align: 'right' });
  }

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
