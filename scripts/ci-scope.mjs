// Which phone tests does a PR need? (Noah 1.11.2026 «4a», Noah 05.11.2026 «3a ja», Noah 22.11.2026 «a»)
// - docs, news files, German text files, unit tests: no phone tests of their own (Noah: «Texte lösen nichts aus»).
// - whole spec files in the PR: these specs.
// - app code and styles: the specs of the pages the changed files end in (scripts/ci-map.mjs, from the app's own
//   imports) plus the Kern. A file that every page loads or that ends nowhere we understand now runs the Kern
//   alone (the quick check, about 10 minutes), no longer everything.
// - «Schwer» (HEAVY): data, backup, sync, storage, import/export, api/, build and workflow files, and anything we
//   do not understand: everything runs, as before.
// - Noah 24.11.2026 «a» (thread «Tests schneller machen»): a «Schwer» PR no longer runs everything on every push. Until it
//   gets the label «voll» (Claude sets it right before the merge) it runs the quick stage: the Kern, the specs of its own
//   pages, and the data specs (DATA_SPEC_NAME: backup, sync, trash, import …). With «voll» it runs all five parts, as before.
//   «e2e (phone)» stays red for a Schwer PR until «voll» is on it and its run is green (the gate in deploy.yml), so nothing
//   Schwer is merged without the full check. The reason: one PR ran the full check five times, once per push, 170 runner
//   minutes each, and the 20 GitHub computers were busy for everyone.
// The «Kern» (CORE_SPECS) runs with every scoped PR, so a broken start or trip loop never slips through.
// The night run (volle-pruefung.yml) runs everything: a mistake the quick check misses shows there the next morning.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

const SPEC = /^tests\/e2e\/(?:[\w-]+\/)*[\w.-]+\.spec\.js$/;
const SAFE = [
  /^docs\//, /^src\/lib\/news\//, /^[^/]+\.md$/, /^tests\/[\w.-]+\.test\.js$/,
  // the German texts (one file per area); index.js and the merged auto.gen.js stay out, they wire the files
  /^src\/lib\/i18n\/de\/(?!index\.js$|auto\.gen\.js$)[\w.-]+\.js$/,
];
// Noah 22.11.2026 «a»: a small PR (text, view, tests, docs) gets the quick check; a PR that touches data, backup, sync,
// the storage structure or api/ is still checked in full on every PR. Decided by the changed paths, not by hand.
// A name that only looks like data (a word with «async» in it) just runs the full check: the safe side.
export const HEAVY = [
  /^api\//, /^src\/lib\/(?:sync|maintenance|booking)\//,
  /(?:^|\/)db[\w.-]*\.(?:js|svelte)$/, /db\.(?:js|svelte)$/,
  /backup|sync|migrat|snapshot|dexie|persist|storage|import|export/i,
  /^(?:package(?:-lock)?\.json|vite\.config\.js|playwright\.config\.js|svelte\.config\.js|vercel\.json|index\.html)$/,
  /^\.github\//, /^scripts\//, /^public\//,
];
// styles are a view: no page of their own to map, the Kern looks at every page
const VIEW = [/^src\/(?:[\w.-]+\/)*[\w.-]+\.css$/];
const APP_CODE = [/^src\/(?:[\w.-]+\/)*[\w.-]+\.(?:js|svelte)$/, /^tests\/e2e\/(?:[\w-]+\/)*[\w.-]+\.js$/];

/**
 * Always part of a scoped run: the Wächter and the whole trip loop.
 * 21.11.2026 (Noah «d plus b»): the app-wide Wächter run with EVERY PR that changes app code, not only when its pages
 * are touched. tippzahl.spec.js went red on main after #1302 and nobody saw it for days, because a PR ran only the
 * specs of its own pages. These check the whole app: every function at most 3 taps from Heute (tippzahl), every
 * function reachable and its page open without an error (functions), every function visible on its home page
 * (heimat), no dead button (tote-knoepfe). seitengroesse.spec.js is the same kind but runs on the computer; it joins
 * the «e2e (desktop)» job of deploy.yml as soon as main is green on it again (21.11.2026: #/me/abfragen is over its
 * budget). A new Wächter of this kind goes into this list.
 */
export const CORE_SPECS = [
  'tests/e2e/guard.spec.js',
  'tests/e2e/flow.spec.js',
  'tests/e2e/tippzahl.spec.js',
  'tests/e2e/functions.spec.js',
  'tests/e2e/heimat.spec.js',
  'tests/e2e/tote-knoepfe.spec.js',
];
/** More mapped specs than this: just run everything (it shards the same, and the map is not a gain). */
export const MAX_SPECS = 250;
/** One phone part per this many specs (at most 5 parts): a PR with a few specs does not take 5 computers. */
export const SPECS_PER_PART = 20;

/** `map(changedAppFiles)` → the specs they touch, or null (= unknown). Without it app code is not decided yet ('all'). */
export function scope(files, map = null) {
  const list = files.map((f) => f.trim()).filter(Boolean);
  if (!list.length) return { mode: 'all', specs: [], parts: 5 };
  // data, backup, sync, storage, api, build: the full check on every PR (Noah 22.11.2026 «a»); docs, news, German texts
  // and specs are judged by their own rules, whatever their names say
  const specs = list.filter((f) => SPEC.test(f));
  const rest = list.filter((f) => !SPEC.test(f) && !SAFE.some((re) => re.test(f)));
  if (rest.some((f) => HEAVY.some((re) => re.test(f)))) return { mode: 'all', specs: [], parts: 5 };
  if (!rest.length) return { mode: specs.length ? 'specs' : 'none', specs, parts: partsFor(specs) };
  const code = rest.filter((f) => APP_CODE.some((re) => re.test(f)));
  // something that is neither app code, a style, docs nor a spec: not understood, run everything
  if (rest.some((f) => !APP_CODE.some((re) => re.test(f)) && !VIEW.some((re) => re.test(f)))) return { mode: 'all', specs: [], parts: 5 };
  if (!map) return { mode: 'all', specs: [], parts: 5 }; // the caller builds the map and asks again
  // a start file, a file that ends nowhere or a file that reaches (nearly) every spec: the Kern alone is the quick check
  let mapped = code.length ? map(code) : [];
  if (!mapped || mapped.length > MAX_SPECS) mapped = [];
  const all = [...new Set([...CORE_SPECS, ...specs, ...mapped])].sort();
  return { mode: 'specs', specs: all, parts: partsFor(all) };
}

/** Specs about data, backup, sync, the trash and import/export (by file name): the quick stage of a «Schwer» PR runs them. */
export const DATA_SPEC_NAME = /backup|sync|abgleich|import|export|storage|migrat|dexie|persist|snapshot|papierkorb|restore|daten|offline|(?:^|[-.])wartung|speicher|trash|geloescht/i;
/** Folders of tests/e2e that never run in a PR (playwright.config.js testIgnore). */
const NOT_IN_PR = /(?:^|\/)(?:gesamttest|nachtrundgang|live|tmp-durchklick)(?:\/|$)/;

/** Every spec file of a PR run, as a path from the repository root (reads tests/e2e). */
export function allSpecFiles(dir = 'tests/e2e', read = (d) => readdirSync(d, { withFileTypes: true })) {
  const out = [];
  for (const e of read(dir)) {
    const path = `${dir}/${e.name}`;
    if (NOT_IN_PR.test(path)) continue;
    if (e.isDirectory()) out.push(...allSpecFiles(path, read));
    else if (SPEC.test(path)) out.push(path);
  }
  return out.sort();
}

/**
 * The quick stage of a «Schwer» PR: the Kern, the PR's own specs, the specs of the pages it changed (when the map knows
 * them) and the data specs by name. `map(changedAppFiles)` as in `scope`; `all` = the list of spec files to pick from.
 */
export function quickStage(files, map = null, all = allSpecFiles()) {
  const list = files.map((f) => f.trim()).filter(Boolean);
  const own = list.filter((f) => SPEC.test(f));
  const code = list.filter((f) => APP_CODE.some((re) => re.test(f)) && !SPEC.test(f));
  let mapped = map && code.length ? map(code) : [];
  if (!mapped || mapped.length > MAX_SPECS) mapped = [];
  const data = all.filter((f) => DATA_SPEC_NAME.test(f.slice(f.lastIndexOf('/') + 1)));
  const specs = [...new Set([...CORE_SPECS, ...own, ...mapped, ...data])].sort();
  return { mode: 'specs', specs, parts: partsFor(specs) };
}

/**
 * Shared parts (Noah «1-8» 26.11.2026, step 5 of the test plan, thread «Tests schneller machen»): the side bar, the tabs, the page
 * head, the window system (sheet form, delete/rename/move sheets, the fixed foot) and the global styles are loaded by every
 * page. The map (scripts/ci-map.mjs) cannot narrow them, so until now such a PR ran the Kern alone, and the tests of OTHER
 * areas that hang on them went red only in the night run (the 20 red tests of 26.11.: PR 1759 side bar, PR 1762 fixed foot,
 * PR 1783 «Mehr dazu»). Now a change to one of these parts also runs the Wächter that look at every page and every window, and every
 * spec whose own text names what the part draws (`probe`, read from the spec files, no hand-kept list of specs).
 * A part that is renamed must be fixed here: tests/ci-scope.test.js checks that every pattern still matches a file.
 */
export const SHARED_PARTS = [
  {
    name: 'nav',
    files: [
      /^src\/lib\/nav\/(?:SideBar|PlaceTabs|PlaceBar|PlaceIcon|MiniBar|TabTitle|SkipLink|MeButton|HelpButton)\.svelte$/,
      /^src\/lib\/nav\/(?:seiten|tabtitle|tabinfo|zurueck|wege)(?:\.svelte)?\.js$/,
      /^src\/lib\/ui\/(?:PageHead|PathHead|Crumbs|Pfad)\.svelte$/,
    ],
    probe: /ptabs|\.side\b|minibar|crumbs|breadcrumb|PlaceTabs|SideBar|tabs:visible/i,
  },
  {
    name: 'fenster',
    files: [
      /^src\/lib\/ui\/(?:Form|DeleteSheet|GroupDeleteSheet|MoveSheet|RenameSheet|ShiftSheet|ChallengeSheet|MainBar)\.svelte$/,
      /^src\/lib\/ui\/(?:daumen|fe-seiten|touch)\.css$/,
      /^src\/lib\/ui\/(?:backdrop|backclose)\.js$/,
      /^src\/lib\/flow\/\w+Sheet\.svelte$/,
    ],
    probe: /\.sheet\b|sheet-|daumen|form-foot/,
  },
  { name: 'stil', files: [/^src\/app\.css$/], probe: null },
];
/** The Wächter that look at every page and window: they run with every shared part. */
export const SHARED_WAECHTER = [
  'tests/e2e/fenster-nie-abgeschnitten.spec.js', 'tests/e2e/wege-waechter.spec.js', 'tests/e2e/a11y.spec.js',
  'tests/e2e/daumen.spec.js', 'tests/e2e/seitengroesse.spec.js', 'tests/e2e/bedienregeln.spec.js',
];

/** A helper imported by more specs than this is not a narrow link (settle.js, clock.js are in nearly every spec). */
export const HELPER_MAX = 60;

/** The helper files of tests/e2e (a locator kept in one place, like placetab.js), not specs. */
function helperFiles(dir = 'tests/e2e') {
  return readdirSync(dir, { withFileTypes: true }).filter((e) => e.isFile() && /\.js$/.test(e.name) && !SPEC.test(`${dir}/${e.name}`)).map((e) => `${dir}/${e.name}`);
}

/**
 * The shared parts a PR changes, and the extra specs they ask for (`all` = the spec files a PR run can pick from).
 * A spec counts when its own text matches the probe, or when it imports a helper (`./placetab.js`) whose text does: the
 * tabs of the side bar are looked up in one helper, and the five red tests of PR 1759 reached them only through it.
 */
export function sharedSpecs(files, all = allSpecFiles(), read = (f) => readFileSync(f, 'utf8'), helpers = helperFiles()) {
  const list = files.map((f) => f.trim()).filter(Boolean);
  const hit = SHARED_PARTS.filter((p) => list.some((f) => p.files.some((re) => re.test(f))));
  if (!hit.length) return { parts: [], specs: [] };
  const specs = new Set(SHARED_WAECHTER.filter((f) => all.includes(f)));
  for (const p of hit) {
    if (!p.probe) continue;
    const names = helpers.filter((h) => p.probe.test(read(h))).map((h) => h.slice(h.lastIndexOf('/') + 1));
    const texts = new Map(all.map((f) => [f, read(f)]));
    const uses = (text, h) => text.includes(`'./${h}'`) || text.includes(`"./${h}"`);
    // a helper that most specs import (settle.js) cannot narrow anything: it is left out
    const viaHelper = names.filter((h) => [...texts.values()].filter((t) => uses(t, h)).length <= HELPER_MAX);
    for (const [f, text] of texts) if (p.probe.test(text) || viaHelper.some((h) => uses(text, h))) specs.add(f);
  }
  return { parts: hit.map((p) => p.name), specs: [...specs].sort() };
}

export const partsFor = (specs) => Math.min(5, Math.max(1, Math.ceil(specs.length / SPECS_PER_PART)));

// «Ausprobieren» (tests/e2e/ausprobieren.spec.js) taps every line of «Was ist neu»; that grows with every PR
// (555 lines took 10 minutes). Noah 03.11.2026 «1a»: a PR taps only the lines of its own news files, the night
// run (volle-pruefung.yml) taps them all. Changes to what the lines run on (the update list, the go-map, the
// Ausprobieren code, the test helpers, the news pages) tap the newest 200 lines and their own (since 25.11.2026, see below).
const NEWS_FILE = /^src\/lib\/news\/([a-z0-9][a-z0-9-]*\.js)$/;
const NEWS_MACHINERY = [
  /^src\/lib\/whatsnew\.js$/, /^src\/lib\/know\//, /^src\/lib\/news\/(?!(?:[a-z0-9][a-z0-9-]*\.js)$)/,
  /^src\/pages\/WasNeu\.svelte$/, /^src\/lib\/home\/NewsTile\.svelte$/,
  /^tests\/e2e\/(?:ausprobieren\.spec|clock|settle)\.js$/, /^tests\/e2e\/gesamttest\/lib\.js$/,
];

// 24.11.2026 (Noah «a» on the card of 25.11.2026 01:03, thread «Tests schneller machen»): when a PR changes the machinery, it
// no longer taps ALL ~1400 lines (85 tests, an hour of work: PR 1640 ran into the time limit of part 1 three times) but the
// newest NEWEST_LINES lines plus the lines of its own news files; the night run still taps every line (it is the safety net).
// This changes Noah's rule of 03.11.2026 («when the machinery changes, all lines»).
export const NEWEST_LINES = 200;

/** 'all' (nothing known), or the words «Ausprobieren» works from in a PR: the news files whose lines it taps, and
 *  `newest:N` (the newest N lines) when the machinery changed; '' = none. */
export function newsScope(files, exists = () => true) {
  const list = files.map((f) => f.trim()).filter(Boolean);
  if (!list.length) return 'all';
  const own = list.map((f) => NEWS_FILE.exec(f)?.[1]).filter((n) => n && exists(`src/lib/news/${n}`));
  if (list.some((f) => NEWS_MACHINERY.some((re) => re.test(f)))) return [`newest:${NEWEST_LINES}`, ...own].join(' ');
  return own.join(' ');
}

if (process.argv[1] && process.argv[1].endsWith('ci-scope.mjs')) {
  const base = process.argv[2];
  const voll = process.argv.includes('--voll'); // the label «voll» is on the PR: a Schwer PR runs everything
  const out = execFileSync('git', ['diff', '--name-only', `origin/${base}...HEAD`], { encoding: 'utf8' });
  // the graph is built only when app code changed (about a second)
  const lines = out.split('\n');
  let r = scope(lines);
  let graph = null;
  const map = async () => {
    if (!graph) {
      const { buildGraph, specsFor } = await import('./ci-map.mjs');
      const g = buildGraph('.');
      graph = (changed) => specsFor(changed, g);
    }
    return graph;
  };
  if (r.mode === 'all' && lines.some((f) => f.trim())) r = scope(lines, await map());
  // «Schwer»: still everything after the map had its say (data, backup, sync, api/, build files, not understood)
  const schwer = r.mode === 'all';
  if (schwer && !voll) r = quickStage(lines, await map());
  // a shared part (side bar, window system, styles) also runs the Wächter and the specs that name what it draws (not when everything runs)
  const shared = r.mode === 'specs' ? sharedSpecs(lines) : { parts: [], specs: [] };
  if (shared.specs.length) {
    const merged = [...new Set([...r.specs, ...shared.specs])].sort();
    r = { ...r, specs: merged, parts: partsFor(merged) };
  }
  const specs = r.specs.filter((f) => existsSync(f)); // a spec deleted in the PR is not run
  console.log(`mode=${r.mode === 'specs' && !specs.length ? 'none' : r.mode}`);
  console.log(`specs=${specs.join(' ')}`);
  console.log(`parts=${r.parts}`);
  console.log(`news=${newsScope(lines, existsSync)}`);
  console.log(`shared=${shared.parts.join(',')}`);
  console.log(`schwer=${schwer ? 'yes' : 'no'}`); // yes: «e2e (phone)» is green only with the label «voll» and its full run
}
