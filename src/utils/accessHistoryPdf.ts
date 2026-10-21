import { CODE76_BRAND, websiteRequestUrl } from '../config/code76Brand.ts';
import type { AuditLog } from '../types/index.ts';
import { AUDIT_EXPORT_HEADERS, auditExportRows } from './accessHistory.ts';

let fontPromise: Promise<string> | undefined;
async function loadFont(): Promise<string> {
  if (!fontPromise) fontPromise = (async () => {
    const base = import.meta.env?.BASE_URL || '/';
    const response = await fetch(`${base}fonts/audit-sans.ttf`);
    if (!response.ok) throw new Error('The local PDF font could not be loaded. Please retry or export TXT/CSV.');
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = '';
    for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
    return btoa(binary);
  })().catch(error => { fontPromise = undefined; throw error; });
  return fontPromise;
}

/** Lazy-load PDF code/font only when an authorized export is requested. Plain
 * text, never HTML, is used for records. Embedded Unicode font + real pagination.
 */
export async function accessHistoryPdf(logs: readonly AuditLog[], officer: string, fontBase64?: string): Promise<Uint8Array> {
  const [{ jsPDF }, font] = await Promise.all([import('jspdf'), fontBase64 ? Promise.resolve(fontBase64) : loadFont()]);
  const doc = new jsPDF({ compress: true, putOnlyUsedFonts: true });
  doc.addFileToVFS('AuditSans.ttf', font); doc.addFont('AuditSans.ttf', 'AuditSans', 'normal'); doc.setFont('AuditSans');
  doc.setProperties({ title: 'CODE76 POS - User access history', author: 'CODE76 POS', subject: 'Filtered browser-local activity export' });
  const margin = 15, width = 180, bottom = 255;
  let y = 20;
  const line = (text: string, size = 9, color = '#0f172a') => {
    doc.setFontSize(size); doc.setTextColor(color);
    const clean = text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
    const wrapped = doc.splitTextToSize(clean || ' ', width) as string[];
    for (const part of wrapped) {
      if (y + size * 0.45 > bottom) { doc.addPage(); y = 20; }
      doc.text(part, margin, y); y += size * 0.45 + 1.1;
    }
  };
  line('CODE76 POS - User access history', 16, '#0f766e'); y += 2;
  line(`Generated: ${new Date().toISOString()}`);
  line(`Exported by: ${officer}`);
  line(`Filtered records: ${logs.length}`);
  line('Browser-local activity records; not a tamper-proof server audit.', 8, '#64748b'); y += 4;
  auditExportRows(logs).forEach((row, index) => {
    if (y > 222) { doc.addPage(); y = 20; }
    line(`Record ${index + 1}`, 11, '#0f766e');
    AUDIT_EXPORT_HEADERS.forEach((header, i) => line(`${header}: ${row[i]}`));
    y += 5;
  });
  if (!logs.length) line('No records match the selected filters.');
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page); doc.setFontSize(8); doc.setTextColor('#64748b');
    doc.text(CODE76_BRAND.credit,margin,267);
    doc.textWithLink(`email: ${CODE76_BRAND.email}`,margin,272,{url:CODE76_BRAND.emailUrl});
    doc.textWithLink(`youtube: ${CODE76_BRAND.youtube}`,margin,277,{url:CODE76_BRAND.youtube});
    doc.textWithLink(CODE76_BRAND.cta,margin,282,{url:websiteRequestUrl()});
    doc.text(`Page ${page} of ${pages}`,margin,291);
  }
  return new Uint8Array(doc.output('arraybuffer'));
}
