// Which phone tests does a PR need? (Noah 1.11.2026 «4a»)
// A PR that only changes docs, news files or whole spec files runs only its own specs (or none),
// not all 5 phone parts. Anything else, shared test helpers included (clock.js, lib.js), runs everything.
import { execFileSync } from 'node:child_process';

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

if (process.argv[1] && process.argv[1].endsWith('ci-scope.mjs')) {
  const base = process.argv[2];
  const out = execFileSync('git', ['diff', '--name-only', `origin/${base}...HEAD`], { encoding: 'utf8' });
  const r = scope(out.split('\n'));
  console.log(`mode=${r.mode}`);
  console.log(`specs=${r.specs.join(' ')}`);
}
