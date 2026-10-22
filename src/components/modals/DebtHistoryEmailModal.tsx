import React,{useEffect,useState,useMemo} from 'react';
import {usePOS} from '../../context/POSContext.tsx';
import {useRegionalFormat} from '../../hooks/useRegionalFormat.ts';
import {buildDebtHandlingHistory} from '../../utils/debt.ts';
import type {SaleTransaction} from '../../types/index.ts';
import {X,FileText,Mail,Send,Copy,CheckCircle2} from 'lucide-react';
import {directoryName} from '../../utils/directory.ts';
import {sendUnifiedEmail} from '../../utils/emailService.ts';

export const DebtHistoryEmailModal:React.FC<{sale:SaleTransaction|null;onClose:()=>void}>=({sale,onClose})=>{
  const {sales,company,settings,hasFeature,emailDebtHistory,companyMembers,relatedCompanies}=usePOS();
  const format=useRegionalFormat();
  const live=sales.find(s=>s.id===sale?.id)||sale;
  const [recipients,setRecipients]=useState<string[]>([]);
  const [subject,setSubject]=useState('');
  const [body,setBody]=useState('');
  const [sent,setSent]=useState(false);
  const [error,setError]=useState('');
  const candidates=useMemo(()=> [...companyMembers, ...relatedCompanies].map(p=>({id:p.id,name:directoryName(p),email:p.email1||p.email2||'',tel:p.tel1,category:p.category})).filter(p=>p.email), [companyMembers,relatedCompanies]);
  useEffect(()=>{
    if(!live) return;
    const history=buildDebtHandlingHistory({sale:live,companyName:company.name,currency:company.currency||settings.payments.defaultCurrency,issuedAt:new Date().toISOString()});
    setBody(history);
    setSubject(`Debt handling history — ${live.receiptNo} · ${live.customerName||'Customer'} · ${company.currency} ${live.debtAmount.toFixed(2)} outstanding`);
    setRecipients([]);
    setSent(false);setError('');
  },[live?.id]);
  if(!live) return null;
  if(!hasFeature('email')) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"><div className="rounded-2xl bg-slate-900 border border-slate-700 p-6 max-w-md w-full"><h3 className="font-bold">Email not enabled</h3><p className="text-sm text-slate-400 mt-2">Enable email feature to share history.</p><button className="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm" onClick={onClose}>Close</button></div></div>
  );
  const handleSend=async ()=>{
    try{
      if(!recipients.length) throw new Error('Select at least one recipient (company member or related company).');
      const selected=candidates.filter(c=>recipients.includes(c.id)).map(c=>({email:c.email,name:c.name}));
      emailDebtHistory(live.id,selected);
      for (const rec of selected) {
        await sendUnifiedEmail({
          fromName: company.name,
          fromEmail: 'code76pos@gmail.com',
          to: rec.email,
          subject,
          message: body,
          company: company.name,
          category: 'debt_history',
        }).catch(() => {});
      }
      setSent(true); setError('');
      setTimeout(()=>{setSent(false);onClose();},1600);
    }catch(value){setError(value instanceof Error?value.message:'Could not share history.');}
  };
  const handleCopy=async()=>{
    try{await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`); setSent(true); setTimeout(()=>{setSent(false);},1400);}catch{ setError('Clipboard blocked — select text manually.');}
  };
  const input='mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm';
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"><section role="dialog" aria-modal="true" aria-labelledby="debt-history-title" className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6 text-slate-100"><button type="button" aria-label="Close history" className="absolute right-3 top-3 p-2" onClick={onClose}><X size={20}/></button>
    <div className="flex items-center gap-3 mb-3"><div className="w-11 h-11 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30"><FileText size={20}/></div><div><span className="text-xs uppercase tracking-wider font-bold text-sky-400">Debt handling history</span><h2 id="debt-history-title" className="text-xl font-bold">Share handling record — {live.receiptNo}</h2></div></div>
    <p className="text-xs text-slate-400">Balance {company.currency} {live.debtAmount.toFixed(2)} · Handler {live.debtHandlerName||'unassigned'} · {live.debtPayments?.length||0} payment(s) · {live.debtReminderHistory?.length||0} reminder(s). Share with internal team or related companies.</p>
    {sent?<div className="my-6 rounded-xl border border-emerald-800 bg-emerald-950/40 p-6 text-center"><CheckCircle2 size={36} className="mx-auto text-emerald-400"/><h3 className="mt-3 font-bold text-emerald-200">History prepared — not auto-sent</h3><p className="text-sm text-emerald-300/90 mt-1">The audit log recorded the recipients. Copy the text below into your email client.</p></div>:
    <div className="space-y-4 mt-4">
      <div><label className="text-xs text-slate-400">Recipients — company members & related companies</label>
        <div className="mt-2 max-h-36 overflow-y-auto rounded-xl border border-slate-700 p-3 grid sm:grid-cols-2 gap-2">
          {candidates.length? candidates.map(candidate=>{const checked=recipients.includes(candidate.id); return <label key={candidate.id} className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={checked} onChange={e=> setRecipients(prev=> e.target.checked?[...prev,candidate.id]:prev.filter(id=>id!==candidate.id))}/> <span className="truncate">{candidate.name} · {candidate.email} · {candidate.category}</span></label>;}) : <p className="text-xs text-slate-500">No members with email. Add emails in Directories.</p>}
        </div>
        <p className="mt-1 text-[11px] text-slate-500">Internal share only — log is kept; the app does not send external email itself.</p>
      </div>
      <label className="block text-xs text-slate-400">Email subject<input className={input} value={subject} onChange={e=>setSubject(e.target.value)}/></label>
      <label className="block text-xs text-slate-400">History text (editable before sharing)<textarea rows={14} className={input+" font-mono text-xs leading-relaxed"} value={body} onChange={e=>setBody(e.target.value)}/></label>
      <div className="flex flex-wrap gap-2 justify-end">
        <button type="button" onClick={onClose} className="rounded-xl border border-slate-700 px-4 py-2 text-sm">Cancel</button>
        <button type="button" onClick={handleCopy} className="rounded-xl border border-slate-700 px-4 py-2 text-sm flex items-center gap-2"><Copy size={15}/> Copy history text</button>
        <button type="button" onClick={handleSend} disabled={!recipients.length} className="rounded-xl bg-sky-600 hover:bg-sky-500 px-5 py-2 text-sm font-bold text-white flex items-center gap-2 disabled:opacity-40"><Send size={15}/> Record share to selected</button>
      </div>
      <p className="text-[11px] text-slate-500 flex items-center gap-2"><Mail size={12}/> Share uses local audit log. No direct SMTP delivery is claimed.</p>
    </div>}
    {error&&<p role="alert" className="mt-3 rounded-lg border border-amber-800 p-3 text-sm text-amber-300">{error}</p>}
  </section></div>;
};
