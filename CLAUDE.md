# Pack Generator: instructions for Claude

Personal tour-preparation PWA for Noah: plan, pack, ride, debrief, bike care. It is built with Svelte 5, Vite and Dexie (IndexedDB) and works offline. It is live on GitHub Pages; each PR also gets a Vercel preview.

Noah writes German and is not a developer. Write replies to him in short, simple German, and explain GitHub steps click by click. The app's source language is English, and the German texts go through `t()`.

## Current rules (Noah, 13.–18.10.2026, binding, above everything else)

These replace «Principle No. 1» of 10.10.2026 (mockups first, ★, Trello, «Noah merges himself») and the later «pictures before merge» rule. German summary: `docs/arbeitsweise.md`, section «Stand 18.10.2026». Current state and plan: `docs/projektstand.md`.

1. **Goal:** «Eine App, die mich im Alltag unterstützt.» Every package serves one of the five goals in `docs/vorhaben.md` (the four tour goals plus «Alltag», Noah 19.10.2026 «1a»); if not, ask Noah. All plans stand in one list, `docs/vorhaben-liste.md`.
2. **Overview first:** before work, read `docs/projektstand.md`, project memory and the open PRs, and use the project's skills.
3. **No mockups, no test link** (Noah, 18.10.2026 21:52 UTC «ab sofort, überall»; 19.10.2026 13:49 UTC «ohne testen, direkt online stellen»): build without mockups and without a test link. A package goes online as soon as the automatic tests (CI, desktop and phone) are green.
4. **Packages:** finished parts are bundled into packages; each package is one release with its own version. Since 18.10.2026 there are six packages in the order P3 → A → B → D → E → C → F (see `docs/projektstand.md`). New work may run in parallel.
5. **Shipping** (Noah, 19.10.2026 14:00 UTC «1a»): each build thread brings its own package online, in the order the coordinator gives («du bist dran»). It brings the branch up to date with main, sets the version, opens the PR with auto-merge, and CI decides. No «ok X» is needed any more. A package that changes the data storage (Dexie schema, backup format) is first checked with a copy of a backup (migration check). When Noah writes «zurück», revert that package at once. **Exceptions:** dependency updates (Dependabot) and watcher repairs merge as soon as CI is green.
6. **Questions:** at most 5 per round, a/b options written out, **no ★ default**. Ask, then wait; never decide for him. Example answer line only «1? 2? 3?».
7. **Everything in the project, no Trello.** When Noah asks what is open, name at most 3 items.
8. **Free and private:** zero costs (free services only); private data only outside the repo, no real names.
9. **Quiet:** speak only with a result, a blocker or a question, in short German.
10. **Ideas:** every release proposes at most 3 new ideas for the idea collection.
11. **Heute** follows the approved layout A «Ein Blick» (0.165.0; Noah 20.10.2026 «1A … 3a 4a 5b», replaced HN4); any other change to Heute needs Noah's explicit OK.
12. **Reorder** everywhere with arrows and drag. Add explanatory text wherever users could get lost.
13. **After every step:** document the progress (docs, memory). Small things: check and improve them yourself.

## How we work

- Small decisions you take yourself go in the PR under «Selbst entschieden».
- Everything in the app is a suggestion: never mandatory, always changeable and deselectable.
- A Vercel rate-limit red does not block. Renumber open PRs when main moves on. After a merge, tell Noah in one short German line what is new online.
- **Groups everywhere** (Noah, 18.10.2026 «grundsätzlich überall»): every group the user sees or chooses can be renamed and deleted. Deleting asks where the contents go, with «Ohne Gruppe» preselected, and then offers Undo. It never deletes the contents. Names the user typed never go through `t()`. A new kind of group comes with rename and delete and goes in `GROUP_PLACES` (`src/lib/groups.js`), which the guard test `tests/groups.test.js` checks. Use `src/lib/ui/GroupDeleteSheet.svelte` for the delete question.
- **Pages load later** (Tempo, 19.10.2026): only Heute (`Home.svelte`) is imported at the start. A new page goes into `PAGES` in `src/App.svelte` as `Name: () => import('./pages/Name.svelte')` and is shown with `<LazyPage load={PAGES.Name} />` (`src/lib/nav/lazy.js`). Big tools (PDF, text recognition, image models, video) load with `await import()` on first use. The build stops when a JS file passes 3 MB (`scripts/size-guard.mjs`, guard test `tests/size-guard.test.js`).
- **Change everything yourself** (Noah, 19.10.2026 «alle daten können vom nutzer selber hinzugefügt, umbenannt oder gelöscht werden»): every kind of data the user sees can be added, renamed and deleted in the UI. Delete asks first in the app's own window (`askDelete`, never `confirm()`) and offers Undo (`deleteWithUndo`). Nothing is blocked because it is still used: the delete window asks where the dependent things go (e.g. a bike's trips, `src/lib/bikedelete.js`). App lists live in «Listen und Typen» (`STANDARD_LISTS` in `src/lib/standard.js`, applied in `src/lib/lists.js`). Open gaps: `notes/alles-bearbeiten/README.md` in the project folder.
- **Course check:** `docs/vorhaben.md` lists every planned project with its why, goals and order. Before starting a new package, check it fits one of the five goals and the order; if not, ask Noah. About every five releases, send Noah a short course check with a/b questions.

## Privacy (never break)

- The repo is public. Never commit personal data: no Excel lists, backups, receipts, photos, GPX files, real bike specs, or anything from Noah's private folders.
- Tests, fixtures and screenshots use fictional data only.
- Health data is observation only. Do not name people, teams, studios or workshop staff.
- Secrets (for example the Strava client secret) live only in the Vercel environment, never in the code, chat or files.

## Every release PR

- Bump the version in `package.json` and `package-lock.json` (2 places). It must be higher than main; renumber when main has moved on.
- Update `src/lib/whatsnew.js` (2–4 points) and `src/lib/i18n/de/whatsnew.js`. Put the new version first in the `newerThan` list in `tests/whatsnew.test.js`; the list is strictly descending.
- Update `docs/projektstand.md`, `docs/status.md`, `docs/decisions.md`, `docs/roadmap.md`, `docs/design-audit.md` and `docs/vorhaben.md` (rules in `docs/README.md`).
- Every new UI text goes through `t('English')` and needs a German entry in `src/lib/i18n/de/*.js`, imported in `de/index.js`. The Gesamttest fails on English words in the German UI.
- Use the repo's PR template if there is one; otherwise start the body with «Before:» and «After:».
- **Was fällt weg oder rutscht tiefer** (Noah, 14.10.2026 «3a»): every release PR has this section. List what is no longer there and what moves behind «Mehr», into a fold or further down, with the old and the new way; write «nichts» if nothing does. A loss that Noah did not approve needs his answer before the merge.

## Tests

- `npm test`: vitest.
- `npx playwright test <spec> --workers=1`, with `E2E_PORT=52xx` and `E2E_SKIP_GESAMTTEST=1`, for your own specs plus `tests/e2e/guard.spec.js`.
- Before every PR, run locally only your own specs, the specs of the pages you changed and `guard.spec.js` (Noah, 11.10.2026 «1-5 a»). The full Gesamttest runs on GitHub. To run one shard by hand: `npx playwright test tests/e2e/gesamttest --project=desktop --shard=1/2 --workers=2`.
- Tests read their lists (blocks, categories, labels) from the app source instead of keeping copies.
- Afterwards run `git checkout -- qa/` (tests write screenshots there).
- Never skip, disable or loosen a test to get green. Fix the cause, or adapt the test when the UI changed on purpose.
- Test dates use calendar-day arithmetic in Europe/Zurich, never `Date.now() + n*864e5`.
- For «today» in app code, use `localDay()` (src/lib/localday.js), not `toISOString().slice(0,10)`.
