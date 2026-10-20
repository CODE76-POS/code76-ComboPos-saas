import React, { useEffect, useId, useRef, useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { copyTextToClipboard } from '../../utils/clipboard.ts';

export function LinkCopyField({ value, label, openLink = false, compact = false }: {
  value: string; label: string; openLink?: boolean; compact?: boolean;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const live = useRef(true);
  const [status, setStatus] = useState<'idle' | 'copying' | 'copied' | 'manual'>('idle');
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  useEffect(() => { setStatus('idle'); }, [value]);
  useEffect(() => {
    if (status !== 'copied') return;
    const timer = setTimeout(() => setStatus('idle'), 3500);
    return () => clearTimeout(timer);
  }, [status]);
  const select = () => { input.current?.focus(); input.current?.select(); };
  const copy = async () => {
    setStatus('copying');
    const result = await copyTextToClipboard(value);
    if (!live.current) return;
    setStatus(result.ok ? 'copied' : 'manual');
    if (!result.ok) select();
  };
  return <div className="min-w-0 w-full">
    <div className="flex min-w-0 items-center gap-2">
      <label className="sr-only" htmlFor={id}>{label}</label>
      <input ref={input} id={id} aria-label={label} type="text" readOnly value={value} onFocus={event => event.currentTarget.select()}
        className={`min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 text-teal-300 font-mono ${compact ? 'py-1.5 text-[11px]' : 'py-2.5 text-xs'}`} />
      <button type="button" aria-label={`Copy ${label.toLowerCase()}`} onClick={copy} disabled={status === 'copying'}
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-teal-600 bg-teal-700 px-3 py-2 text-xs font-bold text-white hover:bg-teal-600 disabled:opacity-60 cursor-pointer">
        {status === 'copied' ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
        <span>{status === 'copied' ? 'Copied!' : status === 'copying' ? 'Copying…' : 'Copy link'}</span>
      </button>
      {openLink && <a href={value} target="_blank" rel="noopener noreferrer" aria-label={`Open ${label.toLowerCase()} in a new tab`} title="Open in a new tab"
        className="shrink-0 rounded-lg border border-slate-700 p-2 text-teal-400 hover:bg-slate-800"><ExternalLink size={16} /></a>}
    </div>
    <div className={status === 'manual' ? 'mt-2 text-xs text-amber-300' : 'sr-only'} role="status" aria-live="polite">
      {status === 'copied' ? 'Link copied to clipboard.' : status === 'manual' ? 'Clipboard access is blocked here. The link is selected: press Ctrl+C (Windows/Linux), Command+C (Mac), or long-press and choose Copy.' : ''}
    </div>
    {status === 'manual' && <button type="button" onClick={select} className="mt-1 text-xs font-semibold text-teal-300 underline">Select link again</button>}
  </div>;
}
