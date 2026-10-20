import type {PaymentMethod,SaleTransaction} from '../types/index.ts';
import {PAYMENT_METHODS,canonicalPaymentMethod} from '../config/paymentMethods.ts';
export interface DebtPaymentRecord {id:string;amount:number;method:PaymentMethod;reference:string;timestamp:string;recordedBy:string;balanceBefore:number;balanceAfter:number}
export interface DebtPaymentOptions {paymentId?:string;reference?:string;recordedBy?:string;timestamp?:string}
const toCents=(n:number)=>{if(!Number.isFinite(n)||n<0||!Number.isSafeInteger(Math.round(n*100)))throw new Error('The amount is outside the supported range.');return Math.round(n*100);};
export function outstandingBalance(sale:SaleTransaction):number {
 const total=toCents(sale.netTotal),paid=toCents(sale.amountPaid),stored=toCents(sale.debtAmount);
 const remaining=Math.max(0,total-paid);
 if(Math.abs(stored-remaining)>1)throw new Error('This historical balance disagrees with its total/amount paid. Review the source record before collecting another payment.');
 return remaining/100;
}
/** Validate first, then return a new immutable transaction. No funds are moved. */
export function applyDebtPayment(sale:SaleTransaction,amount:number,method:string,options:DebtPaymentOptions={}):{sale:SaleTransaction;payment:DebtPaymentRecord;duplicate:boolean}{
 const id=options.paymentId||crypto.randomUUID();const previous=sale.debtPayments?.find(payment=>payment.id===id);
 if(previous)return {sale,payment:previous,duplicate:true};
 const remaining=outstandingBalance(sale),cents=toCents(amount);
 if(cents<=0)throw new Error('Enter a paid amount greater than zero.');
 if(remaining<=0)throw new Error('This transaction has no outstanding debt.');
 if(cents>toCents(remaining))throw new Error('Payment cannot exceed the current outstanding balance.');
 if(!PAYMENT_METHODS.includes(method as PaymentMethod)&&method!=='Card'&&method!=='Bank Wire')throw new Error('Select a supported payment channel.');
 const channel=canonicalPaymentMethod(method);if(channel==='Credit / Debt')throw new Error('Credit/debt cannot repay an existing debt. Select an actual payment channel.');
 const reference=(options.reference||'').trim();if(reference.length>120)throw new Error('Keep the payment reference within 120 characters.');
 const timestamp=options.timestamp||new Date().toISOString();if(!Number.isFinite(Date.parse(timestamp)))throw new Error('The payment timestamp is invalid.');
 const paid=(toCents(sale.amountPaid)+cents)/100,balanceAfter=(toCents(remaining)-cents)/100;
 const payment:DebtPaymentRecord={id,amount:cents/100,method:channel,reference,timestamp,recordedBy:options.recordedBy||'User',balanceBefore:remaining,balanceAfter};
 return {duplicate:false,payment,sale:{...sale,amountPaid:paid,debtAmount:balanceAfter,status:balanceAfter===0?'completed':'debt_partial',debtSettledDate:balanceAfter===0?timestamp:undefined,payments:[...sale.payments,{method:channel,amount:cents/100,referenceNo:reference||undefined}],debtPayments:[...(sale.debtPayments||[]),payment]}};
}
