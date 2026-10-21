# Guided setup and landing-page separation verification

> **Historical feature evidence:** The anonymous-storefront route in the original browser pass has been superseded by the authenticated-only `/#/pos/landing_page_builder` requirement. Current route/SEO tests and evidence are in [../routing/README.md](../routing/README.md). The four route expectations in `feature.test.ts` now follow that policy; other feature regressions are retained.

This is a **focused feature pass**, not a production-readiness certification.

| Check | Final result |
|---|---:|
| TypeScript | PASS |
| Production build | PASS |
| Unit checks (51 focused + 7 existing calculations) | 58 / 58 |
| Local no-key API checks | 5 / 5 |
| Distinct browser checks, latest result | 57 / 57 |
| Browser console errors | 0 |

```sh
npm run lint
node --import tsx --test src/utils/calculations.test.ts qa/onboarding/feature.test.ts
npm run build
# With the local server running and no Gemini key enabled:
python qa/onboarding/check-api.py
```

## Browser evidence

See [BROWSER-CHECKS.md](BROWSER-CHECKS.md), `browser-results.json` and the numbered snapshots. `ui.py` is a snapshot-driven CLI action/inspection helper, using only the preinstalled **arena** browser session. Tests use browser-local TEST records, not real payments, emails or customers. The test browser was closed afterward.

The raw log retains two failed test-author assertions that were corrected and retested: the CLI snapshot includes native-inert nodes, and the payment button was in its darker hover state rather than its base RGB color. Direct native-inert inspection and an actual WCAG contrast calculation replace those over-specific assertions. The final distinct-case results above use the last result, not raw attempt count.

## Limits carried forward

The historical [QA-CHECKLIST.md](../../QA-CHECKLIST.md) records earlier accounting, overselling, export, API and security issues. This feature pass does not assert that those unrelated findings are resolved. It uses no supplied Gemini key and sends no live payment or email.

The build retains existing Vite configuration / large bundle warnings; it completes successfully.
