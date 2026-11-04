// Which phone tests does a PR need? (Noah 1.11.2026 «4a»)
// A PR that only changes docs, news files or whole spec files runs only its own specs (or none),
// not all 5 phone parts. Anything else, shared test helpers included (clock.js, lib.js), runs everything.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const SPEC = /^tests\/e2e\/(?:[\w-]+\/)*[\w.-]+\.spec\.js$/;
const SAFE = [/^docs\//, /^src\/lib\/news\//, /^[^/]+\.md$/, /^tests\/[\w.-]+\.test\.js$/];

export function scope(files) {
  const list = files.map((f) => f.trim()).filter(Boolean);
  if (!list.length) return { mode: 'all', specs: [] };
  const specs = list.filter((f) => SPEC.test(f));
  const rest = list.filter((f) => !SPEC.test(f));
  if (rest.every((f) => SAFE.some((re) => re.test(f)))) return { mode: specs.length ? 'specs' : 'none', specs };
  return { mode: 'all', specs: [] };
}

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
  const r = scope(out.split('\n'));
  console.log(`mode=${r.mode}`);
  console.log(`specs=${r.specs.join(' ')}`);
  console.log(`news=${newsScope(out.split('\n'), existsSync)}`);
}
