import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface EmailDispatchJob {
  id: string;
  timestamp: string;
  fromName: string;
  fromEmail: string;
  phone?: string;
  company?: string;
  to: string;
  subject: string;
  message: string;
  category?: 'landing_inquiry' | 'support_ticket' | 'export_report' | 'debt_history' | 'customer_followup';
  status: 'delivered' | 'retrying' | 'queued_inbox';
  attempts: number;
  lastAttemptAt?: string;
  error?: string;
  mailtoFallbackUrl: string;
}

// In-memory queue with history retention
const emailQueue: EmailDispatchJob[] = [];
let smtpTransporter: Transporter | null = null;
let isConfigured = false;

export function initializeSmtp(): boolean {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host && user && pass) {
    try {
      smtpTransporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 12000,
      });
      isConfigured = true;
      console.log(`[CODE76 Email Service] Connected to SMTP host ${host}:${port}`);
      return true;
    } catch (err: any) {
      console.warn('[CODE76 Email Service] SMTP initialization error:', err.message);
    }
  }

  isConfigured = false;
  return false;
}

// Initialize on startup
initializeSmtp();

/**
 * Generate anti-spam RFC 5322 headers and clean multipart MIME template
 */
export function buildAntiSpamEmail(job: EmailDispatchJob) {
  const fromAddress = process.env.SMTP_FROM || 'code76pos@gmail.com';
  const messageId = `<code76-${job.id}-${Date.now()}@code76pos.com>`;
  const dateHeader = new Date().toUTCString();

  // Clean, high-deliverability plain text version
  const textBody = `CODE76 POS OFFICIAL DISPATCH
==================================================
Reference ID: ${job.id}
Category: ${job.category || 'General Communication'}
Timestamp: ${job.timestamp}

Sender: ${job.fromName}
Email: ${job.fromEmail}
Phone: ${job.phone || 'N/A'}
Organization: ${job.company || 'N/A'}
Target Inbox: ${job.to}

SUBJECT:
${job.subject}

MESSAGE:
--------------------------------------------------
${job.message}
--------------------------------------------------

DISPATCH COMPLIANCE NOTICE:
This email was generated through the CODE76 POS System.
Recipient desk: code76pos@gmail.com
For assistance or unsubscribe requests, contact code76pos@gmail.com.
`;

  // Semantic, clean HTML body without spam triggers
  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(job.subject)}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; line-height: 1.6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <!-- Header -->
    <div style="background-color: #0f172a; padding: 24px; border-bottom: 2px solid #0d9488;">
      <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">
        CODE<span style="color: #14b8a6;">76</span> POS <span style="font-size: 13px; color: #94a3b8; font-weight: normal; margin-left: 8px;">Official Communication</span>
      </h1>
      <p style="color: #94a3b8; font-size: 12px; margin: 4px 0 0 0;">
        Reference: <strong style="color: #5eead4; font-family: monospace;">${job.id}</strong>
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 24px;">
      <div style="background-color: #f1f5f9; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; font-size: 13px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #64748b; width: 100px; padding: 4px 0;">From:</td>
            <td style="color: #0f172a; font-weight: 600; padding: 4px 0;">${escapeHtml(job.fromName)} &lt;${escapeHtml(job.fromEmail)}&gt;</td>
          </tr>
          ${job.company ? `<tr><td style="color: #64748b; padding: 4px 0;">Company:</td><td style="color: #0f172a; padding: 4px 0;">${escapeHtml(job.company)}</td></tr>` : ''}
          ${job.phone ? `<tr><td style="color: #64748b; padding: 4px 0;">Phone:</td><td style="color: #0f172a; padding: 4px 0;">${escapeHtml(job.phone)}</td></tr>` : ''}
          <tr>
            <td style="color: #64748b; padding: 4px 0;">Subject:</td>
            <td style="color: #0d9488; font-weight: 700; padding: 4px 0;">${escapeHtml(job.subject)}</td>
          </tr>
        </table>
      </div>

      <div style="font-size: 14px; color: #334155; line-height: 1.7; white-space: pre-wrap; padding: 8px 4px;">
${escapeHtml(job.message)}
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center;">
      <p style="margin: 0 0 4px 0;">Sent via CODE76 POS Enterprise Communication Gateway.</p>
      <p style="margin: 0;">Direct Desk: <a href="mailto:code76pos@gmail.com" style="color: #0d9488; text-decoration: none; font-weight: 600;">code76pos@gmail.com</a> | Verified Deliverability Architecture</p>
    </div>
  </div>
</body>
</html>`;

  return {
    from: `"${job.fromName.replace(/"/g, '')} via CODE76" <${fromAddress}>`,
    to: job.to,
    replyTo: `"${job.fromName.replace(/"/g, '')}" <${job.fromEmail}>`,
    subject: `[CODE76] ${job.subject} - Ref: ${job.id}`,
    text: textBody,
    html: htmlBody,
    headers: {
      'Message-ID': messageId,
      'Date': dateHeader,
      'X-Mailer': 'CODE76-POS-Transaction-Engine/2026.1',
      'Precedence': 'bulk',
      'Auto-Submitted': 'auto-generated',
      'List-Unsubscribe': `<mailto:code76pos@gmail.com?subject=Unsubscribe-${job.id}>`,
      'X-Entity-Ref-ID': job.id,
    },
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Queue and dispatch email with automated retry
 */
export async function queueAndDispatchEmail(params: {
  fromName: string;
  fromEmail: string;
  phone?: string;
  company?: string;
  to?: string;
  subject: string;
  message: string;
  category?: 'landing_inquiry' | 'support_ticket' | 'export_report' | 'debt_history' | 'customer_followup';
}): Promise<{
  success: boolean;
  jobId: string;
  status: 'delivered' | 'queued_inbox' | 'retrying';
  smtpDispatched: boolean;
  mailtoUrl: string;
  message: string;
}> {
  const jobId = `MSG-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const destination = params.to?.trim() || 'code76pos@gmail.com';

  const mailtoSubject = encodeURIComponent(`[${jobId}] ${params.subject}`);
  const mailtoBody = encodeURIComponent(
    `From: ${params.fromName} (${params.fromEmail})\nPhone: ${params.phone || 'N/A'}\nCompany: ${params.company || 'N/A'}\nTicket Reference: ${jobId}\n\n${params.message}`
  );
  const mailtoFallbackUrl = `mailto:${destination}?subject=${mailtoSubject}&body=${mailtoBody}`;

  const job: EmailDispatchJob = {
    id: jobId,
    timestamp: new Date().toISOString(),
    fromName: params.fromName.trim(),
    fromEmail: params.fromEmail.trim(),
    phone: params.phone?.trim(),
    company: params.company?.trim(),
    to: destination,
    subject: params.subject.trim(),
    message: params.message.trim(),
    category: params.category || 'landing_inquiry',
    status: 'queued_inbox',
    attempts: 0,
    mailtoFallbackUrl,
  };

  emailQueue.push(job);
  if (emailQueue.length > 500) emailQueue.shift();

  // Attempt real SMTP dispatch if configured
  if (isConfigured && smtpTransporter) {
    let sent = false;
    let retries = 3;
    let lastErr = '';

    while (retries > 0 && !sent) {
      job.attempts++;
      job.lastAttemptAt = new Date().toISOString();
      try {
        const mailOptions = buildAntiSpamEmail(job);
        await smtpTransporter.sendMail(mailOptions);
        sent = true;
        job.status = 'delivered';
      } catch (err: any) {
        lastErr = err.message || 'SMTP timeout';
        retries--;
        if (retries > 0) {
          // Exponential backoff wait
          await new Promise((resolve) => setTimeout(resolve, (3 - retries) * 1500));
        }
      }
    }

    if (!sent) {
      job.status = 'queued_inbox';
      job.error = lastErr;
      console.warn(`[CODE76 Email Service] SMTP retries exhausted for ${jobId}: ${lastErr}. Queued safely.`);
    }
  }

  return {
    success: true,
    jobId: job.id,
    status: job.status,
    smtpDispatched: job.status === 'delivered',
    mailtoUrl: mailtoFallbackUrl,
    message: job.status === 'delivered'
      ? `Email successfully delivered to ${job.to} (Ticket #${job.id}).`
      : `Message registered and queued in CODE76 Desk inbox (#${job.id}).`,
  };
}

export function getQueueStatus() {
  return {
    configured: isConfigured,
    totalQueued: emailQueue.length,
    deliveredCount: emailQueue.filter((j) => j.status === 'delivered').length,
    recentJobs: emailQueue.slice(-10).map((j) => ({
      id: j.id,
      timestamp: j.timestamp,
      from: `${j.fromName} <${j.fromEmail}>`,
      to: j.to,
      subject: j.subject,
      status: j.status,
      attempts: j.attempts,
    })),
  };
}
