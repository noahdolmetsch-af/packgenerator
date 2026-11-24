# Pack Generator: instructions for Claude

Personal tour-preparation PWA for Noah: plan, pack, ride, debrief, bike care. It is built with Svelte 5, Vite and Dexie (IndexedDB) and works offline. It is live on GitHub Pages; each PR also gets a Vercel preview.

Noah writes German and is not a developer. Write replies to him in simple German, and explain GitHub steps click by click. Since 24.11.2026 (Noah «aktuell immer eher zu knapp», R32 in `docs/regeln.md`) replies are fuller, not terse: say what happened, why, what it means for him and what comes next, in whole sentences. Every message links its thread, names the topic in words and explains every PR number in words, never numbers or abbreviations alone (R33). The app's source language is English, and the German texts go through `t()`.

**Before every request, read two files:**
1. `docs/app-stand.md` (Noah 03.11.2026: «jeder thread soll das und alles weitere projektrelevante immer vor jeder abfrage berücksichtigen»). It lists what the app can do, with the link of every function, the places, the data and the connections. Do not analyse again what it already says. If the code differs, the code is right and your PR corrects the file; `tests/appstand.test.js` fails on a dead link or a function that sits under no row.
2. `docs/regeln.md`, **the one source of the working rules** (goals, how we work with Noah, PRs and queue limits, approval and «Online», pictures, tests and CI, privacy, upkeep). Every rule there has its date and source. This file holds no working rules of its own; it holds the rules for the code. Noah's newest message in the thread beats both files. Older and replaced rules sit only in `docs/regeln-archiv.md`.

## Where things are

| Question | File |
|---|---|
| What does the app do? | `docs/app-stand.md` |
| How do we work, what is allowed when? | `docs/regeln.md` |
| Why does the app exist, which goals? | `docs/vorhaben.md` (six goals, Klarheit and Auffindbarkeit above them), `docs/leitfaden.md` (Noah's vision 23.11.2026; every change serves it) |
| What is a thing called? | `docs/namen.md` |
| What was decided, what was replaced? | `docs/decisions/<name>.md` (own file per PR), `docs/regeln-archiv.md` |

## Rules for the code

- **Groups everywhere** (Noah, 18.10.2026 «grundsätzlich überall»): every group the user sees or chooses can be renamed and deleted. Deleting asks where the contents go, with «Ohne Gruppe» preselected, and then offers Undo. It never deletes the contents. Names the user typed never go through `t()`. A new kind of group comes with rename and delete and goes in `GROUP_PLACES` (`src/lib/groups.js`), which the guard test `tests/groups.test.js` checks. Use `src/lib/ui/GroupDeleteSheet.svelte` for the delete question.
- **Pages load later** (Tempo, 19.10.2026): only Heute (`Home.svelte`) is imported at the start. A new page goes into `PAGES` in `src/App.svelte` as `Name: () => import('./pages/Name.svelte')` and is shown with `<LazyPage load={PAGES.Name} />` (`src/lib/nav/lazy.js`). Big tools (PDF, text recognition, image models, video) load with `await import()` on first use. The build stops when a JS file passes 3 MB (`scripts/size-guard.mjs`, guard test `tests/size-guard.test.js`).
- **Change everything yourself** (Noah, 19.10.2026 «alle daten können vom nutzer selber hinzugefügt, umbenannt oder gelöscht werden»): every kind of data the user sees can be added, renamed and deleted in the UI. **Delete (rule changed 24.11.2026, Noah «4a» on 23.11.2026 19:49, `docs/decisions/loeschen-rueckgaengig.md`):** what is quickly made again (an idea, a life phase, a weight, a place in a list, a photo) is deleted at once and offers Undo for 8 seconds (`UNDO_MS`, `offerDone`); things with a history (a question with answers, a group with contents, a bike, a tour) ask first in the app's own window (`askDelete`, never `confirm()`) and then offer Undo (`deleteWithUndo`). When unsure, ask. `confirm()` stays forbidden. Nothing is blocked because it is still used: the delete window asks where the dependent things go (e.g. a bike's trips, `src/lib/bikedelete.js`). App lists live in «Listen und Typen» (`STANDARD_LISTS` in `src/lib/standard.js`, applied in `src/lib/lists.js`). Open gaps: `notes/alles-bearbeiten/README.md` in the project folder.
- **Content first** (Noah 21.11.2026 «5a»; user criterion R3 in `docs/regeln.md`): help never stands before the content of a page. A page starts with what the user came for. Help is one closed line («Was du hier tun kannst» opens the «?» window, Noah 22.11.2026 «so lassen – immer zugeklappt», and it stays) and «Alle Funktionen von …» at the page end (V7). No new card, tile field or hint line above the content; a hint line inside the content only on Heute. A new function's jump-off and «Gut zu wissen» go into these existing help places (a «Passt hier» row, the «?» window, the line at the page end), never as a new block on top. This loosens Fertig-Regel points (2) and (3): they are met by those places.
- **Course check:** `docs/vorhaben.md` lists every planned project with its why and goals. Before starting, check it fits one of the six goals and the Leitfaden; if not, ask Noah (R1). Once a week, the Sunday brief carries a short course check with a/b questions.

## Privacy (never break)

- The repo is public. Never commit personal data: no Excel lists, backups, receipts, photos, GPX files, real bike specs, or anything from Noah's private folders.
- Tests, fixtures and screenshots use fictional data only.
- Health data is observation only. Do not name people, teams, studios or workshop staff.
- Secrets (for example the Strava client secret, the ICS token) live only in the Vercel environment, never in the code, chat or files.
- Private files live only in `/mnt/project-files/private/`. (Rule R26 in `docs/regeln.md`.)

## Every PR

- **Version number at merge time** (Noah 27.10.2026 «1a»): a PR never changes the version in `package.json`/`package-lock.json`, never adds to the top of `src/lib/whatsnew.js` or to the `newerThan` list, and never writes a version in docs or `SINCE`. `scripts/news.mjs` numbers each merge by its order on `main` (with a news file 0.233.0, without 0.233.1); the PR's checks already show the number it gets if it merges next, and «Online: 0.233.0 …» names it after the merge. Open PRs never conflict over the version. How: `src/lib/news/README.md`.
- Add `src/lib/news/<name>.js` (1–3 points, `test` with 2+ steps, German in `de`, new feature ids in `since`; see `src/lib/news/README.md`).
- Add `docs/releases/<name>.md` (same name, template in `docs/releases/README.md`: what changed, «Was fällt weg», «Selbst entschieden», decisions, roadmap/vorhaben state). A PR without an app change (CI, tests, rules) still adds its release file. `docs/roadmap.md`, `docs/vorhaben.md`, `docs/design-audit.md` change only where their content changes (a plan), without version numbers or a «Stand:» line.
- A decision (Noah's answers, a rule, a rejection with its reason) goes in **its own file** `docs/decisions/<name>.md`, same name as the release file (Noah 21.11.2026 «2a», see `docs/decisions/README.md`); `docs/decisions.md` is history up to that date and gets no more lines. A new or changed **working rule** goes into `docs/regeln.md` with its date and source (the old one into `docs/regeln-archiv.md`).
- `docs/app-stand.md`: every PR that changes what the app does updates it (no version number, no count).
- A new function in `src/lib/features.js` also goes into `FEATURE_MOMENTS` in `src/lib/moment.js` (its moment, or `app`); `tests/moment.test.js` checks it.
- **Names** (Noah 08.11.2026 «namen ok»): one word per thing, the list is `docs/namen.md`. Use its word in every new text; a new thing gets its row there.
- Every new UI text goes through `t('English')` and needs a German entry in `src/lib/i18n/de/*.js`, imported in `de/index.js`. The Gesamttest fails on English words in the German UI. `tests/de-luecken.test.js` fails on any `t()`/`tn()` text without a German entry.
- Use the repo's PR template if there is one; otherwise start the body with «Before:» and «After:», and add «Was fällt weg oder rutscht tiefer» (R20 in `docs/regeln.md`; write «nichts» if nothing does).
- **Fertig-Regel** (Wegweiser step 25, Noah 01.11.2026 «speichere schritt 1-26 als geplant … freigabe»): a new function is done only when it has all six: (1) **page**: its entry in `src/lib/features.js` with handbook steps and an example; (2) **jump-off**: a link from the place where the need arises, not only from finder pages (a «Passt hier» row in `PASST_HIER`, `src/lib/passthier.js`, or a link on the page), never as a new block above the content (Content first); `tests/absprung.test.js` fails otherwise, and `NO_JUMP` may only get shorter; (3) **content**: on a page with the card «Was du hier tun kannst» (`ON_PAGES`, `src/lib/seiteninhalt.js`) a «Gut zu wissen» text in `src/lib/wissen/<area>.js` with German (`tests/wissen.test.js`) (it shows in the closed help line, not on top of the page); (4) **empty state**: an empty view says why it is empty and offers the next action (`src/lib/ui/Empty.svelte`); (5) **next step**: after its main action the page points to what usually comes next (like «Als Nächstes» after the debrief); (6) **app state**: a new page or group of functions gets its row in `docs/app-stand.md` (name, link, one line; no version number, no count), `tests/appstand.test.js` fails otherwise. A part left out goes in the PR under «Selbst entschieden» with the reason.
- Small decisions you take yourself go in the PR under «Selbst entschieden».

## Tests

(The rules about tests, CI and flaky tests are R21–R25 and R31 in `docs/regeln.md`; here are the commands. R31: before a PR that changes a page, search `tests/` for every test that touches that page, also from other areas, and run them locally.)

- `npm test`: vitest.
- `npx playwright test <spec> --workers=1`, with `E2E_PORT=52xx` and `E2E_SKIP_GESAMTTEST=1`, for your own specs plus `tests/e2e/guard.spec.js`. In the cloud container: `PW_CHROMIUM=/opt/pw-browsers/chromium` and `--trace off`.
- A PR first runs only `build` and `e2e (desktop)` (the Wächter). The label `ok` starts `e2e (phone)` (5 parts); it runs only the specs of the pages the PR touches (`scripts/ci-map.mjs`, from the app's own imports, plus the Kern `flow.spec.js` and `guard.spec.js`); a file every page loads, an unclear case, build or workflow files run everything, docs/news/German text files alone run none. Merge only when it ran green on the current head. The night run is the safety net.
- To run one shard by hand: `npx playwright test tests/e2e/gesamttest --project=desktop --shard=1/2 --workers=2`.
- Tests read their lists (blocks, categories, labels) from the app source instead of keeping copies.
- Afterwards run `git checkout -- qa/` (tests write screenshots there).
- Test dates use calendar-day arithmetic in Europe/Zurich, never `Date.now() + n*864e5`. Test titles are ASCII only (no ü ä ö « »).
- For «today» in app code, use `localDay()` (src/lib/localday.js), not `toISOString().slice(0,10)`.
