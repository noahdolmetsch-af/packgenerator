#!/usr/bin/env node
// Writes the tests that failed (or only passed on the second try = flaky) to the GitHub job summary, so that
// «which tests are unreliable?» can be read off the runs instead of guessed (thread «Merge-Stau», 31.10.2026).
// Input: the JSON report of Playwright (playwright.config.js, CI only). Never fails the job.
import { readFileSync, appendFileSync, writeFileSync, existsSync } from 'node:fs';

const file = process.argv[2] ?? 'pw-report.json';
const label = process.argv[3] ?? 'tests';
// Optional 4th argument (night run, 21.11.2026): a file that gets one line per FAILED test (flaky ones left out), so the
// morning report can say which tests are new red and which were red the night before (scripts/nacht-vergleich.mjs).
const namesOut = process.argv[4];

/** [{ title, status, project, retries }] for every test that is not a plain pass. */
export function troubled(report) {
  const out = [];
  const walk = (suite, trail) => {
    const here = suite.title && !suite.file ? [...trail, suite.title] : trail;
    for (const s of suite.suites ?? []) walk(s, here);
    for (const spec of suite.specs ?? []) {
      for (const t of spec.tests ?? []) {
        if (t.status === 'expected' || t.status === 'skipped') continue;
        out.push({ title: [...here, spec.title].join(' › '), file: `${spec.file}:${spec.line}`, specFile: spec.file, status: t.status, project: t.projectName, retries: (t.results?.length ?? 1) - 1 });
      }
    }
  };
  for (const s of report.suites ?? []) walk({ ...s, title: '' }, []);
  return out;
}

export function render(list, label) {
  if (!list.length) return '';
  const kind = (s) => (s === 'flaky' ? 'flaky (passed on retry)' : 'FAILED');
  return [`### ${label}: ${list.length} unreliable or failed`, '', ...list.map((t) => `- ${kind(t.status)} · ${t.project} · \`${t.file}\` ${t.title}`), ''].join('\n');
}

/** One stable line per failed test: «project · spec file · title». No line number: it moves with every edit. */
export function failedKeys(list) {
  return [...new Set(list.filter((t) => t.status !== 'flaky').map((t) => `${t.project} · ${t.specFile} · ${t.title}`))].sort();
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  if (existsSync(file)) {
    const list = troubled(JSON.parse(readFileSync(file, 'utf8')));
    if (namesOut) writeFileSync(namesOut, failedKeys(list).map((k) => `${k}\n`).join(''));
    const text = render(list, label);
    if (text) {
      console.log(text);
      if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${text}\n`);
    }
  }
}
