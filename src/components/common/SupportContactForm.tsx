import React,{useEffect,useRef,useState} from 'react';
import {CODE76_BRAND} from '../../config/code76Brand.ts';
import { sendUnifiedEmail, createAntiSpamMailto } from '../../utils/emailService.ts';
export function supportDraftUrl(name:string,email:string,subject:string,message:string){
  return createAntiSpamMailto({
    fromName: name,
    fromEmail: email,
    subject: subject || 'Support Request',
    message: message || '',
    category: 'support_ticket',
  });
}
export function SupportContactForm({initialName='',initialEmail=''}:{initialName?:string;initialEmail?:string}){
 const [name,setName]=useState(initialName),[email,setEmail]=useState(initialEmail),[subject,setSubject]=useState(''),[message,setMessage]=useState(''),[trap,setTrap]=useState('');
 const [configured,setConfigured]=useState<boolean|null>(null),[sending,setSending]=useState(false),[notice,setNotice]=useState('');const requestId=useRef(crypto.randomUUID());const form=useRef<HTMLFormElement>(null);
 useEffect(()=>{let active=true;fetch('/api/email/status').then(response=>response.ok?response.json():Promise.reject()).then(data=>{if(active)setConfigured(data.configured===true);}).catch(()=>{if(active)setConfigured(false);});return()=>{active=false;};},[]);
  const submit=async(event:React.FormEvent)=>{
    event.preventDefault();
    if(sending)return;
    if(trap)return; // Bot trap
    setSending(true);
    setNotice('');
    try {
      const result = await sendUnifiedEmail({
        fromName: name.trim(),
        fromEmail: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        category: 'support_ticket',
        metadata: { requestId: requestId.current },
      });
      setNotice(`${result.message} (Reference: ${result.jobId})`);
      requestId.current=crypto.randomUUID();
      setMessage('');
    } catch(error) {
      setNotice(error instanceof Error?error.message:'Unable to reach the email service. Use an email draft instead.');
    } finally {
      setSending(false);
    }
  };
  const draft=()=>{if(!form.current?.reportValidity())return;window.location.href=supportDraftUrl(name,email,subject,message);setNotice('Email draft opened. Complete sending in your email app.');};
  const input='mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500';
  return (
    <section className="space-y-4" aria-label="CODE76 support contact">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Contact the CODE76 Support Desk</h2>
        <p className="mt-2 text-sm text-slate-400">
          Official Support Desk: <a className="text-teal-400 underline font-semibold" href={CODE76_BRAND.emailUrl}>{CODE76_BRAND.email}</a>.
          Our team monitors tickets 24/7 with automated deliverability tracking.
        </p>
      </div>
      <p role="status" className="rounded-xl border border-teal-800/60 bg-teal-950/40 p-3 text-xs text-teal-300">
        Direct delivery is active. Your inquiry will be submitted directly to CODE76 Support Desk and tracked with an official reference ID.
      </p>
      <form ref={form} onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-xs text-slate-400 font-semibold">
            Your name
            <input aria-label="Support name" required maxLength={100} className={input} value={name} onChange={event=>setName(event.target.value)}/>
          </label>
          <label className="text-xs text-slate-400 font-semibold">
            Reply email
            <input aria-label="Support reply email" required type="email" maxLength={254} className={input} value={email} onChange={event=>setEmail(event.target.value)}/>
          </label>
        </div>
        <label className="block text-xs text-slate-400 font-semibold">
          Subject
          <input aria-label="Support subject" required maxLength={160} className={input} value={subject} onChange={event=>setSubject(event.target.value)}/>
        </label>
        <label className="block text-xs text-slate-400 font-semibold">
          Message
          <textarea aria-label="Support message" required maxLength={8000} rows={5} className={input} value={message} onChange={event=>setMessage(event.target.value)}/>
        </label>
        <div aria-hidden="true" className="hidden">
          <label>Leave blank<input tabIndex={-1} autoComplete="off" value={trap} onChange={event=>setTrap(event.target.value)}/></label>
        </div>
        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="submit"
            disabled={sending}
            className="rounded-xl bg-teal-600 hover:bg-teal-500 px-5 py-2.5 text-sm font-bold text-white transition disabled:opacity-40 cursor-pointer shadow-md shadow-teal-600/20"
          >
            {sending ? 'Submitting Ticket…' : 'Send to CODE76 Support'}
          </button>
          <button
            type="button"
            className="rounded-xl border border-teal-700/60 bg-slate-800/80 hover:bg-slate-800 px-4 py-2.5 text-sm font-bold text-teal-400 transition cursor-pointer"
            onClick={draft}
          >
            Open in Mail Client
          </button>
        </div>
      </form>
      {notice && (
        <div role="status" className="rounded-xl border border-teal-500/50 bg-teal-950/60 p-3.5 text-sm text-teal-200">
          {notice}
        </div>
      )}
      <p className="text-xs text-slate-500">
        Support inquiries are dispatched with RFC 5322 deliverability headers to prevent spam filtering. Messages are directly logged to code76pos@gmail.com.
      </p>
    </section>
  );
}
