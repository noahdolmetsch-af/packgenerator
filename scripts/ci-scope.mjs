// Which phone tests does a PR need? (Noah 1.11.2026 «4a», Noah 05.11.2026 «3a ja»)
// - docs, news files, German text files, unit tests: no phone tests of their own (Noah: «Texte lösen nichts aus»).
// - whole spec files in the PR: these specs.
// - app code: the specs of the pages the changed files end in (scripts/ci-map.mjs, from the app's own imports).
//   A file that every page loads (the core), a file that ends nowhere we understand, or a shared test helper:
//   everything runs, as before.
// The «Kern» (CORE_SPECS) runs with every scoped PR, so a broken start or trip loop never slips through.
// The night run (volle-pruefung.yml) runs everything.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const SPEC = /^tests\/e2e\/(?:[\w-]+\/)*[\w.-]+\.spec\.js$/;
const SAFE = [
  /^docs\//, /^src\/lib\/news\//, /^[^/]+\.md$/, /^tests\/[\w.-]+\.test\.js$/,
  // the German texts (one file per area); index.js and the merged auto.gen.js stay out, they wire the files
  /^src\/lib\/i18n\/de\/(?!index\.js$|auto\.gen\.js$)[\w.-]+\.js$/,
];
const APP_CODE = [/^src\/(?:[\w.-]+\/)*[\w.-]+\.(?:js|svelte)$/, /^tests\/e2e\/(?:[\w-]+\/)*[\w.-]+\.js$/];

/** Always part of a scoped run: the Wächter and the whole trip loop. */
export const CORE_SPECS = ['tests/e2e/guard.spec.js', 'tests/e2e/flow.spec.js'];
/** More mapped specs than this: just run everything (it shards the same, and the map is not a gain). */
export const MAX_SPECS = 250;
/** One phone part per this many specs (at most 5 parts): a PR with a few specs does not take 5 computers. */
export const SPECS_PER_PART = 20;

/** `map(changedAppFiles)` → the specs they touch, or null (= unknown). Without it app code runs everything. */
export function scope(files, map = null) {
  const list = files.map((f) => f.trim()).filter(Boolean);
  if (!list.length) return { mode: 'all', specs: [], parts: 5 };
  const specs = list.filter((f) => SPEC.test(f));
  const rest = list.filter((f) => !SPEC.test(f) && !SAFE.some((re) => re.test(f)));
  if (!rest.length) return { mode: specs.length ? 'specs' : 'none', specs, parts: partsFor(specs) };
  if (!map || !rest.every((f) => APP_CODE.some((re) => re.test(f)))) return { mode: 'all', specs: [], parts: 5 };
  const mapped = map(rest);
  if (!mapped) return { mode: 'all', specs: [], parts: 5 };
  const all = [...new Set([...CORE_SPECS, ...specs, ...mapped])].sort();
  if (all.length > MAX_SPECS) return { mode: 'all', specs: [], parts: 5 };
  return { mode: 'specs', specs: all, parts: partsFor(all) };
}

export const partsFor = (specs) => Math.min(5, Math.max(1, Math.ceil(specs.length / SPECS_PER_PART)));

// «Ausprobieren» (tests/e2e/ausprobieren.spec.js) taps every line of «Was ist neu»; that grows with every PR
// (555 lines took 10 minutes). Noah 03.11.2026 «1a»: a PR taps only the lines of its own news files, the night
// run (volle-pruefung.yml) taps them all. Changes to what the lines run on (the update list, the go-map, the
// Ausprobieren code, the test helpers, the news pages) still tap all of them.
const NEWS_FILE = /^src\/lib\/news\/([a-z0-9][a-z0-9-]*\.js)$/;
const NEWS_MACHINERY = [
  /^src\/lib\/whatsnew\.js$/, /^src\/lib\/know\//, /^src\/lib\/news\/(?!(?:[a-z0-9][a-z0-9-]*\.js)$)/,
  /^src\/pages\/WasNeu\.svelte$/, /^src\/lib\/home\/NewsTile\.svelte$/,
  /^tests\/e2e\/(?:ausprobieren\.spec|clock|settle)\.js$/, /^tests\/e2e\/gesamttest\/lib\.js$/,
];

/** 'all', or the news files (names) whose lines «Ausprobieren» taps in a PR; '' = none. */
export function newsScope(files, exists = () => true) {
  const list = files.map((f) => f.trim()).filter(Boolean);
  if (!list.length || list.some((f) => NEWS_MACHINERY.some((re) => re.test(f)))) return 'all';
  return list.map((f) => NEWS_FILE.exec(f)?.[1]).filter((n) => n && exists(`src/lib/news/${n}`)).join(' ');
}

if (process.argv[1] && process.argv[1].endsWith('ci-scope.mjs')) {
  const base = process.argv[2];
  const out = execFileSync('git', ['diff', '--name-only', `origin/${base}...HEAD`], { encoding: 'utf8' });
  // the graph is built only when app code changed (about a second)
  const lines = out.split('\n');
  let r = scope(lines);
  if (r.mode === 'all' && lines.some((f) => f.trim())) {
    const { buildGraph, specsFor } = await import('./ci-map.mjs');
    const graph = buildGraph('.');
    r = scope(lines, (changed) => specsFor(changed, graph));
  }
  const specs = r.specs.filter((f) => existsSync(f)); // a spec deleted in the PR is not run
  console.log(`mode=${r.mode === 'specs' && !specs.length ? 'none' : r.mode}`);
  console.log(`specs=${specs.join(' ')}`);
  console.log(`parts=${r.parts}`);
  console.log(`news=${newsScope(lines, existsSync)}`);
}
