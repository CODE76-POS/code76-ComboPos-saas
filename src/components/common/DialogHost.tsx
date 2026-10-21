import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { AlertTriangle, CheckCircle2, Info, ShieldAlert, X, XCircle } from 'lucide-react';
import {
  appDialogs,
  getDialogSnapshot,
  subscribeToDialogs,
  type DialogRequest,
  type DialogTone,
} from '../../utils/appDialogs.ts';

const toneStyles: Record<DialogTone, { ring: string; icon: string; badge: string; button: string }> = {
  info: { ring: 'border-teal-500/50', icon: 'text-teal-300', badge: 'bg-teal-500/15 text-teal-200', button: 'bg-teal-600 hover:bg-teal-500' },
  success: { ring: 'border-emerald-500/50', icon: 'text-emerald-300', badge: 'bg-emerald-500/15 text-emerald-200', button: 'bg-emerald-600 hover:bg-emerald-500' },
  warning: { ring: 'border-amber-500/50', icon: 'text-amber-300', badge: 'bg-amber-500/15 text-amber-200', button: 'bg-amber-600 hover:bg-amber-500' },
  danger: { ring: 'border-rose-500/50', icon: 'text-rose-300', badge: 'bg-rose-500/15 text-rose-200', button: 'bg-rose-600 hover:bg-rose-500' },
};

const toneIcon = (tone: DialogTone) => {
  switch (tone) {
    case 'success': return CheckCircle2;
    case 'warning': return AlertTriangle;
    case 'danger': return ShieldAlert;
    default: return Info;
  }
};

const requestCopy = (request: DialogRequest) => {
  const options = request.options;
  const title = 'title' in options && options.title
    ? options.title
    : request.kind === 'confirm'
      ? 'Please confirm'
      : request.kind === 'prompt'
        ? 'Enter a value'
        : request.kind === 'choice'
          ? 'Choose an action'
          : 'Notice';
  const tone: DialogTone = options.tone || (request.kind === 'confirm' && 'destructive' in options && options.destructive ? 'danger' : 'info');
  return { title, tone };
};

const DialogCard: React.FC<{ request: DialogRequest }> = ({ request }) => {
  const { title, tone } = requestCopy(request);
  const styles = toneStyles[tone];
  const Icon = toneIcon(tone);
  const options = request.options;
  const promptOptions = request.kind === 'prompt' ? request.options : null;
  const initialValue = promptOptions?.defaultValue || '';
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const primaryRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setValue(initialValue);
    setError(null);
    const timer = setTimeout(() => {
      if (request.kind === 'prompt') inputRef.current?.focus();
      else primaryRef.current?.focus();
    }, 40);
    return () => clearTimeout(timer);
  }, [request.id, initialValue, request.kind]);

  const cancelLabel = request.kind === 'prompt'
    ? promptOptions!.cancelLabel || 'Cancel'
    : request.kind === 'confirm'
      ? request.options.cancelLabel || 'Cancel'
      : request.kind === 'choice'
        ? (request.options.cancelLabel === null ? null : request.options.cancelLabel || 'Not now')
        : null;
  const confirmLabel = request.kind === 'alert' ? request.options.confirmLabel || 'Got it' : request.kind === 'prompt' ? (request.options.confirmLabel || 'Save') : request.kind === 'confirm' ? (request.options.confirmLabel || 'Confirm') : 'Confirm';

  const submit = () => {
    if (request.kind === 'prompt') {
      if (promptOptions?.required && !value.trim()) { setError('A value is required before continuing.'); return; }
      const validation = promptOptions?.validate?.(value) ?? null;
      if (validation) { setError(validation); return; }
      appDialogs.settle(request.id, value.trim());
      return;
    }
    appDialogs.settle(request.id, true);
  };

  const cancel = () => appDialogs.settle(request.id, request.kind === 'prompt' || request.kind === 'choice' ? null : false);

  return (
    <div
      className="fixed inset-0 z-[140] flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-6"
      onKeyDown={(event) => {
        if (event.key === 'Escape') { event.preventDefault(); cancel(); }
        if (event.key === 'Enter' && !event.shiftKey && request.kind !== 'prompt' && (event.target as HTMLElement)?.tagName !== 'TEXTAREA') {
          event.preventDefault(); submit();
        }
      }}
    >
      <div
        role={request.kind === 'alert' ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby={`dialog-title-${request.id}`}
        aria-describedby={`dialog-message-${request.id}`}
        data-code76-dialog={request.kind}
        className={`w-full max-w-lg rounded-3xl border-2 ${styles.ring} bg-slate-900 text-slate-100 shadow-2xl shadow-black/60 animate-in fade-in zoom-in-95 duration-150`}
      >
        <div className="flex items-start gap-3 border-b border-slate-800 p-4 sm:p-5">
          <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${styles.badge}`}>
            <Icon className={`h-5 w-5 ${styles.icon}`} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id={`dialog-title-${request.id}`} className="text-base font-black leading-tight">{title}</h2>
            <p id={`dialog-message-${request.id}`} className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-300">{options.message}</p>
            {'detail' in options && options.detail && (
              <p className="mt-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs leading-relaxed text-slate-400">{options.detail}</p>
            )}
          </div>
          <button type="button" onClick={cancel} aria-label="Close dialog" className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        {request.kind === 'choice' && (
          <div className="space-y-2 px-4 py-4 sm:px-5">
            {request.options.actions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => appDialogs.settle(request.id, action.id)}
                className={`flex w-full flex-col rounded-xl border px-3.5 py-2.5 text-left transition ${
                  action.tone === 'primary' ? 'border-teal-600 bg-teal-950/30 hover:bg-teal-900/40'
                    : action.tone === 'danger' ? 'border-rose-800 bg-rose-950/20 hover:bg-rose-900/30'
                      : action.tone === 'success' ? 'border-emerald-700 bg-emerald-950/20 hover:bg-emerald-900/30'
                        : 'border-slate-700 bg-slate-950 hover:bg-slate-800'
                }`}
              >
                <span className="text-sm font-bold text-slate-100">{action.label}</span>
                {action.description && <span className="mt-0.5 text-[11px] leading-relaxed text-slate-400">{action.description}</span>}
              </button>
            ))}
          </div>
        )}

        {request.kind === 'prompt' && (
          <div className="space-y-2 px-4 py-4 sm:px-5">
            {promptOptions!.label && <label htmlFor={`dialog-input-${request.id}`} className="block text-xs font-bold uppercase tracking-wide text-slate-400">{promptOptions!.label}</label>}
            {promptOptions!.multiline ? (
              <textarea
                id={`dialog-input-${request.id}`}
                ref={(element) => { inputRef.current = element; }}
                value={value}
                rows={4}
                placeholder={promptOptions!.placeholder}
                onChange={(event) => { setValue(event.target.value); setError(null); }}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
              />
            ) : (
              <input
                id={`dialog-input-${request.id}`}
                ref={(element) => { inputRef.current = element; }}
                value={value}
                placeholder={promptOptions!.placeholder}
                onChange={(event) => { setValue(event.target.value); setError(null); }}
                onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); submit(); } }}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
              />
            )}
            {error && <p role="alert" className="flex items-center gap-1.5 text-xs font-semibold text-rose-300"><XCircle className="h-3.5 w-3.5" />{error}</p>}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-slate-800 p-4 sm:flex-row sm:justify-end sm:p-5">
          {cancelLabel && (
            <button type="button" onClick={cancel} className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800">
              {cancelLabel}
            </button>
          )}
          {request.kind !== 'choice' && (
            <button
              ref={primaryRef}
              type="button"
              onClick={submit}
              className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg transition ${styles.button}`}
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const DialogHost: React.FC = () => {
  const state = useSyncExternalStore(subscribeToDialogs, getDialogSnapshot, getDialogSnapshot);
  const active = state.queue[0];

  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [active]);

  const toasts = useMemo(() => state.toasts.slice(-4), [state.toasts]);

  return (
    <>
      {active && <DialogCard key={active.id} request={active} />}
      <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed inset-x-0 top-3 z-[150] flex flex-col items-center gap-2 px-3 sm:items-end sm:px-6">
        {toasts.map((toast) => {
          const styles = toneStyles[toast.tone];
          const Icon = toneIcon(toast.tone);
          return (
            <div
              key={toast.id}
              data-code76-toast={toast.tone}
              className={`pointer-events-auto flex w-full max-w-md items-start gap-2.5 rounded-2xl border ${styles.ring} bg-slate-900/95 px-3.5 py-3 text-sm text-slate-100 shadow-2xl shadow-black/40 backdrop-blur`}
            >
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${styles.icon}`} />
              <p className="min-w-0 flex-1 leading-snug">{toast.message}</p>
              <button type="button" aria-label="Dismiss notification" onClick={() => appDialogs.dismissToast(toast.id)} className="rounded p-0.5 text-slate-500 transition hover:text-slate-200">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
};
