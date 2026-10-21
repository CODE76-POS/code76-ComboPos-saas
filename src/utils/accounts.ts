/**
 * Local multi-business account store for the CODE76 POS prototype.
 *
 * Every registered business is its own workspace. The person who registers the
 * business becomes that workspace's administrator; staff logins are created by
 * the administrator against a company-member record. Credentials never leave
 * this browser, which keeps the prototype honest but also means this is NOT
 * server-grade authentication — the UI says so.
 */
import type { PlanTier, UserRole } from '../types/index.ts';

export const ACCOUNTS_STORAGE_KEY = 'code76_pos_accounts_v2';
export const LEGACY_USERS_KEY = 'code76_pos_registered_users_v1';
export const WORKSPACE_STATE_PREFIX = 'code76_pos_ws_';
export const ACTIVE_WORKSPACE_KEY = 'code76_pos_active_workspace';
export const LEGACY_STATE_KEY = 'code76_pos_state_v1';
export const DEFAULT_WORKSPACE_ID = 'ws-code76-demo';

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface SecurityQuestion {
  id: string;
  prompt: string;
}

export const SECURITY_QUESTIONS: SecurityQuestion[] = [
  { id: 'birth-city', prompt: 'What city were you born in?' },
  { id: 'first-school', prompt: 'What was the name of your first school?' },
  { id: 'childhood-nickname', prompt: 'What was your childhood nickname?' },
  { id: 'first-pet', prompt: 'What was the name of your first pet?' },
  { id: 'favourite-teacher', prompt: 'What was your favourite teacher’s surname?' },
  { id: 'mother-maiden', prompt: 'What is your mother’s maiden name?' },
  { id: 'first-employer', prompt: 'What was your first employer’s name?' },
  { id: 'favourite-meal', prompt: 'What is your favourite home-cooked meal?' },
  { id: 'first-vehicle', prompt: 'What was your first vehicle’s make or model?' },
  { id: 'oldest-friend', prompt: 'What is the first name of your oldest friend?' },
  { id: 'childhood-street', prompt: 'What street did you grow up on?' },
  { id: 'first-phone', prompt: 'What was the brand of your first phone?' },
];

export const SECURITY_QUESTION_BY_ID: Record<string, SecurityQuestion> = Object.fromEntries(
  SECURITY_QUESTIONS.map((question) => [question.id, question]),
);

/** Stored answer: only the salted hash and the chosen question are persisted. */
export interface SecurityAnswer {
  questionId: string;
  answerHash: string;
}

export interface AccountRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  /** Answers use a separate salt so resetting the password never breaks recovery. */
  answerSalt: string;
  workspaceId: string;
  isAdmin: boolean;
  roles: [UserRole, UserRole];
  security: SecurityAnswer[];
  memberId?: string;
  createdAt: string;
  lastLoginAt?: string;
  failedAttempts?: number;
  lockedUntil?: number;
}

export interface WorkspaceRecord {
  id: string;
  companyName: string;
  ownerEmail: string;
  createdAt: string;
  planTier: PlanTier;
  isDemo?: boolean;
}

export interface AccountStore {
  version: 2;
  workspaces: Record<string, WorkspaceRecord>;
  accounts: Record<string, AccountRecord>;
}

export interface SecurityDraft {
  questionId: string;
  answer: string;
}

export interface BusinessRegistrationInput {
  companyName: string;
  adminName: string;
  email: string;
  password: string;
  security: SecurityDraft[];
}

export interface TeamLoginInput {
  workspaceId: string;
  memberId: string;
  memberName: string;
  email: string;
  password: string;
  roles: [UserRole, UserRole];
  security: SecurityDraft[];
}

export interface TeamLoginUpdate {
  name?: string;
  password?: string;
  roles?: [UserRole, UserRole];
  security?: SecurityDraft[];
  memberId?: string;
}

export interface RecoveryProfile {
  email: string;
  name: string;
  workspaceId: string;
  companyName: string;
  questions: SecurityQuestion[];
}

export const MIN_PASSWORD_LENGTH = 6;
export const RECOVERY_QUESTION_COUNT = 3;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MS = 5 * 60 * 1000;

const emptyStore = (): AccountStore => ({ version: 2, workspaces: {}, accounts: {} });

/* ------------------------------------------------------------------ */
/* Hashing                                                             */
/* ------------------------------------------------------------------ */

const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

const rotr = (value: number, shift: number) => (value >>> shift) | (value << (32 - shift));

/** Small synchronous SHA-256 so lookups stay synchronous inside the app. */
export function sha256Hex(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const bitLength = bytes.length * 8;
  const paddedLength = (((bytes.length + 9) + 63) >> 6) << 6;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000));
  view.setUint32(paddedLength - 4, bitLength >>> 0);

  let [h0, h1, h2, h3, h4, h5, h6, h7] = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const w = new Uint32Array(64);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      w[index] = view.getUint32(offset + index * 4);
    }
    for (let index = 16; index < 64; index += 1) {
      const s0 = rotr(w[index - 15], 7) ^ rotr(w[index - 15], 18) ^ (w[index - 15] >>> 3);
      const s1 = rotr(w[index - 2], 17) ^ rotr(w[index - 2], 19) ^ (w[index - 2] >>> 10);
      w[index] = (w[index - 16] + s0 + w[index - 7] + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = [h0, h1, h2, h3, h4, h5, h6, h7];
    for (let index = 0; index < 64; index += 1) {
      const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + SHA256_K[index] + w[index]) >>> 0;
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;
      h = g; g = f; f = e;
      e = (d + temp1) >>> 0;
      d = c; c = b; b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((value) => (value >>> 0).toString(16).padStart(8, '0'))
    .join('');
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function hashPassword(password: string, salt: string): string {
  return sha256Hex(`${salt}:password:${password}`);
}

export function hashAnswer(answer: string, salt: string): string {
  return sha256Hex(`${salt}:answer:${normalizeAnswer(answer)}`);
}

export function createSalt(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `salt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

export const isEmailLike = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

export function validateSecurityDrafts(security: SecurityDraft[]): string | null {
  if (!Array.isArray(security) || security.length !== RECOVERY_QUESTION_COUNT) {
    return `Choose exactly ${RECOVERY_QUESTION_COUNT} security questions.`;
  }
  const ids = new Set<string>();
  for (const entry of security) {
    if (!SECURITY_QUESTION_BY_ID[entry.questionId]) return 'Choose a security question from the list.';
    if (ids.has(entry.questionId)) return 'Each security question can be used only once.';
    ids.add(entry.questionId);
    if (normalizeAnswer(entry.answer).length < 3) return 'Each security answer needs at least 3 characters.';
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return `Use a password with at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

export function buildSecurityAnswers(security: SecurityDraft[], salt: string): SecurityAnswer[] {
  return security.map((entry) => ({
    questionId: entry.questionId,
    answerHash: hashAnswer(entry.answer, salt),
  }));
}

/* ------------------------------------------------------------------ */
/* Storage                                                             */
/* ------------------------------------------------------------------ */

export function readStore(storage: StorageLike | undefined = typeof localStorage === 'undefined' ? undefined : localStorage): AccountStore {
  if (!storage) return emptyStore();
  try {
    const raw = storage.getItem(ACCOUNTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AccountStore;
      if (parsed && parsed.version === 2 && parsed.accounts && parsed.workspaces) return parsed;
    }
  } catch (error) {
    console.warn('Unable to read the local account store', error);
  }
  return emptyStore();
}

export function writeStore(store: AccountStore, storage: StorageLike | undefined = typeof localStorage === 'undefined' ? undefined : localStorage): void {
  if (!storage) return;
  try {
    storage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    console.warn('Unable to save the local account store', error);
  }
}

export function workspaceStateKey(workspaceId: string): string {
  return `${WORKSPACE_STATE_PREFIX}${workspaceId}`;
}

export function readActiveWorkspaceId(storage: StorageLike | undefined = typeof localStorage === 'undefined' ? undefined : localStorage): string | null {
  try {
    return storage?.getItem(ACTIVE_WORKSPACE_KEY) || null;
  } catch {
    return null;
  }
}

export function writeActiveWorkspaceId(workspaceId: string, storage: StorageLike | undefined = typeof localStorage === 'undefined' ? undefined : localStorage): void {
  try {
    storage?.setItem(ACTIVE_WORKSPACE_KEY, workspaceId);
  } catch (error) {
    console.warn('Unable to remember the active workspace', error);
  }
}

export function readWorkspaceData(workspaceId: string, storage: StorageLike | undefined = typeof localStorage === 'undefined' ? undefined : localStorage): Record<string, unknown> | null {
  try {
    const raw = storage?.getItem(workspaceStateKey(workspaceId));
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
  } catch (error) {
    console.warn('Unable to read a saved workspace', error);
    return null;
  }
}

export function writeWorkspaceData(workspaceId: string, data: unknown, storage: StorageLike | undefined = typeof localStorage === 'undefined' ? undefined : localStorage): void {
  try {
    storage?.setItem(workspaceStateKey(workspaceId), JSON.stringify(data));
  } catch (error) {
    console.warn('Unable to save this workspace', error);
  }
}

/* ------------------------------------------------------------------ */
/* Registration and sign-in                                            */
/* ------------------------------------------------------------------ */

export interface AccountResult<T = undefined> {
  success: boolean;
  message: string;
  value?: T;
}

const DEMO_WORKSPACE: WorkspaceRecord = {
  id: DEFAULT_WORKSPACE_ID,
  companyName: 'CODE76 Demo Business',
  ownerEmail: 'code76pos@gmail.com',
  createdAt: '2026-01-01T00:00:00.000Z',
  planTier: 'max',
  isDemo: true,
};

const DEMO_ACCOUNTS: Array<[string, string, string, [UserRole, UserRole], boolean]> = [
  ['code76pos@gmail.com', '7676', 'Lead Developer Admin', ['CEO', 'Developer'], true],
  ['admin@code76.com', 'admin123', 'System Administrator', ['Manager', 'Associate'], true],
  ['sarah.k@code76.com', 'password123', 'Sarah Kiprono', ['Cashier', 'Associate'], false],
  ['samuel.m@code76.com', 'password123', 'Samuel Mwangi', ['Manager', 'Developer'], true],
  ['david.k@code76.com', 'password123', 'Dr. David Kimani', ['CEO', 'Director'], true],
];

/**
 * Seeds the demo workspace once and migrates accounts created by the older
 * single-tenant build so existing local demo logins keep working.
 */
export function ensureAccountStore(storage: StorageLike | undefined = typeof localStorage === 'undefined' ? undefined : localStorage): AccountStore {
  const store = readStore(storage);
  let changed = false;

  if (!store.workspaces[DEMO_WORKSPACE.id]) {
    store.workspaces[DEMO_WORKSPACE.id] = { ...DEMO_WORKSPACE };
    changed = true;
  }

  for (const [email, password, name, roles, isAdmin] of DEMO_ACCOUNTS) {
    if (!store.accounts[email]) {
      const salt = createSalt();
      store.accounts[email] = {
        id: `acct-${email.replace(/[^a-z0-9]+/gi, '-')}`,
        email,
        name,
        passwordHash: hashPassword(password, salt),
        salt,
        answerSalt: createSalt(),
        workspaceId: DEFAULT_WORKSPACE_ID,
        isAdmin,
        roles,
        security: [],
        createdAt: '2026-01-01T00:00:00.000Z',
      };
      changed = true;
    }
  }

  try {
    const legacyRaw = storage?.getItem(LEGACY_USERS_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw) as Record<string, { name: string; password: string; roles: [UserRole, UserRole]; isAdmin: boolean }>;
      for (const [rawEmail, record] of Object.entries(legacy)) {
        const email = normalizeEmail(rawEmail);
        if (!email || store.accounts[email]) continue;
        const salt = createSalt();
        store.accounts[email] = {
          id: `acct-${email.replace(/[^a-z0-9]+/gi, '-')}`,
          email,
          name: record.name || email.split('@')[0],
          passwordHash: hashPassword(String(record.password || ''), salt),
          salt,
          answerSalt: createSalt(),
          workspaceId: DEFAULT_WORKSPACE_ID,
          isAdmin: Boolean(record.isAdmin),
          roles: record.roles || ['Associate', 'Other'],
          security: [],
          createdAt: new Date().toISOString(),
        };
        changed = true;
      }
    }
  } catch (error) {
    console.warn('Unable to migrate legacy local accounts', error);
  }

  // One-time adoption of a snapshot written by the older single-business build.
  if (Object.keys(store.workspaces).length === 1 && storage && !storage.getItem(workspaceStateKey(DEFAULT_WORKSPACE_ID))) {
    try {
      const legacy = storage.getItem(LEGACY_STATE_KEY);
      if (legacy) storage.setItem(workspaceStateKey(DEFAULT_WORKSPACE_ID), legacy);
    } catch { /* ignore malformed legacy data */ }
  }

  if (changed) writeStore(store, storage);
  return store;
}

export function findAccount(store: AccountStore, email: string): AccountRecord | undefined {
  return store.accounts[normalizeEmail(email)];
}

export function workspaceCompanyName(store: AccountStore, workspaceId: string): string {
  return store.workspaces[workspaceId]?.companyName || 'Business workspace';
}

export function registerBusiness(input: BusinessRegistrationInput, storage?: StorageLike): AccountResult<{ account: AccountRecord; workspace: WorkspaceRecord }> {
  const store = ensureAccountStore(storage);
  const email = normalizeEmail(input.email);
  const companyName = input.companyName.trim();
  const adminName = input.adminName.trim();

  if (!companyName) return { success: false, message: 'Enter the business name that will own this workspace.' };
  if (!adminName) return { success: false, message: 'Enter the administrator’s full name.' };
  if (!isEmailLike(email)) return { success: false, message: 'Enter a valid email address for the administrator login.' };
  if (store.accounts[email]) {
    return { success: false, message: 'An account with this email already exists. Sign in instead, or use a different email.' };
  }
  const passwordError = validatePassword(input.password);
  if (passwordError) return { success: false, message: passwordError };
  const securityError = validateSecurityDrafts(input.security);
  if (securityError) return { success: false, message: securityError };

  const workspace: WorkspaceRecord = {
    id: `ws-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    companyName,
    ownerEmail: email,
    createdAt: new Date().toISOString(),
    planTier: 'pro',
  };
  const salt = createSalt();
  const answerSalt = createSalt();
  const account: AccountRecord = {
    id: `acct-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email,
    name: adminName,
    passwordHash: hashPassword(input.password, salt),
    salt,
    answerSalt,
    workspaceId: workspace.id,
    isAdmin: true,
    roles: ['CEO', 'Developer'],
    security: buildSecurityAnswers(input.security, answerSalt),
    createdAt: workspace.createdAt,
  };

  store.workspaces[workspace.id] = workspace;
  store.accounts[email] = account;
  writeStore(store, storage);
  return { success: true, message: `${companyName} workspace created. ${adminName} is the administrator.`, value: { account, workspace } };
}

export function createTeamAccount(input: TeamLoginInput, storage?: StorageLike): AccountResult<AccountRecord> {
  const store = ensureAccountStore(storage);
  const email = normalizeEmail(input.email);
  if (!store.workspaces[input.workspaceId]) return { success: false, message: 'This workspace no longer exists.' };
  if (!input.memberName.trim()) return { success: false, message: 'Choose the company member who will use this login.' };
  if (!isEmailLike(email)) return { success: false, message: 'Enter a valid email address for this team member.' };
  if (store.accounts[email]) return { success: false, message: 'That email already has a login. Each person needs a unique email address.' };
  const passwordError = validatePassword(input.password);
  if (passwordError) return { success: false, message: passwordError };
  const securityError = validateSecurityDrafts(input.security);
  if (securityError) return { success: false, message: securityError };

  const salt = createSalt();
  const answerSalt = createSalt();
  const account: AccountRecord = {
    id: `acct-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email,
    name: input.memberName.trim(),
    passwordHash: hashPassword(input.password, salt),
    salt,
    answerSalt,
    workspaceId: input.workspaceId,
    isAdmin: false,
    roles: input.roles,
    memberId: input.memberId,
    security: buildSecurityAnswers(input.security, answerSalt),
    createdAt: new Date().toISOString(),
  };
  store.accounts[email] = account;
  writeStore(store, storage);
  return { success: true, message: `Login created for ${account.name}. They can only open ${workspaceCompanyName(store, input.workspaceId)} data.`, value: account };
}

export function updateTeamAccount(email: string, update: TeamLoginUpdate, storage?: StorageLike): AccountResult<AccountRecord> {
  const store = ensureAccountStore(storage);
  const key = normalizeEmail(email);
  const account = store.accounts[key];
  if (!account) return { success: false, message: 'No login exists for that email.' };

  if (update.password !== undefined) {
    const passwordError = validatePassword(update.password);
    if (passwordError) return { success: false, message: passwordError };
    account.salt = createSalt();
    account.passwordHash = hashPassword(update.password, account.salt);
    account.failedAttempts = 0;
    delete account.lockedUntil;
  }
  if (update.security) {
    const securityError = validateSecurityDrafts(update.security);
    if (securityError) return { success: false, message: securityError };
    account.security = buildSecurityAnswers(update.security, account.answerSalt || account.salt);
  }
  if (update.roles) account.roles = update.roles;
  if (update.name) account.name = update.name.trim();
  if (update.memberId) account.memberId = update.memberId;

  store.accounts[key] = account;
  writeStore(store, storage);
  return { success: true, message: `Login updated for ${account.name}.`, value: account };
}

export function removeTeamAccount(email: string, storage?: StorageLike): AccountResult {
  const store = ensureAccountStore(storage);
  const key = normalizeEmail(email);
  const account = store.accounts[key];
  if (!account) return { success: false, message: 'No login exists for that email.' };
  if (account.isAdmin && store.workspaces[account.workspaceId]?.ownerEmail === key) {
    return { success: false, message: 'The business administrator login cannot be deleted. Transfer ownership first.' };
  }
  delete store.accounts[key];
  writeStore(store, storage);
  return { success: true, message: `${account.name} can no longer sign in. Historical records stay in the workspace.` };
}

export function authenticate(email: string, password: string, storage?: StorageLike, now = Date.now()): AccountResult<AccountRecord> {
  const store = ensureAccountStore(storage);
  const key = normalizeEmail(email);
  const account = store.accounts[key];
  if (!account) return { success: false, message: 'No local account matches that email. Check the address or create a business account.' };
  if (account.lockedUntil && account.lockedUntil > now) {
    const minutes = Math.max(1, Math.ceil((account.lockedUntil - now) / 60000));
    return { success: false, message: `Too many failed attempts. Try again in about ${minutes} minute(s).` };
  }
  if (hashPassword(password, account.salt) !== account.passwordHash) {
    account.failedAttempts = (account.failedAttempts || 0) + 1;
    if (account.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      account.failedAttempts = 0;
      account.lockedUntil = now + LOCK_MS;
      writeStore(store, storage);
      return { success: false, message: 'Too many failed attempts. This login is paused for 5 minutes.' };
    }
    writeStore(store, storage);
    return { success: false, message: 'Incorrect password for this account. Check the password or use “Forgot password?”.' };
  }
  account.failedAttempts = 0;
  delete account.lockedUntil;
  account.lastLoginAt = new Date(now).toISOString();
  writeStore(store, storage);
  return { success: true, message: `Welcome back, ${account.name}.`, value: account };
}

/* ------------------------------------------------------------------ */
/* Recovery                                                            */
/* ------------------------------------------------------------------ */

/** Finds a local account by email, or by business name + person's name. */
export function findRecoveryProfile(query: string, companyName = '', storage?: StorageLike): AccountResult<RecoveryProfile> {
  const store = ensureAccountStore(storage);
  const email = normalizeEmail(query);
  let account: AccountRecord | undefined;

  if (isEmailLike(email)) {
    account = store.accounts[email];
  } else if (query.trim().length >= 2) {
    const wanted = query.trim().toLowerCase();
    const company = companyName.trim().toLowerCase();
    account = Object.values(store.accounts).find((candidate) =>
      candidate.name.trim().toLowerCase() === wanted
      && (!company || workspaceCompanyName(store, candidate.workspaceId).toLowerCase() === company),
    );
  }

  if (!account) {
    return { success: false, message: 'No local account matches those details. Check the spelling, or ask your administrator.' };
  }
  if (!account.security.length) {
    return { success: false, message: 'This account has no recovery questions yet. Ask an administrator to set them in Settings → Team access.' };
  }
  return {
    success: true,
    message: `Account found for ${account.name}.`,
    value: {
      email: account.email,
      name: account.name,
      workspaceId: account.workspaceId,
      companyName: workspaceCompanyName(store, account.workspaceId),
      questions: account.security.map((entry) => SECURITY_QUESTION_BY_ID[entry.questionId]).filter(Boolean),
    },
  };
}

export function verifyRecoveryAnswers(email: string, answers: Record<string, string>, storage?: StorageLike): boolean {
  const store = ensureAccountStore(storage);
  const account = store.accounts[normalizeEmail(email)];
  if (!account || !account.security.length) return false;
  const salt = account.answerSalt || account.salt;
  return account.security.every((entry) => {
    const provided = answers[entry.questionId];
    return typeof provided === 'string' && provided.trim().length > 0
      && hashAnswer(provided, salt) === entry.answerHash;
  });
}

export function resetPasswordWithRecovery(
  email: string,
  answers: Record<string, string>,
  newPassword: string,
  storage?: StorageLike,
): AccountResult<AccountRecord> {
  const store = ensureAccountStore(storage);
  const account = store.accounts[normalizeEmail(email)];
  if (!account) return { success: false, message: 'No local account matches that email.' };
  if (!verifyRecoveryAnswers(email, answers, storage)) {
    return { success: false, message: 'One or more security answers did not match. Nothing was changed.' };
  }
  const passwordError = validatePassword(newPassword);
  if (passwordError) return { success: false, message: passwordError };
  account.salt = createSalt();
  account.passwordHash = hashPassword(newPassword, account.salt);
  store.accounts[account.email] = account;
  writeStore(store, storage);
  return { success: true, message: `Password reset for ${account.email}. You can sign in now.`, value: account };
}
