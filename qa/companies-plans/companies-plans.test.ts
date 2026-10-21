import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FEATURES, PLAN_TIERS, hasPlanFeature, canOpenPlatform, canOpenSettings, directoryFeature, planTier, requirePlanFeature } from '../../src/utils/plans.ts';
import { INITIAL_SETTINGS } from '../../src/data/initialData.ts';
import { mergeAppSettings } from '../../src/utils/businessPageSettings.ts';
import { DIRECTORY_KEYS, directoryName, directoryMemberships, directoryPhoto, upsertDirectory, removeDirectory, snapshotParty, partyDetails, uniqueParties, validateDirectory, canonicalDirectoryId, type DirectoryCollections } from '../../src/utils/directory.ts';
import { applyShiftPreset, setOffDays, SHIFT_PRESETS, WEEK_DAYS, prepareSalaryPayment } from '../../src/utils/staffing.ts';
import { regional, dateOnly, dateTime, calendarDate, validTimeZone } from '../../src/utils/regional.ts';
import { PAYMENT_METHODS, acceptedPaymentMethods } from '../../src/config/paymentMethods.ts';
import { cameraErrorText, captureVideoFrame, stopMediaStream } from '../../src/utils/camera.ts';
import { escapeReportText } from '../../src/utils/exportUtils.ts';
import { accessHistoryPermissions, permittedBackup } from '../../src/utils/accessHistory.ts';
import type { PersonRecord, AppSettings, SalaryPaymentDraft } from '../../src/types/index.ts';

const prefs = (planTier: AppSettings['planTier']='pro'): AppSettings => ({...structuredClone(INITIAL_SETTINGS),planTier,regional:{timeZone:'Africa/Nairobi',dateFormat:'DD/MM/YYYY',timeFormat:'24h',holidayDates:[]}});
const person = (patch: Partial<PersonRecord>={}): PersonRecord => ({id:'TEST-member',firstName:'TEST',secondName:'Person',tel1:'',tel2:'',whatsappNo:'',email1:'',email2:'',address:'',location:'',country:'',photoUrl:'',photoConsentForLanding:false,category:'company_member',roles:['Transporter/Driver','Marketor'],createdAt:'2026-10-20T00:00:00Z',...patch});
const empty = (): DirectoryCollections => ({customers:[],vendors:[],transporters:[],marketingTeam:[],companyMembers:[],relatedCompanies:[]});
const source = (path:string) => readFileSync(new URL(`../../${path}`,import.meta.url),'utf8');
const free = new Set(['selling','receipts','sales_history','inventory','appearance','payments','regional','delete_data','about','company_members','company_profile']);
const starterOff = new Set(['business_landing','chatbot','email','referrals']);
for (const tier of PLAN_TIERS) for (const feature of FEATURES) test(`${tier} entitlement: ${feature}`,()=>{
  assert.equal(hasPlanFeature(tier,feature),feature==='team_services'?(tier==='max'||tier==='lifetime'):tier==='free'?free.has(feature):tier==='starter'?!starterOff.has(feature):true);
});
test('unknown feature strings fail closed even on Lifetime',()=>assert.equal(hasPlanFeature('lifetime','misspelled_feature' as any),false));
test('new workspaces default to Free while older saved settings retain Pro access',()=>{
  assert.equal(mergeAppSettings(INITIAL_SETTINGS).planTier,'free');
  assert.equal(mergeAppSettings(INITIAL_SETTINGS,{appearance:INITIAL_SETTINGS.appearance}).planTier,'pro');
  assert.equal(mergeAppSettings(INITIAL_SETTINGS,{planTier:'starter'}).planTier,'starter');
});
test('downgrade does not delete or rewrite records',()=>{const data={products:[{name:'TEST'}],salaryPayments:[{id:'TEST-payment'}]};const saved=JSON.stringify(data);assert.equal(hasPlanFeature('free','payroll'),false);assert.equal(JSON.stringify(data),saved);});
test('Free platform navigation exposes basic modules plus the company profile and company members',()=>{
  for(const platform of ['selling','sales_history','inventory','settings','about','my_company','company_members'] as const)assert.equal(canOpenPlatform(prefs('free'),platform),true);
  for(const platform of ['expenses','invoices','customers','vendors','transporters','marketing_team','messaging','audit_logs','landing_page_builder'] as const)assert.equal(canOpenPlatform(prefs('free'),platform),false);
});
test('Free company-member edits pass the plan guard while other directories stay paid',()=>{
  assert.equal(directoryFeature('company_member'),'company_members');
  for(const category of ['customer','vendor','transporter','marketer','related_company'] as const)assert.equal(directoryFeature(category),'directory');
  assert.doesNotThrow(()=>requirePlanFeature(prefs('free'),directoryFeature('company_member')));
  assert.throws(()=>requirePlanFeature(prefs('free'),directoryFeature('customer')),/not included/);
  assert.throws(()=>requirePlanFeature(prefs('free'),'directory'),/not included/);
  assert.equal(hasPlanFeature('free','company_profile'),true);
  assert.equal(canOpenSettings(prefs('free'),'teamAccess'),true);
  assert.equal(canOpenSettings(prefs('free'),'privileges'),false);
  assert.equal(hasPlanFeature('starter','company_members'),true);
  assert.equal(hasPlanFeature('free','payroll'),false);
  assert.equal(hasPlanFeature('free','data_export'),false);
});
test('Free has currency/date/appearance/payment/delete settings but no imports, backup or email',()=>{
  for(const section of ['regional','appearance','payments','dataEraser','plans'] as const)assert.equal(canOpenSettings(prefs('free'),section),true);
  for(const section of ['backup','privileges','emailTemplates','pdfExcel','landingPage','auditLogs'] as const)assert.equal(canOpenSettings(prefs('free'),section),false);
});
test('Starter retains companies, payroll, messaging and promotions with four explicit exclusions',()=>{
  for(const feature of ['directory','company_profile','payroll','invoices','expenses','audit','messaging','inventory_marketing'] as const)assert.equal(hasPlanFeature('starter',feature),true);
  for(const feature of starterOff)assert.equal(hasPlanFeature('starter',feature as any),false);
});
test('context-level paid actions reject Free as well as hiding its menu',()=>{
  assert.throws(()=>requirePlanFeature(prefs('free'),'payroll'),/not included/);
  const text=source('src/context/POSContext.tsx');
  for(const feature of ['payroll','expenses','invoices','debts'])assert.ok(text.replace(/\s+/g,'').includes(`requirePlanFeature(settings,'${feature}')`),`Missing plan guard: ${feature}`);
  // Directory writes are gated per category: company members are Free, other directories stay paid.
  assert.ok(text.replace(/\s+/g,'').includes('requirePlanFeature(settings,directoryFeature(category))'));
  assert.equal(directoryFeature('company_member'),'company_members');
  assert.equal(directoryFeature('customer'),'directory');
  assert.ok(text.includes('saleData.amountPaid + 0.001 < saleData.netTotal'));
});
test('only an admin can select a valid demo tier; save preferences cannot revert it',()=>{
  assert.match(source('src/context/POSContext.tsx'),/!currentUser\?\.isAdmin \|\| !PLAN_TIERS.includes/);
  assert.ok(source('src/components/platforms/SettingsPlatform.tsx').includes('planTier:settings.planTier'));
});
test('Free admin does not bypass licensed audit access',()=>assert.equal(accessHistoryPermissions({id:'TEST',name:'TEST',email:'qa@example.test',roles:['CEO','Other'],isAdmin:true},prefs('free')).canView,false));

for(const style of ['neutral','masculine','feminine'] as const)test(`optional ${style} avatar is a local illustrated placeholder`,()=>{const image=directoryPhoto(person({avatarStyle:style}));assert.ok(image.startsWith('data:image/svg+xml'));assert.ok(!image.includes('unsplash'));});
test('unspecified avatar is neutral and never infers sex/orientation from names',()=>assert.equal(directoryPhoto(person({firstName:'TEST arbitrary name'})),directoryPhoto(person({avatarStyle:'neutral'}))));
test('supplied photos override placeholders and organisations get a company image',()=>{
 assert.equal(directoryPhoto(person({photoUrl:'data:image/jpeg;base64,TEST'})),'data:image/jpeg;base64,TEST');
 assert.notEqual(directoryPhoto(person({entityType:'company',organisationName:'TEST Company'})),directoryPhoto(person()));
});
test('company name is distinct from personal first/second names',()=>assert.equal(directoryName(person({entityType:'company',organisationName:'TEST Kenya Power'})),'TEST Kenya Power'));
test('one staff identity is visible in members, transporters and marketing without duplicate IDs',()=>{
 const result=upsertDirectory(empty(),person());
 assert.deepEqual([result.companyMembers[0].id,result.transporters[0].id,result.marketingTeam[0].id],['TEST-member','TEST-member','TEST-member']);
});
test('editing any linked staff projection updates master and other views',()=>{
 let result=upsertDirectory(empty(),person());result=upsertDirectory(result,{...result.transporters[0],tel1:'TEST phone',firstName:'TEST edited'});
 assert.equal(result.companyMembers[0].tel1,'TEST phone');assert.equal(result.marketingTeam[0].firstName,'TEST edited');
});
test('removing a staff role removes its derived row, not the source member',()=>{
 let result=upsertDirectory(empty(),person());result=upsertDirectory(result,{...result.companyMembers[0],roles:['Associate','Other']});
 assert.equal(result.companyMembers.length,1);assert.equal(result.transporters.length,0);assert.equal(result.marketingTeam.length,0);
});
test('legacy trans-sync/mkt-sync IDs reconcile to the original member on edit',()=>{
 const collections=empty();collections.companyMembers=[person()];collections.transporters=[person({id:'trans-sync-TEST-member',category:'transporter'})];collections.marketingTeam=[person({id:'mkt-sync-TEST-member',category:'marketer'})];
 const result=upsertDirectory(collections,{...collections.transporters[0],tel1:'UPDATED'});
 assert.equal(result.companyMembers[0].tel1,'UPDATED');assert.equal(result.transporters.length,1);assert.equal(result.transporters[0].id,'TEST-member');assert.equal(result.marketingTeam[0].id,'TEST-member');
});
test('company functions project the same organisation into all selected business directories',()=>{
 const result=upsertDirectory(empty(),person({entityType:'company',organisationName:'TEST Logistics',category:'related_company',companyFunctions:['vendor','transporter','marketer']}));
 for(const key of ['relatedCompanies','vendors','transporters','marketingTeam'] as const)assert.equal(result[key][0].id,'TEST-member');
 assert.equal(result.companyMembers.length,0);
});
test('removing a company function removes that derived directory membership',()=>{
 let result=upsertDirectory(empty(),person({entityType:'company',organisationName:'TEST Co',category:'related_company',companyFunctions:['vendor','transporter']}));
 result=upsertDirectory(result,{...result.vendors[0],companyFunctions:['transporter']});assert.equal(result.vendors.length,0);assert.equal(result.relatedCompanies.length,1);
});
test('utilities can exist only in related companies and still be a selectable payee',()=>{
 const result=upsertDirectory(empty(),person({entityType:'company',organisationName:'TEST Kenya Power',companyType:'Electricity company',category:'related_company',companyFunctions:[]}));
 assert.equal(result.relatedCompanies.length,1);assert.equal(result.vendors.length,0);assert.equal(uniqueParties([result.relatedCompanies,result.vendors]).length,1);
});
test('company branches require an existing parent and reject ancestor cycles',()=>{
 const parent=person({id:'parent',entityType:'company',organisationName:'TEST Parent',category:'related_company'});
 assert.throws(()=>validateDirectory(person({entityType:'branch',organisationName:'TEST Branch'}),[parent]),/parent company/);
 const branch=person({id:'branch',entityType:'branch',organisationName:'TEST Branch',parentCompanyId:'parent'});assert.doesNotThrow(()=>validateDirectory(branch,[parent]));
 assert.throws(()=>validateDirectory({...parent,parentCompanyId:'branch'},[branch,parent]),/own ancestor/);
});
test('company transaction snapshots keep original details after contact edits',()=>{
 const record=person({entityType:'company',organisationName:'TEST Power',companyType:'Electricity company',tel1:'old number',taxPin:'TEST-tax'});const snapshot=snapshotParty(record);
 record.tel1='new number';record.organisationName='TEST New Name';assert.equal(snapshot.name,'TEST Power');assert.equal(snapshot.tel,'old number');assert.ok(partyDetails(snapshot).includes('Electricity company'));assert.ok(partyDetails(snapshot).includes('TEST-tax'));
});
test('branch snapshots include parent identity',()=>{
 const parent=person({id:'parent',entityType:'company',organisationName:'TEST Parent'});const snap=snapshotParty(person({entityType:'branch',organisationName:'TEST Branch',parentCompanyId:'parent'}),[parent]);assert.equal(snap.parentCompanyName,'TEST Parent');
});
test('deleting a linked directory identity does not mutate financial snapshots',()=>{
 const p=person();const snapshot=snapshotParty(p);const collections=removeDirectory(upsertDirectory(empty(),p),'trans-sync-TEST-member');
 for(const list of Object.values(collections))assert.equal(list.length,0);assert.equal(snapshot.name,'TEST Person');
});
test('external drivers are not automatically treated as employees without explicit selection',()=>{
 assert.deepEqual(directoryMemberships(person({category:'transporter',sourceCategory:'transporter',companyMember:false})),['transporter']);
 assert.ok(directoryMemberships(person({category:'transporter',sourceCategory:'transporter',companyMember:true})).includes('company_member'));
});

for(const preset of SHIFT_PRESETS)test(`shift preset ${preset.label} keeps disjoint working/off days`,()=>{
 const value=applyShiftPreset(preset.id);assert.ok(value.workingDays.every(day=>!value.offDays.includes(day)));assert.equal(value.shiftStart,preset.start);assert.equal(value.shiftEnd,preset.end);
});
test('half-day and overnight boundaries are explicit',()=>{
 assert.equal(applyShiftPreset('morning').shiftEnd,'12:00');assert.equal(applyShiftPreset('afternoon').shiftStart,'12:00');assert.equal(applyShiftPreset('night').shiftEnd,'06:00');assert.deepEqual(applyShiftPreset('weekends').workingDays,['Saturday','Sunday']);
});
test('holiday-only schedules do not fabricate holiday dates or salary payments',()=>assert.deepEqual(applyShiftPreset('holidays').workingDays,[]));
test('off-day selection is complementary and duplicate-safe',()=>{
 const result=setOffDays(['Saturday','Sunday','Sunday']);assert.deepEqual(result.offDays,['Saturday','Sunday']);assert.equal(result.workingDays.length,5);
});
const draft:SalaryPaymentDraft={id:'TEST-payment',memberId:'TEST-member',amount:2500,basis:'week',paidOn:'2026-10-20',paidFor:'TEST week',method:'M-Pesa',reference:'TEST-ref',recordExpense:false};
test('recording salary without the expense checkbox creates no expense',()=>{const result=prepareSalaryPayment(draft,person({salaryRate:12000,salaryBasis:'month'}),'KES','TEST actor');assert.equal(result.payment.amount,2500);assert.equal(result.expense,undefined);assert.equal(result.payment.currency,'KES');});
test('explicit salary-expense choice creates one deterministically linked expense',()=>{
 const result=prepareSalaryPayment({...draft,recordExpense:true},person(),'KES','TEST actor');assert.equal(result.expense?.category,'Salaries');assert.equal(result.expense?.amount,2500);assert.equal(result.expense?.salaryPaymentId,draft.id);assert.equal(result.payment.expenseId,result.expense?.id);
});
test('agreed rate does not replace the actual paid amount',()=>assert.equal(prepareSalaryPayment(draft,person({salaryRate:99999}),'KES','TEST actor').payment.amount,2500));
for(const amount of [0,-1,NaN,Infinity])test(`invalid paid amount ${amount} is rejected before posting`,()=>assert.throws(()=>prepareSalaryPayment({...draft,amount},person(),'KES','TEST'),/positive/));
test('invalid salary dates and companies are rejected',()=>{
 assert.throws(()=>prepareSalaryPayment({...draft,paidOn:'2026-02-31'},person(),'KES','TEST'),/valid payment date/);
 assert.throws(()=>prepareSalaryPayment(draft,person({entityType:'company'}),'KES','TEST'),/individual company members/);
 assert.throws(()=>prepareSalaryPayment({...draft,method:'Credit / Debt'},person(),'KES','TEST'),/actual salary payment/);
});
test('context prevents double-click salary/expense duplication and checks expense privilege first',()=>{
 const text=source('src/context/POSContext.tsx');assert.ok(text.includes('salaryRef.current.find(p => p.id === draft.id)'));assert.ok(text.includes('if (previous) return previous'));assert.ok(text.indexOf("draft.recordExpense && !hasPrivilege('canEditExpenses')")<text.indexOf('prepareSalaryPayment(draft'));
});
test('non-HR backup does not expose salary payments or agreed rates',()=>{
 const data=JSON.stringify({companyMembers:[person({salaryRate:50000})],salaryPayments:[{id:'private-pay'}]});const settings=prefs();settings.privileges.Cashier.canManagePeople=false;settings.privileges.Associate.canManagePeople=false;
 const filtered=JSON.parse(permittedBackup(data,{id:'TEST',name:'TEST',email:'qa@example.test',roles:['Cashier','Associate'],isAdmin:false},settings));assert.equal(filtered.salaryPayments,undefined);assert.equal(filtered.companyMembers[0].salaryRate,undefined);
});

test('selected time zone formats instants without changing the stored ISO value',()=>{const iso='2026-10-20T22:30:00.000Z';assert.ok(dateTime(iso,prefs()).startsWith('21/10/2026 01:30:00'));assert.equal(iso,'2026-10-20T22:30:00.000Z');});
test('date-only documents do not move to yesterday in another time zone',()=>{const s=prefs();s.regional!.timeZone='America/Los_Angeles';assert.equal(dateOnly('2026-10-20',s),'20/10/2026');});
test('all three date formats and 12-hour time are supported',()=>{
 const s=prefs();s.regional!.dateFormat='YYYY-MM-DD';assert.equal(dateOnly('2026-10-20',s),'2026-10-20');s.regional!.dateFormat='MM/DD/YYYY';assert.equal(dateOnly('2026-10-20',s),'10/20/2026');s.regional!.timeFormat='12h';assert.match(dateTime('2026-10-20T12:00:00Z',s),/03:00:00 pm/i);
});
test('business date inputs use the selected timezone rather than an unconditional UTC day',()=>assert.equal(calendarDate('2026-10-20T22:30:00Z',prefs()),'2026-10-21'));
test('bad zones fail validation and holiday lists are explicit/deduplicated',()=>{assert.equal(validTimeZone('Not/AZone'),false);const s=prefs();s.regional!.holidayDates=['2026-12-25','2026-12-25','bad'];assert.deepEqual(regional(s).holidayDates,['2026-12-25']);});
test('more payment channels are available but bookkeeping is not live integration',()=>{for(const method of ['Airtel Money','T-Kash','Cheque','PayPal','Voucher'])assert.ok(PAYMENT_METHODS.includes(method as any));assert.ok(!acceptedPaymentMethods(['Cash','Credit / Debt'],false).includes('Credit / Debt'));assert.deepEqual(acceptedPaymentMethods(['Card','Bank Wire'],true),['Credit Card','Bank Transfer']);});

test('camera refuses blank or unready video frames',()=>{
 assert.throws(()=>captureVideoFrame({readyState:1,videoWidth:640,videoHeight:480}),/Wait for the live/);assert.throws(()=>captureVideoFrame({readyState:2,videoWidth:0,videoHeight:0}),/Wait for the live/);
});
test('camera capture scales large frames, keeps text orientation and emits actual JPEG',()=>{
 let drawn:any[]=[];const canvas:any={width:0,height:0,getContext:()=>({drawImage:(...args:any[])=>{drawn=args;}}),toDataURL:()=> 'data:image/jpeg;base64,'+'A'.repeat(150)};
 const value=captureVideoFrame({readyState:3,videoWidth:4000,videoHeight:3000},()=>canvas);assert.ok(value.startsWith('data:image/jpeg'));assert.equal(canvas.width,1024);assert.equal(canvas.height,768);assert.equal(drawn.length,5);
});
test('camera failures explain permission/device/busy conditions and have a device-file fallback',()=>{
 assert.match(cameraErrorText({name:'NotAllowedError'}),/embedded preview/);assert.match(cameraErrorText({name:'NotFoundError'}),/No camera/);assert.match(cameraErrorText({name:'NotReadableError'}),/busy/);
 assert.ok(source('src/components/common/UniversalPhotoInput.tsx').includes('Use device camera / choose a photo instead'));
});
test('camera stop releases every track',()=>{let stopped=0;stopMediaStream({getTracks:()=>[{stop:()=>stopped++},{stop:()=>stopped++}] as any});assert.equal(stopped,2);});
test('shared camera starts after DOM commit and cancels late streams on retry/unmount',()=>{
 const hook=source('src/hooks/useDeviceCamera.ts');assert.match(hook,/useEffect\(\(\) =>/);assert.ok(hook.includes('if (!active() || !video)'));assert.ok(hook.includes('stopMediaStream(stream)'));assert.ok(hook.includes('video.srcObject=stream'));assert.ok(hook.includes('await video.play()'));
});
test('every camera implementation routes through the one shared control',()=>{
 const text=source('src/components/common/UniversalPhotoInput.tsx');assert.ok(text.includes('useDeviceCamera'));assert.ok(!text.includes('navigator.mediaDevices.getUserMedia'));
});
test('new supplier/company fields cannot execute HTML in PDF print reports',()=>{assert.equal(escapeReportText('<script>alert("x")</script>&'), '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;&amp;');});
test('expense and purchase invoice PDFs retain the selected company snapshot details',()=>{
 for(const file of ['ExpensesPlatform','InvoicesPlatform']){const text=source(`src/components/platforms/${file}.tsx`);assert.ok(text.includes('PartyPicker'));assert.ok(text.includes('partyDetails('));assert.ok(text.includes('saved at entry'));}
});

test('invoice totals come from actual stock lines and paid status, not a hidden template',async()=>{
 const {invoiceDraftTotals}=await import('../../src/utils/invoiceDraft.ts');
 const result=invoiceDraftTotals([{description:'TEST stock',quantity:3,unitPrice:20,total:999}],0,0);
 assert.equal(result.items[0].total,60);assert.equal(result.total,60);assert.equal(result.subtotal,60);assert.equal(result.status,'pending');
 assert.equal(invoiceDraftTotals(result.items,2,62).status,'paid');
 assert.throws(()=>invoiceDraftTotals([{description:'',quantity:1,unitPrice:0,total:0}],0,0),/actual item/);
 assert.throws(()=>invoiceDraftTotals(result.items,0,61),/cannot exceed/);
 assert.ok(source('src/components/platforms/InvoicesPlatform.tsx').includes('Invoice item ${index+1} description'));
});

test('non-HR/non-finance backups cannot reveal salary payments through linked expense rows',()=>{
 const settings=prefs();for(const role of ['Cashier','Associate'] as const){settings.privileges[role].canManagePeople=false;settings.privileges[role].canViewExpenses=false;}
 const data=JSON.stringify({expenses:[{category:'Salaries',salaryPaymentId:'TEST-pay',amount:600},{category:'Utilities',amount:100}],salaryPayments:[{amount:600}]});
 const filtered=JSON.parse(permittedBackup(data,{id:'TEST',name:'TEST',email:'qa@example.test',roles:['Cashier','Associate'],isAdmin:false},settings));assert.equal(filtered.expenses.length,1);assert.equal(filtered.expenses[0].category,'Utilities');assert.equal(filtered.salaryPayments,undefined);
});
