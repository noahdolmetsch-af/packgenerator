#!/usr/bin/env node
// Writes the tests that failed (or only passed on the second try = flaky) to the GitHub job summary, so that
// «which tests are unreliable?» can be read off the runs instead of guessed (thread «Merge-Stau», 31.10.2026).
// Input: the JSON report of Playwright (playwright.config.js, CI only). Never fails the job.
import { readFileSync, appendFileSync, existsSync } from 'node:fs';

const file = process.argv[2] ?? 'pw-report.json';
const label = process.argv[3] ?? 'tests';

/** [{ title, status, project, retries }] for every test that is not a plain pass. */
export function troubled(report) {
  const out = [];
  const walk = (suite, trail) => {
    const here = suite.title && !suite.file ? [...trail, suite.title] : trail;
    for (const s of suite.suites ?? []) walk(s, here);
    for (const spec of suite.specs ?? []) {
      for (const t of spec.tests ?? []) {
        if (t.status === 'expected' || t.status === 'skipped') continue;
        out.push({ title: [...here, spec.title].join(' › '), file: `${spec.file}:${spec.line}`, status: t.status, project: t.projectName, retries: (t.results?.length ?? 1) - 1 });
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

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  if (existsSync(file)) {
    const text = render(troubled(JSON.parse(readFileSync(file, 'utf8'))), label);
    if (text) {
      console.log(text);
      if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${text}\n`);
    }
  }
}
