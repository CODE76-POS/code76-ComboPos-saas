import React from 'react';
import { CODE76_BRAND, brandAssetUrl, websiteRequestUrl } from '../../config/code76Brand.ts';
import { Mail, MessageCircle, ExternalLink } from 'lucide-react';

export function Code76Credit({ compact = false, logo = true }: { compact?: boolean; logo?: boolean }) {
  return (
    <div
      data-code76-credit="true"
      className={
        compact
          ? 'mt-4 border-t border-slate-300 pt-3 text-[9px] leading-relaxed break-words'
          : 'mt-6 rounded-2xl border border-slate-800 p-5 text-sm break-words'
      }
      style={{ overflowWrap: 'anywhere' }}
    >
      <div className="flex items-start gap-3">
        {logo && (
          <img
            src={brandAssetUrl()}
            alt="CODE76 POS logo"
            className={compact ? 'w-7 h-7 shrink-0 rounded-md object-contain' : 'w-11 h-11 shrink-0 rounded-lg object-contain'}
          />
        )}
        <div className="min-w-0">
          <p className="font-bold">{CODE76_BRAND.credit}</p>
          <p>
            email: <a href={CODE76_BRAND.emailUrl} className="underline">{CODE76_BRAND.email}</a>
          </p>
          <p>
            youtube: <a href={CODE76_BRAND.youtube} target="_blank" rel="noopener noreferrer" className="underline">{CODE76_BRAND.youtube}</a>
          </p>
          <p>
            github: <a href={CODE76_BRAND.github} target="_blank" rel="noopener noreferrer" className="underline">{CODE76_BRAND.github}</a>
          </p>
          <a href={websiteRequestUrl()} className="mt-2 inline-block font-bold underline">
            {CODE76_BRAND.cta}
          </a>
        </div>
      </div>
    </div>
  );
}

export function Code76SocialLinks({ variant = 'default' }: { variant?: 'default' | 'hero' | 'compact' }) {
  const isCompact = variant === 'compact';

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="CODE76 official social and contact links">
      {/* YouTube */}
      <a
        href={CODE76_BRAND.youtube}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Subscribe on YouTube"
        className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-950/30 hover:bg-red-900/50 px-3 py-2 text-xs font-bold text-red-300 transition shadow-sm hover:scale-105 active:scale-95"
      >
        <svg className="w-4 h-4 text-red-400 fill-current" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
        {!isCompact && <span>YouTube</span>}
      </a>

      {/* GitHub */}
      <a
        href={CODE76_BRAND.github}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View on GitHub"
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 transition shadow-sm hover:scale-105 active:scale-95"
      >
        <svg className="w-4 h-4 text-slate-300 fill-current" viewBox="0 0 24 24">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
        </svg>
        {!isCompact && <span>GitHub</span>}
      </a>

      {/* Twitter / X */}
      <a
        href={CODE76_BRAND.twitter}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Follow on X / Twitter"
        className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-950/30 hover:bg-sky-900/50 px-3 py-2 text-xs font-bold text-sky-300 transition shadow-sm hover:scale-105 active:scale-95"
      >
        <svg className="w-4 h-4 text-sky-400 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        {!isCompact && <span>X (Twitter)</span>}
      </a>

      {/* Facebook */}
      <a
        href={CODE76_BRAND.facebook}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Connect on Facebook"
        className="inline-flex items-center gap-1.5 rounded-xl border border-blue-600/40 bg-blue-950/30 hover:bg-blue-900/50 px-3 py-2 text-xs font-bold text-blue-300 transition shadow-sm hover:scale-105 active:scale-95"
      >
        <svg className="w-4 h-4 text-blue-400 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        {!isCompact && <span>Facebook</span>}
      </a>

      {/* WhatsApp Direct */}
      <a
        href={CODE76_BRAND.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/30 hover:bg-emerald-900/50 px-3 py-2 text-xs font-bold text-emerald-300 transition shadow-sm hover:scale-105 active:scale-95"
      >
        <MessageCircle className="w-4 h-4 text-emerald-400" />
        {!isCompact && <span>WhatsApp</span>}
      </a>

      {/* Official Email */}
      <a
        href={CODE76_BRAND.emailUrl}
        aria-label="Send direct email"
        className="inline-flex items-center gap-1.5 rounded-xl border border-teal-500/40 bg-teal-950/30 hover:bg-teal-900/50 px-3 py-2 text-xs font-bold text-teal-300 transition shadow-sm hover:scale-105 active:scale-95"
      >
        <Mail className="w-4 h-4 text-teal-400" />
        <span>code76pos@gmail.com</span>
      </a>
    </div>
  );
}
