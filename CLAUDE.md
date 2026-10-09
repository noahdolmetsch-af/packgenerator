# Pack Generator: instructions for Claude

Personal tour-preparation PWA for Noah: plan, pack, ride, debrief, bike care. It is built with Svelte 5, Vite and Dexie (IndexedDB) and works offline. It is live on GitHub Pages; each PR also gets a Vercel preview.

Noah writes German and is not a developer. Write replies to him in short, simple German, and explain GitHub steps click by click. The app's source language is English, and the German texts go through `t()`.

## How we work (binding, see docs/arbeitsweise.md)

- One package at a time, two at most.
- Before every release:
  1. Mockups (1440 and 390 px, light and dark).
  2. Noah reviews them.
  3. a/b questions, with the recommendation marked ★.
  4. Build only after his answers.
- **Never merge.** Open the PR, get CI green, then give Noah the link, the test steps and the clicks «Merge pull request» → «Confirm merge».
- Small decisions you take yourself go in the PR under «Selbst entschieden».
- Everything in the app is a suggestion: never mandatory, always changeable and deselectable.

## Privacy (never break)

- The repo is public. Never commit personal data: no Excel lists, backups, receipts, photos, GPX files, real bike specs, or anything from Noah's private folders.
- Tests, fixtures and screenshots use fictional data only.
- Health data is observation only. Do not name people, teams, studios or workshop staff.
- Secrets (for example the Strava client secret) live only in the Vercel environment, never in the code, chat or files.

## Every release PR

- Bump the version in `package.json` and `package-lock.json` (2 places). It must be higher than main; renumber when main has moved on.
- Update `src/lib/whatsnew.js` (2–4 points) and `src/lib/i18n/de/whatsnew.js`. Put the new version first in the `newerThan` list in `tests/whatsnew.test.js`; the list is strictly descending.
- Update `docs/status.md`, `docs/decisions.md`, `docs/roadmap.md` and `docs/design-audit.md` (rules in `docs/README.md`).
- Every new UI text goes through `t('English')` and needs a German entry in `src/lib/i18n/de/*.js`, imported in `de/index.js`. The Gesamttest fails on English words in the German UI.
- Use the repo's PR template if there is one; otherwise start the body with «Before:» and «After:».

## Tests

- `npm test`: vitest.
- `npx playwright test <spec> --workers=1`, with `E2E_PORT=52xx` and `E2E_SKIP_GESAMTTEST=1`, for your own specs plus `tests/e2e/guard.spec.js`.
- The full e2e suite and the Gesamttest (`tests/e2e/gesamttest`, sharded) run in CI. Run a shard locally only when CI failed in it.
- Afterwards run `git checkout -- qa/` (tests write screenshots there).
- Never skip, disable or loosen a test to get green. Fix the cause, or adapt the test when the UI changed on purpose.
- Test dates use calendar-day arithmetic in Europe/Zurich, never `Date.now() + n*864e5`.
- For «today» in app code, use `localToday()` (src/lib/localday.js), not `toISOString().slice(0,10)`.
