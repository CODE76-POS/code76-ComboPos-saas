import { CODE76_BRAND } from '../config/code76Brand.ts';
import { RECEIPT_FORMATS } from '../config/assistant.ts';
import type { ReceiptChannel, ReceiptFormat } from '../types/index.ts';
import type { ReceiptDocument } from './receiptDocument.ts';

const formatMeta = (format: ReceiptFormat) => RECEIPT_FORMATS.find((entry) => entry.id === format)!;

/** Triggers a browser download without opening a popup window. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function receiptBlob(document: ReceiptDocument, format: ReceiptFormat): Promise<Blob> {
  const meta = formatMeta(format);
  const content = format === 'txt' ? document.text
    : format === 'csv' ? document.csv
      : format === 'json' ? document.json
        : document.html;
  if (format === 'pdf') return createReceiptPdf(document);
  return new Blob([content], { type: meta.mime });
}

/**
 * Builds a thermal-receipt-sized PDF locally with jsPDF.
 * No server round-trip and no print dialog are required.
 */
export async function createReceiptPdf(document: ReceiptDocument): Promise<Blob> {
  // jsPDF is imported lazily so the main bundle stays lean.
  const { jsPDF } = await import('jspdf');
  const lines = document.lines;
  const lineHeight = 3.9;
  const margin = 6;
  const pageHeight = Math.max(120, margin * 2 + lines.length * lineHeight + 24);
  const pdf = new jsPDF({ unit: 'mm', format: [80, pageHeight], compress: true });
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(8);
  let y = margin + 4;
  lines.forEach((line) => {
    if (y > pageHeight - margin - 12) {
      pdf.addPage([80, pageHeight]);
      y = margin + 4;
    }
    pdf.text(line, margin, y, { maxWidth: 68 });
    y += lineHeight;
  });
  pdf.setFontSize(6.5);
  pdf.setTextColor(90, 90, 90);
  pdf.text(CODE76_BRAND.credit, margin, pageHeight - margin);
  pdf.text(`${CODE76_BRAND.email} · ${CODE76_BRAND.youtube}`, margin, pageHeight - margin + 3);
  return pdf.output('blob');
}

export async function downloadReceipt(document: ReceiptDocument, format: ReceiptFormat, fileNameBase: string): Promise<string> {
  const blob = await receiptBlob(document, format);
  const fileName = `${fileNameBase}.${formatMeta(format).extension}`;
  downloadBlob(blob, fileName);
  return fileName;
}

export interface ShareLink {
  href: string;
  /** Open in a new tab where relevant; copy-only channels return an empty href. */
  target: '_blank' | '_self';
}

const digitsOnly = (value: string) => value.replace(/[^\d+]/g, '').replace(/^\+/, '');

/** Builds an OS/share URL. No message is sent by CODE76 itself. */
export function receiptShareLink(channel: ReceiptChannel, recipient: string, subject: string, message: string): ShareLink | null {
  const to = recipient.trim();
  switch (channel) {
    case 'email':
      return { href: `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`, target: '_self' };
    case 'whatsapp':
      return { href: `https://wa.me/${digitsOnly(to)}?text=${encodeURIComponent(message)}`, target: '_blank' };
    case 'sms':
      return { href: `sms:${to}?&body=${encodeURIComponent(message)}`, target: '_self' };
    default:
      return null;
  }
}

export function openShareLink(link: ShareLink | null): boolean {
  if (!link) return false;
  if (typeof window === 'undefined') return false;
  if (link.target === '_blank') {
    const opened = window.open(link.href, '_blank', 'noopener,noreferrer');
    // A blocked popup is not fatal: the caller offers copy/download fallbacks.
    if (!opened) window.location.href = link.href;
    return true;
  }
  window.location.href = link.href;
  return true;
}

export async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const area = document.createElement('textarea');
    area.value = value;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(area);
    return copied;
  } catch {
    return false;
  }
}
