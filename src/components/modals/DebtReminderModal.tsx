import React,{useEffect,useState,useMemo} from 'react';
import {usePOS} from '../../context/POSContext.tsx';
import {useRegionalFormat} from '../../hooks/useRegionalFormat.ts';
import {buildDebtReminder,daysPastDue} from '../../utils/debt.ts';
import type {SaleTransaction} from '../../types/index.ts';
import {X,Mail,Send,Copy,CheckCircle2,AlertCircle} from 'lucide-react';
import {directoryName} from '../../utils/directory.ts';

export const DebtReminderModal:React.FC<{sale:SaleTransaction|null;onClose:()=>void}>=({sale,onClose})=>{
  const {sales,company,settings,hasFeature,recordDebtReminder,customers,companyMembers,relatedCompanies}=usePOS();
  const format=useRegionalFormat();
  const live=sales.find(s=>s.id===sale?.id)||sale;
  const [recipientEmail,setRecipientEmail]=useState('');
  const [recipientName,setRecipientName]=useState('');
  const [ccSelected,setCcSelected]=useState<string[]>([]);
  const [subject,setSubject]=useState('');
  const [body,setBody]=useState('');
  const [sent,setSent]=useState(false);
  const [error,setError]=useState('');

  const customerRecord=useMemo(()=> customers.find(c=> c.id===live?.customerId || directoryName(c)===live?.customerName), [customers, live]);
  const allCcCandidates=[...companyMembers, ...relatedCompanies];

  useEffect(()=>{
    if(!live) return;
    const custEmail=customerRecord?.email1 || customerRecord?.email2 || '';
    setRecipientEmail(custEmail);
    setRecipientName(live.customerName||customerRecord?directoryName(customerRecord!):'Valued Customer');
    const draft=buildDebtReminder({sale:live,companyName:company.name,currency:company.currency||settings.payments.defaultCurrency,handlerName:live.debtHandlerName,companyTel:company.tel1,todayISO:new Date().toISOString()});
    setSubject(draft.subject);
    setBody(draft.body);
    setSent(false);setError('');setCcSelected([]);
  },[live?.id]);

  if(!live) return null;
  if(!hasFeature('email')) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"><div className="rounded-2xl bg-slate-900 border border-slate-700 p-6 max-w-md w-full"><h3 className="font-bold">Email feature not enabled</h3><p className="text-sm text-slate-400 mt-2">This workspace plan does not include email. Ask administrator to enable email features.</p><button className="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm" onClick={onClose}>Close</button></div></div>
  );
  const overdue=daysPastDue(live,new Date().toISOString());
  const isPastDue=overdue!==null && overdue>0;
  const handleSend=async()=>{
    try{
      if(!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) throw new Error('Enter a valid recipient email.');
      const ccEmails=allCcCandidates.filter(p=>ccSelected.includes(p.id)).map(p=>p.email1||p.email2).filter(Boolean) as string[];
      recordDebtReminder(live.id,{recipientEmail,recipientName,ccEmails:ccEmails.length?ccEmails:undefined,subject,bodyPreview:body,channel:'email'});
      setSent(true); setError('');
      setTimeout(()=>{setSent(false);onClose();},1600);
    }catch(value){setError(value instanceof Error?value.message:'Could not prepare reminder.');}
  };
  const handleCopy=async()=>{
    try{
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
      recordDebtReminder(live.id,{recipientEmail,recipientName,subject,bodyPreview:body,channel:'copy'});
      setSent(true);
      setTimeout(()=>{setSent(false);onClose();},1300);
    }catch{ setError('Clipboard blocked — copy manually and keep a reminder note.');}
  };
  const input='mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm';
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"><section role="dialog" aria-modal="true" aria-labelledby="debt-reminder-title" className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6 text-slate-100"><button type="button" aria-label="Close reminder" className="absolute right-3 top-3 p-2" onClick={onClose}><X size={20}/></button>
    <div className="flex items-center gap-3 mb-3"><div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30"><Mail size={20}/></div><div><span className="text-xs uppercase tracking-wider font-bold text-amber-400">Friendly debt reminder</span><h2 id="debt-reminder-title" className="text-xl font-bold">Remind customer — {live.receiptNo}</h2></div></div>
    {isPastDue&&<p role="alert" className="flex items-center gap-2 rounded-xl border border-amber-800 bg-amber-950/30 p-3 text-xs text-amber-300"><AlertCircle size={16}/>Past due by {overdue} day{(overdue||0)===1?'':'s'} · Outstanding {company.currency||'KES'} {live.debtAmount.toFixed(2)} {live.debtDueDate?`· due ${live.debtDueDate}`:''}</p>}
    {live.debtHandlerName&&<p className="mt-2 text-xs text-slate-400">Responsible handler: <strong className="text-slate-200">{live.debtHandlerName}</strong> will be shown as contact.</p>}
    {sent?<div className="my-6 rounded-xl border border-emerald-800 bg-emerald-950/40 p-6 text-center"><CheckCircle2 size={36} className="mx-auto text-emerald-400"/><h3 className="mt-3 font-bold text-emerald-200">Reminder prepared</h3><p className="text-sm text-emerald-300/90 mt-1">A friendly reminder draft for {recipientName} was recorded. Paste into email/WhatsApp when ready — no funds moved.</p></div>:<div className="space-y-4 mt-4">
      <div className="grid sm:grid-cols-2 gap-3"><label className="text-xs text-slate-400">Recipient name<input className={input} value={recipientName} onChange={e=>setRecipientName(e.target.value)}/></label><label className="text-xs text-slate-400">Recipient email<input className={input} type="email" required value={recipientEmail} onChange={e=>setRecipientEmail(e.target.value)} placeholder="customer@example.com"/></label></div>
      <div><label className="text-xs text-slate-400">CC — company members & related companies (optional)</label><div className="mt-2 max-h-28 overflow-y-auto rounded-xl border border-slate-700 p-2 grid sm:grid-cols-2 gap-2">{allCcCandidates.slice(0,40).map(person=>{const email=person.email1||person.email2; if(!email) return null; const checked=ccSelected.includes(person.id); return <label key={person.id} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={checked} onChange={e=> setCcSelected(prev=> e.target.checked?[...prev,person.id]:prev.filter(id=>id!==person.id))}/> <span className="truncate">{directoryName(person)} · {email}</span></label>;})}</div><p className="mt-1 text-[11px] text-slate-500">Selected CCs are stored as reminder history and shown in audit log. No automatic email delivery is claimed.</p></div>
      <label className="block text-xs text-slate-400">Email subject<input className={input} value={subject} onChange={e=>setSubject(e.target.value)}/></label>
      <label className="block text-xs text-slate-400">Friendly reminder body<textarea rows={10} className={input+" font-mono text-xs leading-relaxed"} value={body} onChange={e=>setBody(e.target.value)}/></label>
      <div className="flex flex-wrap gap-2 justify-end">
        <button type="button" onClick={onClose} className="rounded-xl border border-slate-700 px-4 py-2 text-sm">Cancel</button>
        <button type="button" onClick={handleCopy} className="rounded-xl border border-slate-700 px-4 py-2 text-sm flex items-center gap-2"><Copy size={15}/> Copy text & record</button>
        <button type="button" onClick={handleSend} className="rounded-xl bg-amber-600 hover:bg-amber-500 px-5 py-2 text-sm font-bold text-white flex items-center gap-2"><Send size={15}/> Prepare email reminder</button>
      </div>
      <p className="text-[11px] text-slate-500">This prepares a local reminder draft only. Review balances with the handler before sending externally.</p>
    </div>}
    {error&&<p role="alert" className="mt-3 rounded-lg border border-amber-800 p-3 text-sm text-amber-300">{error}</p>}
    {!!live.debtReminderHistory?.length&&<div className="mt-6 border-t border-slate-700 pt-4"><h3 className="font-bold text-sm">Past reminders for this receipt</h3><div className="mt-2 space-y-1">{live.debtReminderHistory.map(r=><p key={r.id} className="rounded-lg border border-slate-800 p-2 text-xs">{format.dateTime(r.sentAt)} · to {r.recipientName} &lt;{r.recipientEmail}&gt; · {r.subject} · by {r.sentBy}</p>)}</div></div>}
  </section></div>;
};
