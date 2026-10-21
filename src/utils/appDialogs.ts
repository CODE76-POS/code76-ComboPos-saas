/**
 * In-app dialog store.
 *
 * Native `window.alert` / `window.confirm` / `window.prompt` can be suppressed by
 * browser or extension notification settings, so every user-facing notice,
 * confirmation and text prompt is rendered by `<DialogHost />` instead.
 *
 * The store is framework-free (no DOM access at module scope) so utilities such
 * as export helpers and Node tests can call it safely.
 */

export type DialogTone = 'info' | 'success' | 'warning' | 'danger';

export interface AlertOptions {
  title?: string;
  message: string;
  tone?: DialogTone;
  confirmLabel?: string;
  /** Optional supporting detail rendered under the message. */
  detail?: string;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  tone?: DialogTone;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Highlights the confirm action as irreversible. */
  destructive?: boolean;
  detail?: string;
}

export interface ChoiceAction {
  id: string;
  label: string;
  tone?: 'primary' | 'neutral' | 'danger' | 'success';
  description?: string;
}

export interface ChoiceOptions {
  title?: string;
  message: string;
  detail?: string;
  tone?: DialogTone;
  actions: ChoiceAction[];
  /** Label for the dismiss action; pass null to force a choice. */
  cancelLabel?: string | null;
}

export interface PromptOptions {
  title?: string;
  message?: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: DialogTone;
  /** Return an error message to block submission, or null when valid. */
  validate?: (value: string) => string | null;
  /** Require a non-empty value. Defaults to false. */
  required?: boolean;
  multiline?: boolean;
}

export interface DialogRequestBase {
  id: string;
  createdAt: number;
}

export type DialogRequest =
  | (DialogRequestBase & { kind: 'alert'; options: AlertOptions })
  | (DialogRequestBase & { kind: 'confirm'; options: ConfirmOptions })
  | (DialogRequestBase & { kind: 'choice'; options: ChoiceOptions })
  | (DialogRequestBase & { kind: 'prompt'; options: PromptOptions });

export interface ToastItem {
  id: string;
  message: string;
  tone: DialogTone;
  durationMs: number;
}

export interface DialogSnapshot {
  queue: DialogRequest[];
  toasts: ToastItem[];
}

type Listener = () => void;
type Resolver = (value: string | boolean | null) => void;

const listeners = new Set<Listener>();
const resolvers = new Map<string, Resolver>();
let sequence = 0;
let snapshot: DialogSnapshot = { queue: [], toasts: [] };
const toastTimers = new Map<string, ReturnType<typeof setTimeout>>();

const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(sequence++).toString(36)}`;

function emit(next: DialogSnapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

export function subscribeToDialogs(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDialogSnapshot(): DialogSnapshot {
  return snapshot;
}

function enqueue(request: DialogRequest): Promise<string | boolean | null> {
  return new Promise((resolve) => {
    resolvers.set(request.id, resolve);
    emit({ ...snapshot, queue: [...snapshot.queue, request] });
  });
}

export const appDialogs = {
  alert(options: AlertOptions | string): Promise<void> {
    const normalized = typeof options === 'string' ? { message: options } : options;
    return enqueue({ id: nextId('alert'), createdAt: Date.now(), kind: 'alert', options: normalized }).then(() => undefined);
  },

  confirm(options: ConfirmOptions | string): Promise<boolean> {
    const normalized = typeof options === 'string' ? { message: options } : options;
    return enqueue({ id: nextId('confirm'), createdAt: Date.now(), kind: 'confirm', options: normalized }) as Promise<boolean>;
  },

  /** Presents labelled actions and resolves with the chosen action id (or null). */
  choice(options: ChoiceOptions): Promise<string | null> {
    return enqueue({ id: nextId('choice'), createdAt: Date.now(), kind: 'choice', options }) as Promise<string | null>;
  },

  prompt(options: PromptOptions | string): Promise<string | null> {
    const normalized = typeof options === 'string' ? { message: options } : options;
    return enqueue({ id: nextId('prompt'), createdAt: Date.now(), kind: 'prompt', options: normalized }) as Promise<string | null>;
  },

  toast(message: string, tone: DialogTone = 'info', durationMs = 4000): string {
    const id = nextId('toast');
    const toast: ToastItem = { id, message, tone, durationMs };
    emit({ ...snapshot, toasts: [...snapshot.toasts, toast] });
    if (durationMs > 0 && typeof setTimeout === 'function') {
      const timer = setTimeout(() => appDialogs.dismissToast(id), durationMs);
      toastTimers.set(id, timer);
    }
    return id;
  },

  dismissToast(id: string) {
    const timer = toastTimers.get(id);
    if (timer) clearTimeout(timer);
    toastTimers.delete(id);
    emit({ ...snapshot, toasts: snapshot.toasts.filter((toast) => toast.id !== id) });
  },

  /** Resolve the active dialog. Values are narrowed by the caller. */
  settle(id: string, value: string | boolean | null) {
    const resolve = resolvers.get(id);
    if (!resolve) return;
    resolvers.delete(id);
    resolve(value);
    emit({ ...snapshot, queue: snapshot.queue.filter((request) => request.id !== id) });
  },

  /** Clears every pending request without resolving it (sign-out / hard reset). */
  reset() {
    resolvers.clear();
    toastTimers.forEach((timer) => clearTimeout(timer));
    toastTimers.clear();
    emit({ queue: [], toasts: [] });
  },
};
