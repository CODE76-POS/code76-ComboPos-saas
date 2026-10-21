# Business accounts, team logins and security questions

This update turns the single shared workspace into **one workspace per business**, with the person who registers the business as its administrator.

## Who can do what

| Action | Who |
| --- | --- |
| Register a business | Anyone on the public CODE76 site (Sign In → Register your business) |
| Become the administrator | The person who registers and pays for that business |
| Create a business workspace | Registration only; one email belongs to one workspace |
| Create or reset staff logins | The administrator of that workspace |
| Sign in | Any local account, always landing in its own workspace |
| Recover a username or reset a password | The account holder, using their security question |

## Registering a business

`LoginModal` and the landing-page portal now collect:

1. Business name — this becomes the workspace name.
2. Administrator full name and email (username).
3. A password of at least 6 characters.
4. One security question with its answer.

Registration calls `registerBusiness()` in `src/utils/accounts.ts`. It creates:

- a `WorkspaceRecord` (`id`, company name, owner email, demo plan tier);
- an admin `AccountRecord` (`isAdmin: true`, roles `CEO` + `Developer`);
- a salted SHA-256 password hash and a salted answer hash.

No plain-text password or answer is ever persisted.

## Staff logins on company members

The administrator can create a login from:

- **Company Members** → key icon on the member row; or
- **Settings → Team Access & Logins**.

Each login is linked to a `PersonRecord` (`memberId`), stores the member's two roles, and is marked `isAdmin: false`. Members sign in with the email and temporary password the administrator gives them, and can reset it through their security question.

The administrator can reset a member's password and security question, or remove the login. Removing a login never deletes the member, their sales history or audit entries.

## Data isolation

Each business owns a separate saved snapshot:

- `code76_pos_ws_<workspaceId>` — that business's full dataset;
- `code76_pos_accounts_v2` — account index (workspace id, hashed secrets);
- `code76_pos_active_workspace` — last opened workspace.

On sign-in, `POSContext` suspends the current workspace, writes its snapshot, then loads only the target workspace snapshot (or a blank workspace for a new business). **Signing out clears merchant records from memory**, and nothing merchant-specific is preloaded before sign-in.

Cross-workspace operations are rejected:

- `updateTeamLogin` / `removeTeamLogin` check that the target account belongs to the signed-in workspace;
- the administrator account cannot be deleted;
- non-administrators cannot create, reset or remove logins.

## Recovery

Sign In → **Forgot password or email?** supports:

1. **Find the account** by email, or by full name plus business name.
2. **Answer the security question.** The answer is normalised (case/space-insensitive) and compared to the stored hash.
3. **See the username (email) and set a new password.** The password salt changes; recovery keeps working because the answer uses a separate salt.

Five wrong passwords pause that login for about five minutes. There is no email/SMS delivery and the app never claims one.

## Honest limitations

This is still a browser-local prototype:

- credentials and hashes live in `localStorage`, not a server;
- workspace separation is per browser profile, not per authenticated server tenant;
- anyone with access to the same browser profile and developer tools could inspect local storage;
- use test data only.

A production deployment needs server-side authentication, per-tenant authorisation on every request, secure password hashing (Argon2/bcrypt), rate limiting, audit retention and a real recovery channel.

## Verification

- `qa/tenant-access/tenant-access.test.ts` covers hashing vectors, registration validation, workspace separation, team account linking, cross-business email rejection, recovery answers, password reset, admin protection and legacy migration (older three-question accounts keep their first question).
- Full suite: 535 tests passing; `npm run lint` and `npm run build` clean.
