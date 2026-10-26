# Pack Generator: instructions for Claude

Personal tour-preparation PWA for Noah: plan, pack, ride, debrief, bike care. It is built with Svelte 5, Vite and Dexie (IndexedDB) and works offline. It is live on GitHub Pages; each PR also gets a Vercel preview.

Noah writes German and is not a developer. Write replies to him in short, simple German, and explain GitHub steps click by click. The app's source language is English, and the German texts go through `t()`.

## Current rules (Noah, 26.10.2026 evening, binding, above everything else)

These are the only rules. They replace every older rule here, in `docs/arbeitsweise.md`, in project memory and in older skill texts (bundles, «Noah merges himself», «no ★», Heute N2 protected, length budgets, ideas per release). The project instruction in Claude only points here; project memory keeps the current state, not rules. German summary: `docs/arbeitsweise.md`, section «Stand 26.10.2026 abends». Source: thread «Verschlanken App, Tests und Speicher», Noah 26.10.2026 20:31–20:38 UTC.

1. **Goal:** «Eine App, die mich im Alltag unterstützt.» Every change serves one of the five goals in `docs/vorhaben.md`; if not, ask Noah.
2. **Small PRs for everything, no bundles** (Noah «3a, kleinere PRs ab sofort für alles, damit wir agiler sind»). One change, one PR, its own version. No bundler thread, no collecting.
3. **Screenshots + test link, then Noah approves, then Claude merges** (Noah «1b, claude merged selber, aber alles erst nachdem ich die screenshots dazu freigegeben habe»). Every PR, once CI is green, gets screenshots of what changed (phone 390 px + computer 1440 px, fictional data) and its own test link (Vercel preview of that PR, own storage, load a backup). Claude merges only after Noah approved **that** PR («ok 266», a tap on «Freigeben»). A PR with nothing visible (CI, tests) says so and needs Noah's ok too. After the merge: check Pages green (and the Vercel server «packgen» READY when `api/` changed), then one line «Online: …». Never auto-merge. Dependabot and watcher repairs follow the same way. A change to the data storage (Dexie schema, backup format) is first checked with a copy of a backup.
4. **Mockups only for big things** (a new page or flow like the Live-Karte). Everything else: build, then screenshots.
5. **Questions:** at most 5 per round, a/b written out, **with Claude's recommendation ★**. Ask what you need up front, then work on your own and come back with proposed solutions.
6. **No page-length requirements** (Noah «keine anforderung an eine länge der seite»): no screen budgets, no «max N screens», no «first screen» rules. **Heute** is treated like every other page (no protected layout).
7. **Every PR** has «Was fällt weg oder rutscht tiefer» and «Was ist neu» (Noah «4a»; in the app the «Neu» tile sits at the bottom of Heute). No new ideas per release. Course check once a week in the Sunday brief.
8. **Order:** Noah says what comes next. «zurück» = revert that PR at once.
9. **Quiet:** speak only with a result, a blocker or a question, in short German. No status posts at fixed times. When Noah asks what is open, name at most 3 items.
10. **Free and private:** zero costs; private data only outside the repo, no real names.
11. **Always:** everything is a suggestion and changeable; every kind of data and group can be added, renamed and deleted, with Undo; reorder with arrows and drag; explanatory text wherever users could get lost.
12. **After every step:** document the progress (docs, memory state).

## How we work

- Small decisions you take yourself go in the PR under «Selbst entschieden».
- Everything in the app is a suggestion: never mandatory, always changeable and deselectable.
- A Vercel rate-limit red does not block. Renumber open PRs when main moves on. After a merge, tell Noah in one short German line what is new online.
- **Groups everywhere** (Noah, 18.10.2026 «grundsätzlich überall»): every group the user sees or chooses can be renamed and deleted. Deleting asks where the contents go, with «Ohne Gruppe» preselected, and then offers Undo. It never deletes the contents. Names the user typed never go through `t()`. A new kind of group comes with rename and delete and goes in `GROUP_PLACES` (`src/lib/groups.js`), which the guard test `tests/groups.test.js` checks. Use `src/lib/ui/GroupDeleteSheet.svelte` for the delete question.
- **Pages load later** (Tempo, 19.10.2026): only Heute (`Home.svelte`) is imported at the start. A new page goes into `PAGES` in `src/App.svelte` as `Name: () => import('./pages/Name.svelte')` and is shown with `<LazyPage load={PAGES.Name} />` (`src/lib/nav/lazy.js`). Big tools (PDF, text recognition, image models, video) load with `await import()` on first use. The build stops when a JS file passes 3 MB (`scripts/size-guard.mjs`, guard test `tests/size-guard.test.js`).
- **Change everything yourself** (Noah, 19.10.2026 «alle daten können vom nutzer selber hinzugefügt, umbenannt oder gelöscht werden»): every kind of data the user sees can be added, renamed and deleted in the UI. Delete asks first in the app's own window (`askDelete`, never `confirm()`) and offers Undo (`deleteWithUndo`). Nothing is blocked because it is still used: the delete window asks where the dependent things go (e.g. a bike's trips, `src/lib/bikedelete.js`). App lists live in «Listen und Typen» (`STANDARD_LISTS` in `src/lib/standard.js`, applied in `src/lib/lists.js`). Open gaps: `notes/alles-bearbeiten/README.md` in the project folder.
- **Course check:** `docs/vorhaben.md` lists every planned project with its why and goals. Before starting, check it fits one of the five goals; if not, ask Noah. Once a week, the Sunday brief carries a short course check with a/b questions.

## Privacy (never break)

- The repo is public. Never commit personal data: no Excel lists, backups, receipts, photos, GPX files, real bike specs, or anything from Noah's private folders.
- Tests, fixtures and screenshots use fictional data only.
- Health data is observation only. Do not name people, teams, studios or workshop staff.
- Secrets (for example the Strava client secret) live only in the Vercel environment, never in the code, chat or files.

## Every PR

- Bump the version in `package.json` and `package-lock.json` (2 places). It must be higher than main; renumber when main has moved on.
- Update `src/lib/whatsnew.js` (1–3 points) and `src/lib/i18n/de/whatsnew.js`. Put the new version first in the `newerThan` list in `tests/whatsnew.test.js`; the list is strictly descending.
- Update `docs/projektstand.md`, `docs/status.md`, `docs/decisions.md`, `docs/roadmap.md`, `docs/design-audit.md` and `docs/vorhaben.md` (rules in `docs/README.md`).
- Every new UI text goes through `t('English')` and needs a German entry in `src/lib/i18n/de/*.js`, imported in `de/index.js`. The Gesamttest fails on English words in the German UI.
- Use the repo's PR template if there is one; otherwise start the body with «Before:» and «After:».
- **Was fällt weg oder rutscht tiefer** (Noah, 14.10.2026 «3a»): every PR has this section. List what is no longer there and what moves behind «Mehr», into a fold or further down, with the old and the new way; write «nichts» if nothing does. A loss that Noah did not approve needs his answer before the merge.

## Tests

- `npm test`: vitest.
- `npx playwright test <spec> --workers=1`, with `E2E_PORT=52xx` and `E2E_SKIP_GESAMTTEST=1`, for your own specs plus `tests/e2e/guard.spec.js`.
- Before every PR, run locally only your own specs, the specs of the pages you changed and `guard.spec.js` (Noah, 11.10.2026 «1-5 a»). The full Gesamttest runs on GitHub. To run one shard by hand: `npx playwright test tests/e2e/gesamttest --project=desktop --shard=1/2 --workers=2`.
- Tests read their lists (blocks, categories, labels) from the app source instead of keeping copies.
- Afterwards run `git checkout -- qa/` (tests write screenshots there).
- Never skip, disable or loosen a test to get green. Fix the cause, or adapt the test when the UI changed on purpose.
- Test dates use calendar-day arithmetic in Europe/Zurich, never `Date.now() + n*864e5`.
- For «today» in app code, use `localDay()` (src/lib/localday.js), not `toISOString().slice(0,10)`.
