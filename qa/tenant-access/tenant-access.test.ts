import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ACCOUNTS_STORAGE_KEY,
  ACTIVE_WORKSPACE_KEY,
  SECURITY_QUESTIONS,
  authenticate,
  createTeamAccount,
  ensureAccountStore,
  findRecoveryProfile,
  readActiveWorkspaceId,
  readStore,
  readWorkspaceData,
  registerBusiness,
  removeTeamAccount,
  resetPasswordWithRecovery,
  sha256Hex,
  updateTeamAccount,
  verifyRecoveryAnswers,
  workspaceStateKey,
  writeActiveWorkspaceId,
  writeStore,
  writeWorkspaceData,
  type BusinessRegistrationInput,
  type StorageLike,
} from '../../src/utils/accounts.ts';

const source = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

class MemoryStorage implements StorageLike {
  private data = new Map<string, string>();
  getItem(key: string) { return this.data.has(key) ? this.data.get(key)! : null; }
  setItem(key: string, value: string) { this.data.set(key, String(value)); }
  removeItem(key: string) { this.data.delete(key); }
  clear() { this.data.clear(); }
  keys() { return [...this.data.keys()]; }
}

const security = (offset = 0) => [
  { questionId: SECURITY_QUESTIONS[offset].id, answer: 'Nairobi' },
];

const business = (patch: Partial<BusinessRegistrationInput> = {}): BusinessRegistrationInput => ({
  companyName: 'Wanjiku Hardware',
  adminName: 'Mary Wanjiku',
  email: 'mary@wanjiku.test',
  password: 'hardware2026',
  security: security(),
  ...patch,
});

test('SHA-256 hashing matches published vectors', () => {
  assert.equal(sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(sha256Hex(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
});

test('registering a business creates its own workspace and administrator', () => {
  const storage = new MemoryStorage();
  const result = registerBusiness(business(), storage);
  assert.equal(result.success, true);
  const { account, workspace } = result.value!;
  assert.equal(account.isAdmin, true);
  assert.equal(account.workspaceId, workspace.id);
  assert.equal(workspace.companyName, 'Wanjiku Hardware');
  assert.equal(workspace.ownerEmail, 'mary@wanjiku.test');
  assert.equal(account.security.length, 1);
  assert.ok(account.passwordHash && account.passwordHash !== 'hardware2026');
  assert.ok(!JSON.stringify(account).includes('hardware2026'), 'plaintext password is never stored');
  assert.ok(!JSON.stringify(account).includes('Nairobi'), 'plaintext answers are never stored');
  const store = readStore(storage);
  assert.equal(store.workspaces[workspace.id].ownerEmail, 'mary@wanjiku.test');
});

test('one email cannot join two businesses and weak registrations are rejected', () => {
  const storage = new MemoryStorage();
  assert.equal(registerBusiness(business(), storage).success, true);
  assert.equal(registerBusiness(business({ companyName: 'Other Shop' }), storage).success, false);
  assert.match(registerBusiness(business({ email: 'new@shop.test', password: '123' }), storage).message, /at least 6/);
  assert.match(registerBusiness(business({ email: 'new2@shop.test', security: [{ questionId: SECURITY_QUESTIONS[0].id, answer: '   ' }] }), storage).message, /at least 3/);
  assert.match(registerBusiness(business({ email: 'new3@shop.test', security: [{ questionId: 'not-a-question', answer: 'Nairobi' }] }), storage).message, /from the list/);
  assert.match(registerBusiness(business({ email: 'new4@shop.test', security: [security()[0], security(1)[0]] }), storage).message, /Choose one security question/);
  assert.match(registerBusiness(business({ email: 'not-an-email' }), storage).message, /valid email/);
});

test('sign-in only resolves the account and its own workspace', () => {
  const storage = new MemoryStorage();
  const first = registerBusiness(business(), storage).value!;
  const second = registerBusiness(business({ companyName: 'Achieng Salon', adminName: 'Grace Achieng', email: 'grace@achieng.test' }), storage).value!;
  assert.notEqual(first.workspace.id, second.workspace.id);

  const ok = authenticate('mary@wanjiku.test', 'hardware2026', storage);
  assert.equal(ok.success, true);
  assert.equal(ok.value!.workspaceId, first.workspace.id);

  const other = authenticate('grace@achieng.test', 'hardware2026', storage);
  assert.equal(other.value!.workspaceId, second.workspace.id);

  const wrong = authenticate('mary@wanjiku.test', 'not-the-password', storage);
  assert.equal(wrong.success, false);
});

test('repeated wrong passwords pause the login instead of leaking which field failed', () => {
  const storage = new MemoryStorage();
  registerBusiness(business(), storage);
  let last = '';
  for (let attempt = 0; attempt < 5; attempt += 1) {
    last = authenticate('mary@wanjiku.test', `wrong-${attempt}`, storage, 1_000).message;
  }
  assert.match(last, /paused for 5 minutes/);
  assert.equal(authenticate('mary@wanjiku.test', 'hardware2026', storage, 2_000).success, false);
  assert.equal(authenticate('mary@wanjiku.test', 'hardware2026', storage, 1_000 + 5 * 60 * 1000 + 1).success, true);
});

test('team logins are attached to company members inside the same workspace', () => {
  const storage = new MemoryStorage();
  const workspace = registerBusiness(business(), storage).value!.workspace;
  const created = createTeamAccount({
    workspaceId: workspace.id,
    memberId: 'member-1',
    memberName: 'Peter Mwangi',
    email: 'peter@wanjiku.test',
    password: 'counter2026',
    roles: ['Cashier', 'Associate'],
    security: security(2),
  }, storage);
  assert.equal(created.success, true);
  assert.equal(created.value!.isAdmin, false);
  assert.equal(created.value!.workspaceId, workspace.id);
  assert.equal(created.value!.memberId, 'member-1');

  const store = readStore(storage);
  const scoped = Object.values(store.accounts).filter((account) => account.workspaceId === workspace.id);
  assert.equal(scoped.length, 2);
  assert.equal(scoped.filter((account) => account.isAdmin).length, 1);

  const duplicate = createTeamAccount({
    workspaceId: workspace.id, memberId: 'member-2', memberName: 'Someone Else',
    email: 'peter@wanjiku.test', password: 'another2026', roles: ['Cashier', 'Associate'], security: security(4),
  }, storage);
  assert.equal(duplicate.success, false);
  assert.match(duplicate.message, /already has a login/);
});

test('security questions recover the username and reset the password', () => {
  const storage = new MemoryStorage();
  registerBusiness(business(), storage);

  const profile = findRecoveryProfile('mary@wanjiku.test', '', storage);
  assert.equal(profile.success, true);
  assert.equal(profile.value!.email, 'mary@wanjiku.test');
  assert.equal(profile.value!.questions.length, 1);

  const byName = findRecoveryProfile('Mary Wanjiku', 'Wanjiku Hardware', storage);
  assert.equal(byName.success, true);
  assert.equal(byName.value!.companyName, 'Wanjiku Hardware');
  assert.equal(findRecoveryProfile('Mary Wanjiku', 'Another Business', storage).success, false);

  const answers: Record<string, string> = {};
  for (const entry of security()) answers[entry.questionId] = entry.answer;
  assert.equal(Object.keys(answers).length, 1);
  assert.equal(verifyRecoveryAnswers('mary@wanjiku.test', answers, storage), true);
  assert.equal(verifyRecoveryAnswers('mary@wanjiku.test', { ...answers, [SECURITY_QUESTIONS[0].id]: 'Mombasa' }, storage), false);

  // Capitalisation and extra spaces are ignored.
  const messy = Object.fromEntries(Object.entries(answers).map(([key, value]) => [key, `  ${value.toUpperCase()}  `]));
  assert.equal(verifyRecoveryAnswers('mary@wanjiku.test', messy, storage), true);

  const reset = resetPasswordWithRecovery('mary@wanjiku.test', answers, 'new-password-2026', storage);
  assert.equal(reset.success, true);
  assert.equal(authenticate('mary@wanjiku.test', 'hardware2026', storage).success, false);
  assert.equal(authenticate('mary@wanjiku.test', 'new-password-2026', storage).success, true);
  // Recovery keeps working after the password salt changes.
  assert.equal(verifyRecoveryAnswers('mary@wanjiku.test', answers, storage), true);
  assert.equal(verifyRecoveryAnswers('mary@wanjiku.test', {}, storage), false);
  assert.equal(resetPasswordWithRecovery('mary@wanjiku.test', {}, 'another-pass', storage).success, false);
});

test('business administrator cannot be removed but staff logins can', () => {
  const storage = new MemoryStorage();
  const workspace = registerBusiness(business(), storage).value!.workspace;
  createTeamAccount({
    workspaceId: workspace.id, memberId: 'member-1', memberName: 'Peter Mwangi',
    email: 'peter@wanjiku.test', password: 'counter2026', roles: ['Cashier', 'Associate'], security: security(2),
  }, storage);
  assert.equal(removeTeamAccount('mary@wanjiku.test', storage).success, false);
  assert.equal(removeTeamAccount('peter@wanjiku.test', storage).success, true);
  assert.equal(authenticate('peter@wanjiku.test', 'counter2026', storage).success, false);
});

test('password and recovery updates require fresh answers and keep the workspace', () => {
  const storage = new MemoryStorage();
  const workspace = registerBusiness(business(), storage).value!.workspace;
  createTeamAccount({
    workspaceId: workspace.id, memberId: 'member-1', memberName: 'Peter Mwangi',
    email: 'peter@wanjiku.test', password: 'counter2026', roles: ['Cashier', 'Associate'], security: security(2),
  }, storage);

  const updated = updateTeamAccount('peter@wanjiku.test', { password: 'til2027', roles: ['Supervisor', 'Cashier'], security: security(5) }, storage);
  assert.equal(updated.success, true);
  const account = authenticate('peter@wanjiku.test', 'til2027', storage).value!;
  assert.equal(account.workspaceId, workspace.id);
  assert.deepEqual(account.roles, ['Supervisor', 'Cashier']);
  assert.equal(updateTeamAccount('peter@wanjiku.test', { password: '123' }, storage).success, false);
});

test('workspace storage keys keep each business dataset separate', () => {
  const storage = new MemoryStorage();
  writeWorkspaceData('ws-one', { company: { name: 'One' } }, storage);
  writeWorkspaceData('ws-two', { company: { name: 'Two' } }, storage);
  writeActiveWorkspaceId('ws-two', storage);
  assert.notEqual(workspaceStateKey('ws-one'), workspaceStateKey('ws-two'));
  assert.equal((readWorkspaceData('ws-one', storage) as any).company.name, 'One');
  assert.equal((readWorkspaceData('ws-two', storage) as any).company.name, 'Two');
  assert.equal(readActiveWorkspaceId(storage), 'ws-two');
});

test('legacy single-tenant accounts migrate into the demo workspace once', () => {
  const storage = new MemoryStorage();
  storage.setItem('code76_pos_registered_users_v1', JSON.stringify({
    'legacy@shop.test': { name: 'Legacy Owner', password: 'legacy-pass', roles: ['Manager', 'Associate'], isAdmin: false },
  }));
  const store = ensureAccountStore(storage);
  assert.ok(storage.getItem(ACCOUNTS_STORAGE_KEY));
  const legacy = store.accounts['legacy@shop.test'];
  assert.ok(legacy);
  assert.equal(legacy.isAdmin, false);
  assert.ok(legacy.passwordHash !== 'legacy-pass');
  assert.equal(authenticate('legacy@shop.test', 'legacy-pass', storage).success, true);
  assert.equal(authenticate('legacy@shop.test', 'wrong', storage).success, false);
  // Running again must not duplicate or reset the migrated record.
  const salt = store.accounts['legacy@shop.test'].salt;
  assert.equal(ensureAccountStore(storage).accounts['legacy@shop.test'].salt, salt);
});

test('older three-question accounts keep their first question after the switch to one', () => {
  const storage = new MemoryStorage();
  const registered = registerBusiness(business(), storage).value!;
  const store = readStore(storage);
  const account = store.accounts[registered.account.email];
  const base = account.security[0];
  account.security = [
    base,
    { questionId: SECURITY_QUESTIONS[3].id, answerHash: base.answerHash },
    { questionId: SECURITY_QUESTIONS[5].id, answerHash: base.answerHash },
  ];
  writeStore(store, storage);

  const migrated = ensureAccountStore(storage).accounts[registered.account.email];
  assert.equal(migrated.security.length, 1);
  assert.equal(migrated.security[0].questionId, base.questionId);
  // The retained first question still works for recovery.
  assert.equal(verifyRecoveryAnswers(registered.account.email, { [base.questionId]: 'Nairobi' }, storage), true);
});

test('the store persists accounts keyed by normalised email', () => {
  const storage = new MemoryStorage();
  registerBusiness(business({ email: 'Mary@Wanjiku.TEST' }), storage);
  const store = readStore(storage);
  assert.ok(store.accounts['mary@wanjiku.test']);
  assert.equal(writeStore(store, storage), undefined);
  assert.ok(storage.getItem(ACTIVE_WORKSPACE_KEY) === null || typeof storage.getItem(ACTIVE_WORKSPACE_KEY) === 'string');
});

test('sign-in dialog exposes registration, team access and recovery wiring', () => {
  const login = source('src/components/modals/LoginModal.tsx');
  assert.ok(login.includes('Forgot password or email?'));
  assert.ok(login.includes('Business name'));
  assert.ok(login.includes('SecurityQuestionFields'));
  assert.ok(login.includes('resetAccountPassword'));
  assert.ok(login.includes('lookupRecoveryAccount'));
  assert.ok(login.includes('Access-history tip'));
  assert.ok(login.includes('PDF, TXT or CSV'));

  const settings = source('src/components/platforms/SettingsPlatform.tsx');
  assert.ok(settings.includes('<TeamAccessPanel />'));
  assert.ok(settings.includes('Team Access & Logins'));

  const directory = source('src/components/platforms/DirectoryPlatform.tsx');
  assert.ok(directory.includes('MemberAccessDialog'));
  assert.ok(directory.includes('POS login for'));

  const about = source('src/components/platforms/AboutPlatform.tsx');
  assert.ok(about.includes('Separate business workspaces'));
  assert.ok(about.includes('Team access & recovery'));

  const context = source('src/context/POSContext.tsx');
  assert.ok(context.includes('writeWorkspaceData'));
  assert.ok(context.includes('readWorkspaceData'));
  assert.ok(!context.includes('localStorage.getItem(USERS_STORAGE_KEY)'));
});

test('manual documents the workspace, team login and recovery rules', () => {
  const manual = source('src/data/userManual.ts');
  for (const id of ['business-workspace', 'team-logins', 'security-recovery', 'workspace-isolation']) {
    assert.ok(manual.includes(`id: '${id}'`), `missing manual entry ${id}`);
  }
  assert.ok(manual.includes('Only the administrator can create or reset one'));
  assert.ok(manual.includes('Capitals and extra spaces are ignored'));
});
