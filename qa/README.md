# Lightweight QA checks

See `../QA-CHECKLIST.md` for the completed review, outcomes, reproducible defects, and release gates.

## Automated checks

Run from the repository root while the local no-key preview server is available:

```sh
npm run lint
node --import tsx --test src/utils/calculations.test.ts qa/quality-checks.test.ts
python qa/check-api.py
```

The 27-test combined unit suite currently has **23 passes / 4 failures**. The failures intentionally describe open application defects: multiline CSV, CSV formula neutralization, printable-report HTML escaping, and immutable historical COGS. They must not be disabled simply to get a green run.

The API checker refuses to run if `/api/health` indicates a configured Gemini key. It prints per-case outcomes and writes `evidence/api-checks.json`. It reports **5 passes / 5 failed criteria** in the reviewed snapshot. No live Gemini calls are involved. The script's final process exit code is not a CI gate; read the JSON `failed` count.

## Browser navigation smoke checks

Browser tooling is already supplied by Arena; do not install another browser or Playwright copy.

```sh
playwright-cli kill-all
playwright-cli -s=arena open http://127.0.0.1:3000 --browser=chromium
```

In the `arena` session, use the app's one-click CEO demo profile, skip onboarding, and load demo data. Then:

```sh
python qa/check-navigation.py
playwright-cli -s=arena close
```

The script takes a fresh accessibility snapshot for each action, resolves the real button reference, and uses normal Playwright CLI clicks. Its 17 passing cases check navigation/rendering only; they are not comprehensive feature tests. `ui-action.py` is a small helper used during the manual local workflow checks, not a standalone end-to-end suite.

All browser record changes were made in an isolated test browser and do not populate or modify the user's browser-local app data. Test data include one $12.34 QA expense and two additional demo receipts. No real accounts, payments, or emails were used.
