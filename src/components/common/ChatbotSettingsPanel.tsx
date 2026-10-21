import React, { useState } from 'react';
import type { AppSettings, ChatbotSettings } from '../../types/index.ts';
import { CHATBOT_TONES, DEFAULT_CHATBOT_SETTINGS } from '../../config/assistant.ts';
import { appDialogs } from '../../utils/appDialogs.ts';
import { Bot, MessageSquare, Plus, RefreshCw, Send, Trash2 } from 'lucide-react';

interface ChatbotSettingsPanelProps {
  formSettings: AppSettings;
  setFormSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  savedSettings: AppSettings;
  canManage: boolean;
}

const QUICK_PROMPT_LIMIT = 6;

export const ChatbotSettingsPanel: React.FC<ChatbotSettingsPanelProps> = ({ formSettings, setFormSettings, savedSettings, canManage }) => {
  const chatbot: ChatbotSettings = { ...DEFAULT_CHATBOT_SETTINGS, ...formSettings.chatbot };
  const [newPrompt, setNewPrompt] = useState('');

  const update = (patch: Partial<ChatbotSettings>) => {
    setFormSettings((previous) => ({ ...previous, chatbot: { ...DEFAULT_CHATBOT_SETTINGS, ...previous.chatbot, ...patch } }));
  };

  const addPrompt = () => {
    const value = newPrompt.trim();
    if (!value) return;
    if (chatbot.quickPrompts.length >= QUICK_PROMPT_LIMIT) {
      void appDialogs.alert({ title: 'Limit reached', message: `Keep up to ${QUICK_PROMPT_LIMIT} quick prompts so the launcher stays readable on phones.`, tone: 'warning' });
      return;
    }
    update({ quickPrompts: [...chatbot.quickPrompts, value] });
    setNewPrompt('');
  };

  const resetAssistant = async () => {
    const confirmed = await appDialogs.confirm({
      title: 'Reset the business assistant?',
      message: 'Restore the default greeting, tone, quick prompts, fallback message and offline notice.',
      detail: 'Your saved catalogue and customer records are not changed. Press “Save All Settings Changes” afterwards.',
      confirmLabel: 'Reset assistant',
      tone: 'warning',
    });
    if (!confirmed) return;
    update(DEFAULT_CHATBOT_SETTINGS);
    appDialogs.toast('Assistant fields restored — save to apply.', 'info');
  };

  if (!canManage) {
    return (
      <div role="alert" className="rounded-2xl border border-amber-800 bg-amber-950/30 p-5 text-sm text-amber-100">
        <p className="font-bold">Chatbot settings need the “Configure the business chatbot” privilege</p>
        <p className="mt-1 text-amber-200/90">Ask an administrator to grant it in App User Privilege Settings. The assistant still works with the saved configuration.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-100"><Bot className="h-4 w-4 text-teal-400" />Business chatbot & assistant settings</h3>
          <p className="mt-1 max-w-2xl text-xs text-slate-400">This controls the assistant on your private business landing page only. The CODE76 product site has its own separate assistant and content.</p>
        </div>
        <button type="button" onClick={() => void resetAssistant()} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800">
          <RefreshCw className="h-3.5 w-3.5" /> Reset assistant
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-start gap-2 rounded-2xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300">
          <input type="checkbox" checked={chatbot.enabled} onChange={(event) => update({ enabled: event.target.checked })} className="mt-0.5 rounded text-teal-500" />
          <span><strong className="block text-slate-100">Enable the page assistant</strong>Shows the chat launcher on the business page when the plan includes chatbot intelligence.</span>
        </label>
        <label className="flex items-start gap-2 rounded-2xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300">
          <input type="checkbox" checked={chatbot.collectLeads} onChange={(event) => update({ collectLeads: event.target.checked })} className="mt-0.5 rounded text-teal-500" />
          <span><strong className="block text-slate-100">Allow contact capture</strong>Visitors may leave an email in the chat. It is saved to the Customers directory locally.</span>
        </label>
        <label className="flex items-start gap-2 rounded-2xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300">
          <input type="checkbox" checked={chatbot.showPrices} onChange={(event) => update({ showPrices: event.target.checked })} className="mt-0.5 rounded text-teal-500" />
          <span><strong className="block text-slate-100">Quote catalogue prices</strong>Answers may include the selling price saved in Inventory.</span>
        </label>
        <label className="flex items-start gap-2 rounded-2xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300">
          <input type="checkbox" checked={chatbot.showStock} onChange={(event) => update({ showStock: event.target.checked })} className="mt-0.5 rounded text-teal-500" />
          <span><strong className="block text-slate-100">Mention stock levels</strong>Answers may say whether a product is available. Services never show a stock count.</span>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-400">Assistant name
          <input value={chatbot.assistantName} onChange={(event) => update({ assistantName: event.target.value })} maxLength={40} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
        </label>
        <label className="text-xs font-semibold text-slate-400">Handoff contact (phone, email or link)
          <input value={chatbot.handoffContact} onChange={(event) => update({ handoffContact: event.target.value })} placeholder="e.g. +254 700 000 000 or sales@example.com" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
        </label>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-400">Conversation tone</p>
        <div className="mt-1 grid gap-2 sm:grid-cols-3">
          {CHATBOT_TONES.map((tone) => (
            <button
              key={tone.id}
              type="button"
              onClick={() => update({ tone: tone.id })}
              className={`rounded-xl border p-3 text-left text-xs transition ${chatbot.tone === tone.id ? 'border-teal-500 bg-teal-950/30 text-teal-200' : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'}`}
            >
              <span className="block font-bold">{tone.label}</span>
              <span className="mt-0.5 block text-[10px] text-slate-500">{tone.description}</span>
            </button>
          ))}
        </div>
      </div>

      <label className="block text-xs font-semibold text-slate-400">Greeting shown when the chat opens
        <textarea rows={3} value={chatbot.greeting} onChange={(event) => update({ greeting: event.target.value })} maxLength={400} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100" />
        <span className="mt-1 block text-[10px] font-normal text-slate-500">{chatbot.greeting.length}/400 characters</span>
      </label>

      <div>
        <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-400"><MessageSquare className="h-3.5 w-3.5" />Quick prompts ({chatbot.quickPrompts.length}/{QUICK_PROMPT_LIMIT})</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {chatbot.quickPrompts.map((prompt, index) => (
            <span key={`${prompt}-${index}`} className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 text-[11px] text-slate-200">
              {prompt}
              <button type="button" aria-label={`Remove quick prompt ${prompt}`} onClick={() => update({ quickPrompts: chatbot.quickPrompts.filter((_, position) => position !== index) })} className="text-rose-400 hover:text-rose-300">
                <Trash2 className="h-3 w-3" />
              </button>
            </span>
          ))}
          {!chatbot.quickPrompts.length && <span className="text-[11px] text-slate-500">No quick prompts yet. Visitors can still type freely.</span>}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            aria-label="New quick prompt"
            value={newPrompt}
            onChange={(event) => setNewPrompt(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addPrompt(); } }}
            placeholder="e.g. Do you deliver?"
            maxLength={60}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          />
          <button type="button" onClick={addPrompt} className="inline-flex items-center gap-1 rounded-xl bg-teal-700 px-3 py-2 text-xs font-bold text-white hover:bg-teal-600"><Plus className="h-3.5 w-3.5" /> Add</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-400">Fallback message when the answer is not in the catalogue
          <textarea rows={3} value={chatbot.fallbackMessage} onChange={(event) => update({ fallbackMessage: event.target.value })} maxLength={300} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100" />
        </label>
        <label className="text-xs font-semibold text-slate-400">Offline notice (plan without chatbot intelligence)
          <textarea rows={3} value={chatbot.offlineNotice} onChange={(event) => update({ offlineNotice: event.target.value })} maxLength={300} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100" />
        </label>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
        <p className="flex items-center gap-1.5 text-xs font-bold text-slate-200"><Send className="h-4 w-4 text-teal-400" />Preview</p>
        <div className="mt-2 rounded-2xl border border-slate-800 bg-slate-900 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-teal-400">{chatbot.assistantName || 'Business Assistant'} · {chatbot.tone}</p>
          <p className="mt-1 text-sm text-slate-200">{chatbot.greeting || 'No greeting set.'}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {chatbot.quickPrompts.map((prompt) => (
              <span key={`preview-${prompt}`} className="rounded-full border border-teal-800 px-2 py-0.5 text-[10px] text-teal-300">{prompt}</span>
            ))}
          </div>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-slate-500">The assistant answers only from saved catalogue and contact data. It does not invent policies, reserve bookings or complete payments. With no server AI key it uses the local catalogue reply engine and says so.</p>
      </div>

      <p className="text-[10px] text-slate-500">
        Unsaved: {JSON.stringify(savedSettings.chatbot || {}) === JSON.stringify(formSettings.chatbot || {}) ? 'no changes' : 'changes pending — press Save All Settings Changes below.'}
      </p>
    </div>
  );
};
