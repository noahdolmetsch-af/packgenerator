// Gesamttest: a short summary of a Playwright JSON report (PLAYWRIGHT_JSON_OUTPUT_NAME=… --reporter=json).
//   node tests/fixtures/gesamttest/report.mjs <report.json>
// Prints passed / failed / expected-to-fail counts and one line per failing check (message head).
import { readFileSync } from 'node:fs';

const rep = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const out = { passed: 0, failed: 0, expectedFail: 0, skipped: 0, flaky: 0 };
const lines = [];
const strip = (s) => String(s ?? '').replace(/\u001b\[[0-9;]*m/g, '');
function walk(suite, path = []) {
  for (const s of suite.suites ?? []) walk(s, [...path, s.title]);
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests ?? []) {
      const r = t.results?.at(-1);
      if (t.status === 'skipped') out.skipped++;
      else if (t.status === 'expected' && t.expectedStatus === 'failed') out.expectedFail++;
      else if (t.status === 'expected') out.passed++;
      else if (t.status === 'flaky') out.flaky++;
      else {
        out.failed++;
        for (const e of r?.errors ?? []) {
          const all = strip(e.message).split('\n');
          const head = all.filter((l) => l.trim() && !/^\s*(Expected|Received|\+|-|at |Call log|Timeout|expect\()/.test(l)).slice(0, 2);
          const got = all.filter((l) => /^\+\s{2,}\S/.test(l)).map((l) => l.replace(/^\+\s+/, '').trim()).slice(0, 6);
          const recv = all.filter((l) => /^Received:/.test(l)).slice(0, 1);
          const msg = [...head, ...recv, ...got].join(' | ');
          lines.push(`${t.projectName} | ${spec.title} | ${msg.slice(0, 400)}`);
        }
      }
    }
  }
}
for (const s of rep.suites) walk(s);
console.log(JSON.stringify(out));
for (const l of lines) console.log(l);
