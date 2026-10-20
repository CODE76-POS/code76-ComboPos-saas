# Browser acceptance cases — routing/SEO

Final result is the latest attempt for each case. Raw failed attempts remain in `browser-results.json`.

| # | Case | Final |
|---|---|---|
| 1 | public root renders CODE76 marketing, not a merchant workspace | PASS |
| 2 | public root has one canonical and matching OG URL | PASS |
| 3 | workspace preview stays noindex | PASS |
| 4 | public root exposes sign-in and registration but no guest business-page buttons | PASS |
| 5 | obsolete ?view=storefront shows the public site, never merchant content | PASS |
| 6 | anonymous internal-builder request displays the sign-in page, without mounting merchant content | PASS |
| 7 | anonymous private request does not increment merchant visits | PASS |
| 8 | protected sign-in entry is noindex and omits public structured data | PASS |
| 9 | successful sign-in returns to the requested internal builder route | PASS |
| 10 | guided setup remains available but can be skipped without blocking the private builder | PASS |
| 11 | merchant catalog anchor scrolls without losing the protected hash route | PASS |
| 12 | builder offers only a clearly private sign-in-required internal link | PASS |
| 13 | business settings open only inside the authenticated POS settings route | PASS |
| 14 | Back returns directly to builder and independent merchant edits are retained | PASS |
| 15 | Forward restores the internal settings route | PASS |
| 16 | authenticated user returning to base URL sees public CODE76, not dashboard or business page | PASS |
| 17 | public metadata is restored without duplicate canonicals or private fragments | PASS |
| 18 | public marketing section anchors still work with hash-based POS routes | PASS |
| 19 | public Enter POS opens the explicit authenticated workspace route | PASS |
| 20 | One payment checkout label survives the routing update | PASS |
| 21 | internal Business Page shortcut uses landing_page_builder only | PASS |
| 22 | sign-out returns to public root and removes all private navigation/dialogs | PASS |
| 23 | Back after sign-out cannot reopen the merchant builder or count a merchant visit | PASS |
| 24 | /index.html renders the public site and canonicalizes to root | PASS |
| 25 | registration form remains reachable on the public root | PASS |
| 26 | public page and registration fit a 390px mobile viewport | PASS |
| 27 | private builder works and fits the 390px mobile viewport | PASS |
| 28 | private builder keeps one public-root canonical and noindex metadata | PASS |
| 29 | full reload fails closed without a session and never restores merchant content from saved records | PASS |
| 30 | protected sign-in notice also fits the mobile viewport | PASS |
| 31 | browser route checks finish without console errors | PASS |
