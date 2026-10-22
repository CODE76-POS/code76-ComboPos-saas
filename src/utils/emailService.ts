/**
 * CODE76 Universal Email Service & Deliverability Engine
 * Client-side queue, retry loop, anti-spam hygiene & failover dispatcher.
 */

export interface EmailPayload {
  to?: string;
  fromName: string;
  fromEmail: string;
  phone?: string;
  company?: string;
  subject: string;
  message: string;
  category?: 'landing_inquiry' | 'support_ticket' | 'export_report' | 'debt_history' | 'customer_followup';
  metadata?: Record<string, unknown>;
}

export interface EmailDispatchResult {
  success: boolean;
  jobId: string;
  status: 'delivered' | 'queued_inbox' | 'retrying' | 'stored_offline';
  smtpDispatched: boolean;
  mailtoUrl: string;
  message: string;
  attempts: number;
}

export interface QueuedEmailItem {
  id: string;
  payload: EmailPayload;
  queuedAt: string;
  attempts: number;
  lastAttemptAt?: string;
  lastError?: string;
  status: 'pending' | 'retrying' | 'failed';
}

const STORAGE_KEY = 'code76_outbound_email_queue_v1';
const DEFAULT_DESTINATION = 'code76pos@gmail.com';
const MAX_AUTO_RETRIES = 3;

/**
 * Validates RFC 5322 compliance and checks against common spam triggers.
 */
export function validateEmailAntiSpam(
  email: string,
  subject: string,
  message: string
): { valid: boolean; spamRisk: 'low' | 'medium' | 'high'; warnings: string[] } {
  const warnings: string[] = [];
  let spamScore = 0;

  // Basic RFC 5322 compliant regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  const isEmailValid = emailRegex.test(email.trim());

  if (!isEmailValid) {
    warnings.push('Email address format appears invalid.');
    spamScore += 5;
  }

  // Check for ALL CAPS in subject (major spam trigger)
  if (subject.length > 5 && subject === subject.toUpperCase() && /[A-Z]/.test(subject)) {
    warnings.push('All-caps subject line may trigger spam filters.');
    spamScore += 3;
  }

  // Check for excessive exclamation marks or dollar signs
  if (/(!{2,}|\${2,})/.test(subject) || /(!{3,}|\${3,})/.test(message)) {
    warnings.push('Excessive punctuation (!!! or $$$) can trigger spam detection.');
    spamScore += 2;
  }

  // Spam trigger words check
  const spamWords = ['100% free', 'make money fast', 'urgent prize', 'risk free guarantee', 'act now!!!'];
  const lowerMsg = message.toLowerCase();
  for (const word of spamWords) {
    if (lowerMsg.includes(word)) {
      warnings.push(`Contains spam phrase: "${word}".`);
      spamScore += 2;
    }
  }

  const spamRisk: 'low' | 'medium' | 'high' =
    spamScore >= 4 ? 'high' : spamScore >= 2 ? 'medium' : 'low';

  return {
    valid: isEmailValid && subject.trim().length > 0 && message.trim().length > 0,
    spamRisk,
    warnings,
  };
}

/**
 * Sanitizes subject line to improve inbox placement and avoid spam classifiers.
 */
export function sanitizeSubjectForInbox(subject: string): string {
  let cleaned = subject.trim().replace(/[\r\n]+/g, ' ');
  // Reduce multiple consecutive exclamation or question marks
  cleaned = cleaned.replace(/!{2,}/g, '!').replace(/\?{2,}/g, '?');
  // Avoid full caps
  if (cleaned.length > 6 && cleaned === cleaned.toUpperCase() && /[A-Z]/.test(cleaned)) {
    cleaned = cleaned.charAt(0) + cleaned.slice(1).toLowerCase();
  }
  return cleaned || 'CODE76 Service Communication';
}

/**
 * Creates RFC 5322 compliant fallback mailto link.
 */
export function createAntiSpamMailto(payload: EmailPayload, ticketId?: string): string {
  const destination = (payload.to?.trim() || DEFAULT_DESTINATION);
  const ref = ticketId || `INQ-${Date.now().toString(36).toUpperCase()}`;
  const subjectClean = sanitizeSubjectForInbox(`[${ref}] ${payload.subject}`);
  
  const bodyText = [
    `Ticket ID: ${ref}`,
    `From: ${payload.fromName.trim()} <${payload.fromEmail.trim()}>`,
    payload.phone ? `Phone: ${payload.phone.trim()}` : null,
    payload.company ? `Company: ${payload.company.trim()}` : null,
    payload.category ? `Category: ${payload.category}` : null,
    `Date: ${new Date().toUTCString()}`,
    '',
    '--------------------------------------------------',
    payload.message.trim(),
    '--------------------------------------------------',
    '',
    'Sent via CODE76 POS Verified Dispatch Portal',
  ]
    .filter(Boolean)
    .join('\n');

  return `mailto:${destination}?subject=${encodeURIComponent(subjectClean)}&body=${encodeURIComponent(bodyText)}`;
}

/**
 * Retrieves persisted queue from local storage.
 */
export function getOutboundEmailQueue(): QueuedEmailItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Stores queue back to local storage.
 */
function saveOutboundEmailQueue(queue: QueuedEmailItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue.slice(-50)));
  } catch (err) {
    console.warn('[CODE76 Email Service] Failed to persist queue to localStorage', err);
  }
}

/**
 * Enqueues a message for offline / retry delivery.
 */
function enqueueEmail(payload: EmailPayload, errorMsg?: string): QueuedEmailItem {
  const queue = getOutboundEmailQueue();
  const id = `MSG-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const item: QueuedEmailItem = {
    id,
    payload,
    queuedAt: new Date().toISOString(),
    attempts: 1,
    lastAttemptAt: new Date().toISOString(),
    lastError: errorMsg,
    status: 'retrying',
  };
  queue.push(item);
  saveOutboundEmailQueue(queue);
  return item;
}

/**
 * Sends an email using the unified application service.
 * Handles network drops, automatic retries, backend dispatching, and fallback mailto generation.
 */
export async function sendUnifiedEmail(payload: EmailPayload): Promise<EmailDispatchResult> {
  const sanitizedSubject = sanitizeSubjectForInbox(payload.subject);
  const destination = payload.to?.trim() || DEFAULT_DESTINATION;
  const initialJobId = `MSG-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const fallbackMailto = createAntiSpamMailto(payload, initialJobId);

  // If client is known to be offline, queue immediately
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueEmail(payload, 'Client is currently offline.');
    return {
      success: true,
      jobId: initialJobId,
      status: 'stored_offline',
      smtpDispatched: false,
      mailtoUrl: fallbackMailto,
      message: 'Network offline. Your message is saved and will automatically dispatch once connected.',
      attempts: 0,
    };
  }

  // Attempt backend dispatch with exponential retry loop
  let lastError = '';
  for (let attempt = 1; attempt <= MAX_AUTO_RETRIES; attempt++) {
    try {
      // Determine the target endpoint (contact or general modular send)
      const isContactInquiry = payload.category === 'landing_inquiry' || !payload.to;
      const endpoint = isContactInquiry ? '/api/contact' : '/api/email/send';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: payload.fromName.trim(),
          email: payload.fromEmail.trim(),
          phone: payload.phone?.trim() || '',
          company: payload.company?.trim() || '',
          subject: sanitizedSubject,
          message: payload.message.trim(),
          to: destination,
          category: payload.category || 'landing_inquiry',
          metadata: payload.metadata,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      return {
        success: true,
        jobId: data.inquiryId || data.jobId || initialJobId,
        status: data.status || (data.smtpDispatched ? 'delivered' : 'queued_inbox'),
        smtpDispatched: Boolean(data.smtpDispatched),
        mailtoUrl: data.mailtoUrl || fallbackMailto,
        message: data.message || `Message dispatched to ${destination}.`,
        attempts: attempt,
      };
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : String(err);
      console.warn(`[CODE76 Email Service] Attempt ${attempt}/${MAX_AUTO_RETRIES} failed: ${lastError}`);
      if (attempt < MAX_AUTO_RETRIES) {
        // Exponential backoff with small jitter
        const delay = attempt * 800 + Math.random() * 400;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // If retries failed, store in persistent local queue and offer mailto
  const queuedItem = enqueueEmail(payload, lastError);
  return {
    success: true,
    jobId: queuedItem.id,
    status: 'queued_inbox',
    smtpDispatched: false,
    mailtoUrl: createAntiSpamMailto(payload, queuedItem.id),
    message: `Message registered (Ticket #${queuedItem.id}) and queued for delivery.`,
    attempts: MAX_AUTO_RETRIES,
  };
}

/**
 * Background auto-flusher for offline items.
 */
export async function retryQueuedEmails(): Promise<void> {
  if (typeof window === 'undefined' || !navigator.onLine) return;
  const queue = getOutboundEmailQueue();
  const pending = queue.filter((item) => item.status === 'retrying' || item.status === 'pending');
  if (pending.length === 0) return;

  const remainingQueue: QueuedEmailItem[] = [];

  for (const item of queue) {
    if (item.status === 'retrying' || item.status === 'pending') {
      try {
        const res = await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: item.payload.fromName,
            email: item.payload.fromEmail,
            to: item.payload.to || DEFAULT_DESTINATION,
            subject: sanitizeSubjectForInbox(item.payload.subject),
            message: item.payload.message,
            category: item.payload.category || 'support_ticket',
          }),
        });
        if (res.ok) {
          // Successfully flushed
          continue;
        }
      } catch {
        // Still failing, increment attempt
        item.attempts += 1;
        item.lastAttemptAt = new Date().toISOString();
        if (item.attempts >= 5) {
          item.status = 'failed';
        }
      }
    }
    remainingQueue.push(item);
  }

  saveOutboundEmailQueue(remainingQueue);
}

// Auto-attach network listener in browser environments
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    retryQueuedEmails().catch(() => {});
  });
}
