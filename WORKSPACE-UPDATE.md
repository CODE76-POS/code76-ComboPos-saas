# CODE76 workspace update

## Implemented

- Kept public CODE76 root/SEO and authenticated-only `landing_page_builder` boundaries intact; public and merchant content/settings remain independent.
- Added a clean, selectable **App link** to the POS navbar with actual awaited clipboard success, legacy fallback, open-in-new-tab and manual-copy instructions. Private/referral links and document-preview copying use the same reliable helper. Copied app/private roots omit credential queries.
- Removed navbar **CODE76 Site**, the far-right **logout** button, and both light/dark switches. Sign-out is inside **Active User Session** and returns to CODE76 marketing/login/register. Themes live in **App Appearance Settings** and still remain available in first-use setup.
- Added permission-aware history guidance to the role/session widget. History and export access are checked on normal, Settings and About entry points, at download handlers and again before completing asynchronous PDF output. Removed the old PIN/unconditional-unlock backdoor.
- Added real, filtered **PDF, TXT and CSV** downloads. PDF uses a lazy-loaded library, embedded local Unicode font and real pagination. Audit CSV neutralizes formula-like cells. Read-only backups omit history; non-admins cannot save role grants or restore a full snapshot to replace them.
- Added service billing units: **Per task completion, minute, hour, day, week, month, year, session, visit or project**. Saved services have zero stock rather than 9999; rate metadata appears in Inventory, checkout, new receipt/invoice descriptions, merchant catalog and its factual assistant context. Calculation/payment math was not changed. Existing services missing this optional field display task completion by default; edit them if their actual basis differs. No old records were deleted or bulk rewritten.
- Empty merchant review badge/navigation are hidden. Approved reviews appear reactively when available; review consent copy now identifies the private merchant page, not the public CODE76 site. No reviews are invented.
- Replaced the business-sector selector and overlapping old feature grid with **18 actual CODE76 platforms and concrete business benefits**, without promising unconfigured integrations/public merchant publishing.

## Verification

**181/181 unit tests · 59/59 final browser cases · 21/21 local HTTP checks · zero console errors · TypeScript/build pass.** Real copy/paste and parsed browser-downloaded PDF/TXT/CSV files were checked. See [evidence](qa/usability/README.md).

Only the tool's isolated TEST browser data was changed. One bookkeeping TEST sale was recorded to exercise service units/review capture; no real payment, email, external identity or live AI was sent. No supplied API key was used.

## Live preview and external browser links

Open **CODE76 POS — Workspace Preview** in Arena's Live Preview panel, **port 5173**. The top navbar exposes the current app URL after sign-in. The server is production mode with no file watchers.

The bare workspace host was tested and requires an Arena/E2B traffic-access token. Another browser must open the authorized Arena Live Preview; simply pasting its raw sandbox URL can return a hosting 403. The app root/index themselves return 200. Hash routing, CORS and SEO tags cannot authorize an upstream host. No public production deployment is claimed, and browser-local records/sessions do not sync across browsers.

The existing authentication remains a browser-local prototype, not production server-side auth/tenant security. The new UI guards are not a claim of tamper-proof security or general accounting/export certification. Configure a verified `PUBLIC_SITE_URL` for production SEO; previews remain noindex.

## Source publication

Changes are prepared on the existing local feature branch. GitHub connector support/write authentication is unavailable in this workspace; the real Git push result is reported with delivery. No remote success is claimed unless that push succeeds. The full `code76-current-changes.patch` covers this and the prior completed features from base `77b5cfccf9168fa851125b7dfb564bf102aae22b`.
