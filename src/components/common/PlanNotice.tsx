import React from 'react';
import { Lock } from 'lucide-react';
import { usePOS } from '../../context/POSContext.tsx';
import { PLAN_INFO, planTier } from '../../utils/plans.ts';
export function PlanNotice({ feature = 'This feature' }: { feature?: string }) {
  const { settings, setSettingsSection, setActivePlatform, currentUser } = usePOS();
  return <section className="max-w-2xl mx-auto my-10 rounded-2xl border border-teal-800 bg-slate-900 p-7 text-center" role="status"><Lock className="mx-auto text-teal-400 mb-3"/><h1 className="text-xl font-bold">{feature} is not included in {PLAN_INFO[planTier(settings)].name}</h1><p className="mt-3 text-sm text-slate-400">Your records are preserved. Plan permissions and user-role privileges both apply. This workspace uses demo entitlements, not paid billing.</p>{currentUser?.isAdmin ? <button className="mt-5 rounded-xl bg-teal-700 px-4 py-2 text-sm font-bold text-white" onClick={()=>{setSettingsSection('plans');setActivePlatform('settings');}}>View demo plans</button> : <p className="mt-4 text-xs text-slate-400">Ask an administrator to select another demo plan.</p>}</section>;
}
