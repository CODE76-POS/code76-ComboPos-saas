# Usability acceptance cases

Latest attempt per case; original attempts are retained in `browser-results.json`.

| # | Case | Final |
|---|---|---|
| 1 | public CODE76 homepage shows exactly 18 practical platform/feature cards | PASS |
| 2 | root still exposes public marketing and sign-in/register | PASS |
| 3 | public canonical and SEO title remain rooted and query-free | PASS |
| 4 | anonymous builder URL still shows the sign-in page, not merchant content | PASS |
| 5 | top navbar exposes a clean root app link, not a merchant hash route | PASS |
| 6 | navbar removes CODE76 Site, far-right logout and light/dark toggles | PASS |
| 7 | empty business page has no review placeholder, rating badge or reviews nav | PASS |
| 8 | copy app link reports confirmed clipboard success | PASS |
| 9 | real clipboard paste matches the exact copied app URL | PASS |
| 10 | service entry replaces numeric stock with billing-unit choices | PASS |
| 11 | saved hourly service has the chosen basis and no fabricated stock | PASS |
| 12 | inventory quantity column shows Per hour instead of Unlimited Service | PASS |
| 13 | editing an existing service restores the saved billing unit | PASS |
| 14 | service billing unit can be edited and persisted without changing its price | PASS |
| 15 | private business catalog automatically reflects saved service units | PASS |
| 16 | empty approved reviews remain fully hidden after catalog updates | PASS |
| 17 | business copy dialog makes authenticated-only access explicit | PASS |
| 18 | original business-page copy link control now confirms actual success | PASS |
| 19 | pasting the copied business link yields the protected builder URL | PASS |
| 20 | sales search describes the chosen service rate basis | PASS |
| 21 | service checkout counts two billable units and keeps the selected daily rate | PASS |
| 22 | TEST service checkout records quantity and rate without decrementing service stock | PASS |
| 23 | actual consented purchase feedback is saved as an approved merchant review | PASS |
| 24 | approved review appears automatically without inventing placeholder reviews | PASS |
| 25 | role widget contains sign-out plus privileged history location and file guidance | PASS |
| 26 | authorized session shortcut opens the protected access-history platform | PASS |
| 27 | history search narrows records before exporting | PASS |
| 28 | actual CSV download contains only the filtered access-history records | PASS |
| 29 | actual TXT download includes readable export metadata and filtered records | PASS |
| 30 | actual PDF download parses and contains the requested filtered records | PASS |
| 31 | embedded PDF font preserves Unicode names and plain-text special characters | PASS |
| 32 | light and dark controls live in App Appearance settings rather than navbar | PASS |
| 33 | saving light appearance updates and persists the actual workspace theme | PASS |
| 34 | admin can explicitly grant history view and withhold report-export privileges | PASS |
| 35 | session-widget Sign Out immediately returns to public CODE76 sign-in/register | PASS |
| 36 | read-only non-admin session receives view guidance but not an export entitlement | PASS |
| 37 | view-only role can read history but has no PDF/TXT/CSV/email export controls | PASS |
| 38 | non-admin cannot grant itself history/export privileges | PASS |
| 39 | non-admin privilege-save attempt leaves the saved permission map unchanged | PASS |
| 40 | read-only history privilege cannot bypass export restrictions through JSON backup | PASS |
| 41 | explicitly privileged non-admin session is told it can export history | PASS |
| 42 | delegated audit plus export rights enable all three formats without requiring admin status | PASS |
| 43 | non-admin export with explicitly granted privileges starts a real download | PASS |
| 44 | revoking a role privilege removes the Audit & Access Logs navbar entry | PASS |
| 45 | direct audit hash cannot bypass missing privileges | PASS |
| 46 | settings access-history entry uses the same permission guard | PASS |
| 47 | About/Manual has no alternative history or file-export bypass | PASS |
| 48 | unprivileged role widget explains restriction without an open-history shortcut | PASS |
| 49 | new navbar URL/copy/session controls fit a 390px mobile viewport | PASS |
| 50 | mobile session widget remains accessible and offers Sign Out | PASS |
| 51 | mobile session sign-out returns to public marketing and account portal | PASS |
| 52 | public 18-feature replacement also fits the mobile viewport | PASS |
| 53 | refresh requires sign-in but preserves service-unit and review records | PASS |
| 54 | dark and light examples keep honest colors while the workspace uses light mode | PASS |
| 55 | dark theme also applies through App Appearance settings only | PASS |
| 56 | persisted private catalog and approved reviews still render after the rebuilt app reloads | PASS |
| 57 | non-admin full-snapshot restore is disabled, preventing a permission-map replacement bypass | PASS |
| 58 | finished app returns cleanly to the public 18-platform marketing root | PASS |
| 59 | full usability flow has zero browser console errors | PASS |
