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
