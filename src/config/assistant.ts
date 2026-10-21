import type { AppSettings, ChatbotSettings } from '../types/index.ts';

/** Merchant-page assistant defaults. Not used by the CODE76 public product site. */
export const DEFAULT_CHATBOT_SETTINGS: ChatbotSettings = {
  enabled: true,
  assistantName: 'Business Assistant',
  greeting: 'Hello! Ask me about the products, services, prices or contact details on this page.',
  tone: 'friendly',
  quickPrompts: [
    'What products do you sell?',
    'Do you offer services?',
    'How can I contact you?',
  ],
  fallbackMessage: 'I can only answer from this business’s saved catalogue and contact details. For anything else, please contact the business directly.',
  handoffContact: '',
  showPrices: true,
  showStock: true,
  collectLeads: true,
  offlineNotice: 'The assistant is currently offline. Please use the contact details on this page.',
  code76SurfaceEnabled: true,
};

export const CHATBOT_TONES: { id: ChatbotSettings['tone']; label: string; description: string }[] = [
  { id: 'friendly', label: 'Friendly', description: 'Warm, plain language with short helpful replies.' },
  { id: 'professional', label: 'Professional', description: 'Formal, factual and concise business tone.' },
  { id: 'concise', label: 'Concise', description: 'Very short answers focused on price and availability.' },
];

export const RECEIPT_FORMATS: { id: NonNullable<AppSettings['receipts']['enabledFormats']>[number]; label: string; description: string; mime: string; extension: string }[] = [
  { id: 'pdf', label: 'PDF', description: 'A4/thermal-style document generated locally with jsPDF.', mime: 'application/pdf', extension: 'pdf' },
  { id: 'txt', label: 'TXT', description: 'Plain 42-column receipt text for any device or message field.', mime: 'text/plain;charset=utf-8', extension: 'txt' },
  { id: 'csv', label: 'CSV', description: 'Line items and totals for spreadsheets and bookkeeping.', mime: 'text/csv;charset=utf-8', extension: 'csv' },
  { id: 'json', label: 'JSON', description: 'Structured record for backups and integrations.', mime: 'application/json;charset=utf-8', extension: 'json' },
  { id: 'html', label: 'HTML', description: 'A printable standalone receipt page.', mime: 'text/html;charset=utf-8', extension: 'html' },
];

export const RECEIPT_CHANNELS: { id: NonNullable<AppSettings['receipts']['enabledChannels']>[number]; label: string; description: string; icon: string }[] = [
  { id: 'email', label: 'Email', description: 'Opens a pre-filled draft in the customer’s mail app. Nothing is sent by CODE76.', icon: 'Mail' },
  { id: 'whatsapp', label: 'WhatsApp', description: 'Opens WhatsApp with the receipt text pre-filled for the customer’s number.', icon: 'MessageCircle' },
  { id: 'sms', label: 'SMS', description: 'Opens the device SMS composer with the receipt text.', icon: 'Smartphone' },
  { id: 'copy', label: 'Copy text', description: 'Copies the receipt text to the clipboard for any other channel.', icon: 'Copy' },
];

export const DEFAULT_RECEIPT_SEND_TEMPLATE =
  'Hello {customer}, thank you for your purchase at {company}. Receipt {receipt} for {currency} {total} was issued on {date}. Keep this message for your records.';
