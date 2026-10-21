export interface ClipboardAdapter {
  write?: (text: string) => Promise<void>;
  fallback?: (text: string) => boolean;
}
export interface CopyResult { ok: boolean; method: 'clipboard' | 'fallback' | 'manual' }

function legacyCopy(text: string): boolean {
  if (typeof document === 'undefined') return false;
  const active = document.activeElement as HTMLElement | null;
  const selection = document.getSelection();
  const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index).cloneRange()) : [];
  const textarea = document.createElement('textarea');
  textarea.value = text; textarea.readOnly = true; textarea.tabIndex = -1;
  textarea.setAttribute('aria-hidden', 'true');
  textarea.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px;';
  const parent = document.querySelector('[role="dialog"][aria-modal="true"]') || document.body;
  parent.appendChild(textarea);
  try {
    textarea.focus(); textarea.select(); textarea.setSelectionRange(0, text.length);
    return document.execCommand('copy') === true;
  } catch { return false; }
  finally {
    textarea.remove();
    if (active?.isConnected) active.focus({ preventScroll: true });
    if (selection) { selection.removeAllRanges(); ranges.forEach(range => { try { selection.addRange(range); } catch {} }); }
  }
}

/** Await real success. Preview iframes may deny the modern API; try the legacy
 * user-gesture path, then tell the UI to select visible text for manual copying.
 * Never report "Copied" for an unavailable, rejected or false-returning API.
 */
export async function copyTextToClipboard(text: string, adapter?: ClipboardAdapter): Promise<CopyResult> {
  if (!text) return { ok: false, method: 'manual' };
  if (!adapter) {
    let write: ClipboardAdapter['write'];
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) write = value => navigator.clipboard.writeText(value);
    } catch {}
    adapter = { write, fallback: legacyCopy };
  }
  if (adapter.write) {
    try { await adapter.write(text); return { ok: true, method: 'clipboard' }; } catch {}
  }
  try { if (adapter.fallback?.(text) === true) return { ok: true, method: 'fallback' }; } catch {}
  return { ok: false, method: 'manual' };
}

/** A link to this app, not a private merchant route or a URL containing tokens. */
export function applicationUrl(href: string, basePath = '/'): string {
  const current = new URL(href);
  if (!['http:', 'https:'].includes(current.protocol)) throw new Error('An HTTP(S) application URL is required.');
  const url = new URL(basePath.startsWith('/') && !basePath.startsWith('//') ? basePath : '/', current.origin);
  url.username = ''; url.password = ''; url.search = ''; url.hash = '';
  return url.href;
}
export function isWorkspacePreview(href: string): boolean {
  try { return new URL(href).hostname.endsWith('.e2b.app'); } catch { return false; }
}
