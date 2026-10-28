# Pack Generator: instructions for Claude

Personal tour-preparation PWA for Noah: plan, pack, ride, debrief, bike care. It is built with Svelte 5, Vite and Dexie (IndexedDB) and works offline. It is live on GitHub Pages; each PR also gets a Vercel preview.

Noah writes German and is not a developer. Write replies to him in short, simple German, and explain GitHub steps click by click. The app's source language is English, and the German texts go through `t()`.

## Current rules (Noah, 26.10.2026 evening, binding, above everything else)

These are the only rules. They replace every older rule here, in `docs/arbeitsweise.md`, in project memory and in older skill texts (bundles, «Noah merges himself», «no ★», Heute N2 protected, length budgets, ideas per release). The project instruction in Claude only points here; project memory keeps the current state, not rules. German summary: `docs/arbeitsweise.md`, section «Stand 26.10.2026 abends». Source: thread «Verschlanken App, Tests und Speicher», Noah 26.10.2026 20:31–20:38 UTC.

1. **Goal:** «Eine App, die mich im Alltag unterstützt.» Every change serves one of the six goals in `docs/vorhaben.md`; if not, ask Noah.
2. **Small PRs for everything, no bundles** (Noah «3a, kleinere PRs ab sofort für alles, damit wir agiler sind»). One change, one PR, its own version. No bundler thread, no collecting.
3. **Screenshots + test link, then Noah approves, then Claude merges** (Noah «1b, claude merged selber, aber alles erst nachdem ich die screenshots dazu freigegeben habe»). Every PR, once CI is green, gets screenshots of what changed (phone 390 px + computer 1440 px, fictional data) and 2–4 check steps. Since 27.10.2026 (Noah «1a») Noah checks on the real page after the merge, not on a Vercel test link (the check steps say where to look once it is online). Claude merges only after Noah approved **that** PR («ok 266», a tap on «Freigeben»). A PR with nothing visible (CI, tests) says so and needs Noah's ok too. After the merge: check Pages green (and the Vercel server «packgen» READY when `api/` changed), then one line «Online: …». Never auto-merge. Dependabot and watcher repairs follow the same way. A change to the data storage (Dexie schema, backup format) is first checked with a copy of a backup.
4. **Mockups only for big things** (a new page or flow like the Live-Karte). Everything else: build, then screenshots.
5. **Questions:** at most 5 per round, a/b written out, **with Claude's recommendation ★**. Ask what you need up front, then work on your own and come back with proposed solutions.
6. **No page-length requirements** (Noah «keine anforderung an eine länge der seite»): no screen budgets, no «max N screens», no «first screen» rules. **Heute** is treated like every other page (no protected layout).
7. **Every PR** has «Was fällt weg oder rutscht tiefer» and «Was ist neu» (Noah «4a»; in the app the «Neu» tile sits at the bottom of Heute). No new ideas per release. Course check once a week in the Sunday brief.
8. **Order:** Noah says what comes next. «zurück» = revert that PR at once. While a PR waits for CI or for Noah's check, go on with the next planned step as the next small PR (Noah 27.10.2026 00:14 UTC «sobald ein thread am warten ist auf einen PR (testen), soll er immer gleich mit den nächsten sinnvollen und geplanten schritten bereits weiter machen»).
9. **Quiet:** speak only with a result, a blocker or a question, in short German. No status posts at fixed times. When Noah asks what is open, name at most 3 items.
10. **Free and private:** zero costs; private data only outside the repo, no real names.
11. **Always:** everything is a suggestion and changeable; every kind of data and group can be added, renamed and deleted, with Undo; reorder with arrows and drag; explanatory text wherever users could get lost.
12. **Documentation on GitHub for every release** (Noah 26.10.2026 21:19 UTC «bitte immer dokumentation zu jedem release auf github ablegen»): since 27.10.2026 (version at merge time, rule 13) every PR adds **its own file** `docs/releases/<name>.md` (template `docs/releases/README.md`: what changed, «Was fällt weg», «Selbst entschieden», decisions, roadmap/vorhaben state) and its news file `src/lib/news/<name>.js`, both with the same name. `docs/roadmap.md`, `docs/vorhaben.md` and `docs/decisions.md` change only where their content changes (a plan, a rule), never with a version number or a «Stand:» line. A PR without an app change (CI, tests, rules) still adds its release file. After the merge, memory keeps only the state.
13. **Version number at merge time** (Noah 27.10.2026 «1a»): a PR never changes the version in `package.json`/`package-lock.json`, never adds to the top of `src/lib/whatsnew.js` or to the `newerThan` list, and never writes a version in docs or `SINCE`. `scripts/news.mjs` numbers each merge by its order on `main` (with a news file 0.233.0, without 0.233.1); the PR's checks already show the number it gets if it merges next, and «Online: 0.233.0 …» names it after the merge. So open PRs never conflict over the version and never need «renumber» or a new 45-minute test run for it. How: `src/lib/news/README.md`.

## How we work

- Small decisions you take yourself go in the PR under «Selbst entschieden».
- Everything in the app is a suggestion: never mandatory, always changeable and deselectable.
- A Vercel rate-limit red does not block. Open PRs are no longer renumbered (rule 13); merge main into a PR only when GitHub shows a real conflict. After a merge, tell Noah in one short German line what is new online.
- **Groups everywhere** (Noah, 18.10.2026 «grundsätzlich überall»): every group the user sees or chooses can be renamed and deleted. Deleting asks where the contents go, with «Ohne Gruppe» preselected, and then offers Undo. It never deletes the contents. Names the user typed never go through `t()`. A new kind of group comes with rename and delete and goes in `GROUP_PLACES` (`src/lib/groups.js`), which the guard test `tests/groups.test.js` checks. Use `src/lib/ui/GroupDeleteSheet.svelte` for the delete question.
- **Pages load later** (Tempo, 19.10.2026): only Heute (`Home.svelte`) is imported at the start. A new page goes into `PAGES` in `src/App.svelte` as `Name: () => import('./pages/Name.svelte')` and is shown with `<LazyPage load={PAGES.Name} />` (`src/lib/nav/lazy.js`). Big tools (PDF, text recognition, image models, video) load with `await import()` on first use. The build stops when a JS file passes 3 MB (`scripts/size-guard.mjs`, guard test `tests/size-guard.test.js`).
- **Change everything yourself** (Noah, 19.10.2026 «alle daten können vom nutzer selber hinzugefügt, umbenannt oder gelöscht werden»): every kind of data the user sees can be added, renamed and deleted in the UI. Delete asks first in the app's own window (`askDelete`, never `confirm()`) and offers Undo (`deleteWithUndo`). Nothing is blocked because it is still used: the delete window asks where the dependent things go (e.g. a bike's trips, `src/lib/bikedelete.js`). App lists live in «Listen und Typen» (`STANDARD_LISTS` in `src/lib/standard.js`, applied in `src/lib/lists.js`). Open gaps: `notes/alles-bearbeiten/README.md` in the project folder.
- **Course check:** `docs/vorhaben.md` lists every planned project with its why and goals. Before starting, check it fits one of the six goals; if not, ask Noah. Once a week, the Sunday brief carries a short course check with a/b questions.

## Privacy (never break)

- The repo is public. Never commit personal data: no Excel lists, backups, receipts, photos, GPX files, real bike specs, or anything from Noah's private folders.
- Tests, fixtures and screenshots use fictional data only.
- Health data is observation only. Do not name people, teams, studios or workshop staff.
- Secrets (for example the Strava client secret) live only in the Vercel environment, never in the code, chat or files.

## Every PR

- No version bump (rule 13). Add `src/lib/news/<name>.js` (1–3 points, `test` with 2+ steps, German in `de`, new feature ids in `since`; see `src/lib/news/README.md`).
- Add `docs/releases/<name>.md` (same name, template in `docs/releases/README.md`); change `docs/roadmap.md`, `docs/vorhaben.md`, `docs/decisions.md`, `docs/design-audit.md` only where their content changes, without version numbers.
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
