import React from 'react';
import { SECURITY_QUESTIONS, RECOVERY_QUESTION_COUNT, type SecurityDraft } from '../../utils/accounts.ts';

interface SecurityQuestionFieldsProps {
  value: SecurityDraft[];
  onChange: (next: SecurityDraft[]) => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
}

/** Three distinct security questions plus their answers. */
export const SecurityQuestionFields: React.FC<SecurityQuestionFieldsProps> = ({
  value,
  onChange,
  label = 'Account recovery questions',
  hint = 'Choose three questions only you can answer. Answers are stored hashed on this device, never in plain text.',
  disabled = false,
}) => {
  const rows: SecurityDraft[] = Array.from({ length: RECOVERY_QUESTION_COUNT }, (_, index) =>
    value[index] || { questionId: '', answer: '' },
  );

  const update = (index: number, patch: Partial<SecurityDraft>) => {
    const next = rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row));
    onChange(next);
  };

  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="block text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</legend>
      <p className="text-[11px] leading-relaxed text-slate-400">{hint}</p>
      {rows.map((row, index) => {
        const takenElsewhere = new Set(rows.filter((_, i) => i !== index).map((entry) => entry.questionId).filter(Boolean));
        return (
          <div key={index} className="rounded-xl border border-slate-700 bg-slate-800/60 p-3 space-y-2">
            <label className="block text-[11px] font-semibold text-slate-300">
              Question {index + 1}
              <select
                aria-label={`Security question ${index + 1}`}
                required
                value={row.questionId}
                onChange={(event) => update(index, { questionId: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
              >
                <option value="">Choose a question…</option>
                {SECURITY_QUESTIONS.filter((question) => !takenElsewhere.has(question.id)).map((question) => (
                  <option key={question.id} value={question.id}>{question.prompt}</option>
                ))}
              </select>
            </label>
            <label className="block text-[11px] font-semibold text-slate-300">
              Your answer
              <input
                aria-label={`Answer to security question ${index + 1}`}
                type="text"
                required
                autoComplete="off"
                minLength={3}
                maxLength={120}
                value={row.answer}
                onChange={(event) => update(index, { answer: event.target.value })}
                placeholder="Type the answer you will remember"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
              />
            </label>
          </div>
        );
      })}
      <p className="text-[10px] text-slate-500">
        Answers ignore capitals and extra spaces. There is no server copy — if you forget both the password and these answers, only an administrator can reset the login on this device.
      </p>
    </fieldset>
  );
};
