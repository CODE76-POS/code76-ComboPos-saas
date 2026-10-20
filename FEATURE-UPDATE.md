# CODE76 ComboPOS — guided setup & independent landing pages

## Implemented

- **Appearance first:** light/dark cards with real visual examples, four text sizes, a live sample and immediately saved POS preferences. Settings and the navigation theme toggle now use the same persisted theme source.
- **My Company next:** no prefilled CODE76 identity/contact/tax data for an unconfigured merchant. Only the business name is required; other details can be completed later. Saving My Company directly also prompts inventory setup when it is empty.
- **First inventory:** save up to three real products or services; stop after one or two, or skip all of them. No invented opening stock or prices. New wizard writes respect the current role’s permissions. Saved preferences, company data and items survive closing, skipping and reloading.
- **Find your way:** the actual Package, Settings gear, HelpCircle and Info icons link to Inventory, the appropriate Settings tab, platform guidance and About & Manual. Reopen any time from **My Company → Open guided setup**. Actions stay visible while long forms scroll; keyboard focus is contained and Escape closes safely.
- **Payments:** “Exact Pay” is now **One payment**. It keeps the original single-full-total Cash behaviour. Added split-payment rows use a labelled **trash icon**, not X. Payment fields have accessible names; the light-theme add control has readable, non-pulsing contrast.
- **Independent pages:** CODE76 product-site content, inquiries and metrics no longer come from the merchant POS data/settings. The business page uses actual company/inventory/review records, business categories/currency and honest empty states. Both assistants explicitly select their own audience and data.
- **Supporting first-use fix:** register actions now call registration rather than sign-in. This is still prototype, client-side authentication—not a new secure authentication backend.

## Which page to edit

| Requested change | Correct place |
|---|---|
| CODE76 main site before entering POS | `LandingPage.tsx`, `config/code76Site.ts`, `data/code76SiteContent.ts` |
| Your merchant Business Landing Page | My Company, Inventory, **Settings → Business Landing Page Settings**, and `BusinessStorefrontLandingPage.tsx` |

See [the detailed ownership/editing map](docs/LANDING-PAGES.md) for the exact boundaries, settings migration and regression guards. No speculative redesign of the CODE76 marketing website was introduced.

## Verification

- TypeScript check: **PASS**
- Production build: **PASS** (existing config/bundle warnings remain)
- Unit checks: **58 / 58**
- Local no-key assistant API checks: **5 / 5**
- Distinct browser checks, final result: **57 / 57**
- Browser console errors: **0**
- Supplied Gemini keys used: **none**
- Live payments/emails sent: **none**

[Feature evidence and reproduction commands](qa/onboarding/README.md) · [Browser cases](qa/onboarding/BROWSER-CHECKS.md) · [Machine-readable summary](qa/onboarding/summary.json)

The earlier [QA checklist](QA-CHECKLIST.md) remains a historical baseline. This update does **not** certify production readiness or claim to resolve all existing accounting, overselling, export, API and authentication/security issues.

## Workspace preview

The **CODE76 ComboPOS** Live Preview is running on port 3000 with the rebuilt production app. For a fresh browser, choose **CEO / Admin** on the sign-in page to try setup; for an existing session use **My Company → Open guided setup**.

[Dark setup preview](preview-guided-setup.png) · [Light setup preview](preview-guided-setup-light.png) · [Mobile setup](preview-guided-setup-mobile.png) · [First inventory](preview-first-inventory.png) · [Icon guide](preview-setup-icon-guide.png) · [Payment controls](preview-sales-payments.png) · [Merchant page example](preview-business-page.png)

Screenshots use explicitly labelled TEST records in the tool’s isolated browser. Your own browser’s merchant records were not changed. Only one app server is left running; the test browser was closed.

## GitHub publication status

Changes are prepared on local branch **`feat/guided-setup-and-landing-isolation`**, based on `77b5cfccf9168fa851125b7dfb564bf102aae22b`.

**Not pushed:** this workspace has no authenticated GitHub write access. The authorized push dry-run failed with `fatal: unable to get password from user`. A local commit and a downloadable patch are prepared for publication; no remote update is claimed.

From an authenticated checkout with this branch available:

```sh
git push -u origin feat/guided-setup-and-landing-isolation
```

Do not paste credentials or API keys into chat. If applying the downloadable patch to another checkout, start from the recorded base or review any upstream conflicts.

## Remaining storefront limitation

The business page is still a **browser-local prototype**. Its preview URL selects the correct page but does not publish one browser’s catalog to other visitors/devices. Public storefront publishing, secure tenant storage and a real product-site lead backend require backend work outside this UI/separation update. Previously mixed historical leads/metrics were preserved rather than guessed at, moved or deleted; new writes are isolated going forward.
