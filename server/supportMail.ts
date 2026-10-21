import {requestSiteUrl} from '../src/utils/siteSeo.ts';
import {Router,type Request} from 'express';
import nodemailer from 'nodemailer';
import {CODE76_BRAND,CODE76_CREDIT_TEXT} from '../src/config/code76Brand.ts';

export interface SupportInput {requestId:string;name:string;email:string;subject:string;message:string;website?:string}
export interface SupportMail {from:string;to:string;replyTo:{name:string;address:string};subject:string;text:string}
export type SupportSender=(mail:SupportMail)=>Promise<{accepted?:unknown[];rejected?:unknown[]}>;
export function validateSupportInput(value:unknown):SupportInput {
 if(!value || typeof value!=='object')throw new Error('Enter your name, email, subject and message.');
 const raw=value as Record<string,unknown>;const field=(key:string)=>typeof raw[key]==='string'?(raw[key] as string).trim():'';
 const input={requestId:field('requestId'),name:field('name'),email:field('email'),subject:field('subject'),message:field('message'),website:field('website')};
 if(input.website)throw new Error('Submission could not be accepted.');
 if(!/^[A-Za-z0-9-]{12,100}$/.test(input.requestId))throw new Error('Refresh the form and try again.');
 if(!input.name || input.name.length>100 || /[\r\n]/.test(input.name))throw new Error('Enter a name up to 100 characters.');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email) || input.email.length>254)throw new Error('Enter a valid reply email address.');
 if(!input.subject || input.subject.length>160 || /[\r\n]/.test(input.subject))throw new Error('Enter a one-line subject up to 160 characters.');
 if(!input.message || input.message.length>8000)throw new Error('Enter a message up to 8,000 characters.');
 return input;
}
export function supportMail(input:SupportInput,from:string):SupportMail {
 return {from,to:CODE76_BRAND.email,replyTo:{name:input.name,address:input.email},subject:`[CODE76 POS Support] ${input.subject}`,text:`CODE76 POS support request\nReference: ${input.requestId}\nFrom: ${input.name}\nReply email: ${input.email}\nSubject: ${input.subject}\n\n${input.message}\n\nPlease do not send passwords or access tokens.\n\n${CODE76_CREDIT_TEXT}`};
}
export function supportSmtpConfiguration(env:NodeJS.ProcessEnv=process.env){
 const host=env.SMTP_HOST?.trim(),from=env.SMTP_FROM?.trim();
 const port=Number(env.SMTP_PORT||587),secure=env.SMTP_SECURE==='true'||(!env.SMTP_SECURE&&port===465);
 if(!host||!from||!Number.isInteger(port)||port<1||port>65535||/[\r\n]/.test(host+from)||!/@/.test(from))return null;
 if(!!env.SMTP_USER!==!!env.SMTP_PASS)return null;
 return {host,port,secure,from,user:env.SMTP_USER,pass:env.SMTP_PASS};
}
export function configuredSupportSender(env:NodeJS.ProcessEnv=process.env):{configured:boolean;from:string;send?:SupportSender}{
 const config=supportSmtpConfiguration(env);if(!config)return {configured:false,from:''};
 const transport=nodemailer.createTransport({host:config.host,port:config.port,secure:config.secure,requireTLS:!config.secure,auth:config.user?{user:config.user,pass:config.pass}:undefined,connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000,tls:{rejectUnauthorized:true}});
 return {configured:true,from:config.from,send:mail=>transport.sendMail(mail)};
}
export function sameSupportOrigin(req:Request):boolean{
 const origin=req.get('origin');if(!origin)return true;
 try{const url=new URL(origin);const requestOrigin=new URL(requestSiteUrl({host:req.get('host'),forwardedHost:req.get('x-forwarded-host'),forwardedProto:req.get('x-forwarded-proto'),encrypted:req.secure})).origin;let configured:string|undefined;try{configured=process.env.PUBLIC_SITE_URL?new URL(process.env.PUBLIC_SITE_URL).origin:undefined;}catch{}return ['http:','https:'].includes(url.protocol)&&(url.origin===requestOrigin||url.origin===configured);}catch{return false;}
}
/** Fixed recipient, header-safe input, same-origin checks, bounded rate/idempotency
 * caches and no body/credential logging. SMTP acceptance is not an inbox/read receipt.
 */
export function createSupportRouter(options=configuredSupportSender(),now=()=>Date.now()){
 const router=Router();const attempts=new Map<string,{start:number;count:number}>();
 const accepted=new Map<string,{at:number}>();const pending=new Map<string,Promise<void>>();
 router.get('/status',(_req,res)=>{res.set('Cache-Control','no-store');res.json({configured:options.configured,recipient:CODE76_BRAND.email});});
 router.post('/contact',async(req,res)=>{
  if(!sameSupportOrigin(req))return res.status(403).json({error:'Open the support form from the app itself.'});
  let input:SupportInput;try{input=validateSupportInput(req.body);}catch(error){return res.status(400).json({error:error instanceof Error?error.message:'Check the form fields.'});}
  if(!options.configured||!options.send)return res.status(503).json({error:'Direct support delivery is not configured on this server. Please use the email-draft option.',configured:false});
  const ip=req.ip||req.socket.remoteAddress||'unknown',key=`${ip}:${input.requestId}`,time=now();
  for(const [id,value] of accepted)if(time-value.at>15*60_000)accepted.delete(id);
  if(accepted.has(key))return res.json({status:'accepted',reference:input.requestId,duplicate:true,message:'Already accepted by the configured mail service; no duplicate sent.'});
  if(!pending.has(key)){
   let limit=attempts.get(ip);if(!limit||time-limit.start>15*60_000){limit={start:time,count:0};attempts.set(ip,limit);}if(limit.count>=5)return res.status(429).json({error:'Too many support attempts. Please wait or use your email app.'});limit.count++;
   if(attempts.size>1000)attempts.delete(attempts.keys().next().value!);
   const operation=(async()=>{const result=await options.send!(supportMail(input,options.from));if(!result.accepted?.length||result.rejected?.some(address=>String(address).toLowerCase()===CODE76_BRAND.email))throw new Error('not accepted');accepted.set(key,{at:now()});if(accepted.size>1000)accepted.delete(accepted.keys().next().value!);})();
   pending.set(key,operation);
  }
  try{await pending.get(key);return res.json({status:'accepted',reference:input.requestId,message:'Accepted by the configured email service for CODE76 support. This is not an inbox/read confirmation.'});}
  catch{return res.status(502).json({error:'The email service could not accept your message. Use the email-draft option or retry later.'});}
  finally{pending.delete(key);}
 });
 return router;
}
