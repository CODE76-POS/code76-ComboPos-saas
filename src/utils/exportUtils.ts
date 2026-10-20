import { PersonRecord, ProductItem, SaleTransaction, ExpenseItem, InvoiceItem, AuditLog, CompanyData } from '../types/index.ts';

/**
 * Escapes and serializes an array of objects to CSV.
 */
export function exportToCSV<T extends Record<string, any>>(data: T[], filename: string): void {
  if (!data || data.length === 0) {
    alert('No data available to export.');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map((header) => {
      let val = row[header];
      if (val === null || val === undefined) {
        return '""';
      }
      if (typeof val === 'object') {
        val = JSON.stringify(val);
      }
      const stringVal = String(val).replace(/"/g, '""');
      return `"${stringVal}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
  const link = document.createElement('a');
  link.setAttribute('href', csvContent);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Parses CSV text into records.
 */
export function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split(/\r\n|\n/);
  if (lines.length < 2) return [];

  // Parse header
  const headers = parseCSVLine(lines[0]);
  const results: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCSVLine(lines[i]);
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header.trim()] = values[index] ? values[index].trim() : '';
    });
    results.push(obj);
  }

  return results;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

/**
 * Generates and prints/downloads a stylized PDF view for any tabular report or single record.
 */
export function printPDFReport(
  title: string,
  company: CompanyData,
  columns: { header: string; dataKey: string }[],
  data: any[],
  metadata?: { label: string; value: string }[]
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate and print PDF reports.');
    return;
  }

  const metaHtml = metadata
    ? `<div style="display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 20px; padding: 12px; background: #f8fafc; border-radius: 6px;">
        ${metadata.map((m) => `<div><span style="font-size: 11px; color: #64748b; text-transform: uppercase;">${m.label}:</span> <strong style="font-size: 13px; color: #0f172a;">${m.value}</strong></div>`).join('')}
       </div>`
    : '';

  const tableHeaderHtml = columns
    .map(
      (col) =>
        `<th style="border-bottom: 2px solid #cbd5e1; padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #334155; text-transform: uppercase;">${col.header}</th>`
    )
    .join('');

  const tableBodyHtml = data
    .map(
      (row, idx) =>
        `<tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          ${columns
            .map((col) => {
              let val = row[col.dataKey];
              if (val === null || val === undefined) val = '-';
              if (typeof val === 'boolean') val = val ? 'Yes' : 'No';
              if (Array.isArray(val)) val = val.join(', ');
              return `<td style="border-bottom: 1px solid #e2e8f0; padding: 10px 12px; font-size: 12px; color: #1e293b;">${val}</td>`;
            })
            .join('')}
        </tr>`
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - ${company.name}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
          .company-info h1 { margin: 0 0 4px 0; font-size: 24px; color: #0f172a; font-weight: 800; letter-spacing: -0.5px; }
          .company-info p { margin: 2px 0; font-size: 12px; color: #475569; }
          .report-meta { text-align: right; }
          .report-meta h2 { margin: 0 0 6px 0; font-size: 18px; color: #0f766e; }
          .report-meta p { margin: 2px 0; font-size: 11px; color: #64748b; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 16px; display: flex; gap: 8px;">
          <button onclick="window.print()" style="background: #0f766e; color: white; border: none; padding: 8px 16px; font-weight: 600; border-radius: 6px; cursor: pointer;">
            Print / Save as PDF
          </button>
          <button onclick="window.close()" style="background: #e2e8f0; color: #334155; border: none; padding: 8px 16px; font-weight: 600; border-radius: 6px; cursor: pointer;">
            Close
          </button>
        </div>
        <div class="header">
          <div class="company-info">
            <h1>${company.name}</h1>
            <p>${company.slogan || 'Business Solutions & Point of Sale'}</p>
            <p>${company.address}, ${company.location}, ${company.country}</p>
            <p>Tel: ${company.tel1} | Email: ${company.email}</p>
            ${company.taxPin ? `<p>Tax/VAT PIN: <strong>${company.taxPin}</strong></p>` : ''}
          </div>
          <div class="report-meta">
            <h2>${title}</h2>
            <p>Generated: ${new Date().toLocaleString()}</p>
            <p>System: CODE76 POS Enterprise</p>
            <p>Total Records: ${data.length}</p>
          </div>
        </div>

        ${metaHtml}

        <table>
          <thead><tr>${tableHeaderHtml}</tr></thead>
          <tbody>${tableBodyHtml}</tbody>
        </table>

        <div class="footer">
          <span>CODE76 POS - Official System Generated Document</span>
          <span>Authorized Signature / Stamp: ______________________</span>
          <span>Page 1 of 1</span>
        </div>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
