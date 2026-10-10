# Pack Generator: instructions for Claude

Personal tour-preparation PWA for Noah: plan, pack, ride, debrief, bike care. It is built with Svelte 5, Vite and Dexie (IndexedDB) and works offline. It is live on GitHub Pages; each PR also gets a Vercel preview.

Noah writes German and is not a developer. Write replies to him in short, simple German, and explain GitHub steps click by click. The app's source language is English, and the German texts go through `t()`.

## Principle No. 1 (Noah, 10.10.2026, binding, above everything else)

1. **Overview first:** check the current state in the project (repo docs, memory, Trello, open PRs) and work by our rules, using the project's skills and plugins.
2. **Plan:** keep an updated roadmap, a sequence and implementation plan, and work packages.
3. **Mockups for every work package, always shown on the one page «Offene Mockups»** (Noah, 10.10.2026, priority 1, «extrem wichtig»): https://claude.ai/artifact/1EtKR7y8fYJheMwCeyWQyv. Each round gets its own section, with computer and phone side by side and a link to its Trello question card. The Trello card and the thread reply both link to that section. Never hand over only a folder path.
4. **Noah approves the mockup.** Only then build and open the PR.
5. **Noah merges every PR himself** (Noah, 10.10.2026 14:16, «ab sofort und überall»; this replaces the self-merge from 13:52). Claude opens the PR, runs its own and the affected tests locally, gets CI green (CI runs the full Gesamttest) on the head commit, then sends Noah the link and the clicks. **Mockup check before every release:** the PR names the Trello comment where Noah saw and commented on this package's mockups. No such comment means no release PR; ask Noah first.
6. **After every step:** document the progress (docs, Trello, memory).
7. **Small things:** check and improve them yourself. **Bigger things:** always ask Noah targeted a/b questions with ★.

## How we work (binding, see docs/arbeitsweise.md)

- One package at a time, two at most; two builds only when they change different areas of the app.
- **Faster (Noah, 11.10.2026 «1-5 a»):** small releases with one visible thing; one mockup round per package with at most 5 questions, build right after his answer; flaky tests get their own small «Tests stabil» release. Mockups stay, always.
- Before every release:
  1. Mockups (1440 and 390 px, light only).
  2. Noah reviews them.
  3. a/b questions, with the recommendation marked ★.
  4. Build only after his answers.
- **Noah merges (since 10.10.2026 14:16):** open the PR, run your own and the affected tests locally, get CI green (CI runs the full Gesamttest) on the head commit, then give Noah the link with the clicks «Merge pull request» → «Confirm merge». Never merge yourself. A Vercel rate-limit red does not block. Renumber open PRs when main moves on. After Noah's merge, move the Trello card to «Zu testen» with the test steps and tell Noah in one short German line what is new online.
- **Mockup check (since 10.10.2026 14:16):** before every release PR, check that Noah saw and commented on the mockups for this package (Trello comment or thread answer). Put the link under «Mockup-Prüfung» in the PR. This saves testing at the end and late front-end wishes.
- Small decisions you take yourself go in the PR under «Selbst entschieden».
- Everything in the app is a suggestion: never mandatory, always changeable and deselectable.
- **Course check:** `docs/vorhaben.md` lists every planned project with its why, goals and order. Before starting a new package, check it fits one of the four goals and the order there; if not, ask Noah. Every release PR updates its «Stand heute» section. About every five releases, send Noah a short course check with a/b questions.

## Privacy (never break)

- The repo is public. Never commit personal data: no Excel lists, backups, receipts, photos, GPX files, real bike specs, or anything from Noah's private folders.
- Tests, fixtures and screenshots use fictional data only.
- Health data is observation only. Do not name people, teams, studios or workshop staff.
- Secrets (for example the Strava client secret) live only in the Vercel environment, never in the code, chat or files.

## Every release PR

- Bump the version in `package.json` and `package-lock.json` (2 places). It must be higher than main; renumber when main has moved on.
- Update `src/lib/whatsnew.js` (2–4 points) and `src/lib/i18n/de/whatsnew.js`. Put the new version first in the `newerThan` list in `tests/whatsnew.test.js`; the list is strictly descending.
- Update `docs/status.md`, `docs/decisions.md`, `docs/roadmap.md`, `docs/design-audit.md` and `docs/vorhaben.md` (rules in `docs/README.md`).
- Every new UI text goes through `t('English')` and needs a German entry in `src/lib/i18n/de/*.js`, imported in `de/index.js`. The Gesamttest fails on English words in the German UI.
- Use the repo's PR template if there is one; otherwise start the body with «Before:» and «After:».

## Tests

- `npm test`: vitest.
- `npx playwright test <spec> --workers=1`, with `E2E_PORT=52xx` and `E2E_SKIP_GESAMTTEST=1`, for your own specs plus `tests/e2e/guard.spec.js`.
- Before every PR, run locally only your own specs, the specs of the pages you changed and `guard.spec.js` (Noah, 11.10.2026 «1-5 a»). The full Gesamttest runs on GitHub. To run one shard by hand: `npx playwright test tests/e2e/gesamttest --project=desktop --shard=1/2 --workers=2`.
- Tests read their lists (blocks, categories, labels) from the app source instead of keeping copies.
- Afterwards run `git checkout -- qa/` (tests write screenshots there).
- Never skip, disable or loosen a test to get green. Fix the cause, or adapt the test when the UI changed on purpose.
- Test dates use calendar-day arithmetic in Europe/Zurich, never `Date.now() + n*864e5`.
- For «today» in app code, use `localDay()` (src/lib/localday.js), not `toISOString().slice(0,10)`.
