#!/usr/bin/env node
// Night run (volle-pruefung.yml), 21.11.2026 (Noah «d plus b»): says what is NEW red since the last night run.
// Until then the report only named «what is red» and the PRs since the last GREEN run. The night run was red
// every night from 3 to 21 November (one old issue with 21 comments), so a new red test hid between old ones and
// nobody saw it (tippzahl after #1302). Now: every job writes the names of its failed tests (scripts/test-summary.mjs,
// 4th argument); this script compares the names with the night before and the mail says only what is new.
// Usage: node scripts/nacht-vergleich.mjs <folder with rot-*.txt> <last night's list or -> <out: today's list> [jobs expected]
// Output: the German report on stdout; `neu`, `rot`, `erster` and `unvollstaendig` in $GITHUB_OUTPUT.
import { readFileSync, readdirSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const lines = (text) => text.split('\n').map((l) => l.trim()).filter(Boolean);

/** All names of failed tests in a folder (one file per job); `files` = how many job files there were. */
export function readToday(dir) {
  const names = existsSync(dir) ? readdirSync(dir).filter((f) => /^rot-.*\.txt$/.test(f) && f !== 'rot-liste.txt') : [];
  const set = new Set();
  for (const f of names) for (const l of lines(readFileSync(join(dir, f), 'utf8'))) set.add(l);
  return { set, files: names.length };
}

/**
 * today, before: Sets of test names (before = null when there is no list of the night before).
 * `incomplete`: a job left no list (it timed out or broke before the tests), so «green again» cannot be said.
 */
export function compare(today, before, incomplete = false) {
  if (!before) return { erster: true, neu: [], bleibt: [...today].sort(), behoben: [], unvollstaendig: incomplete };
  const neu = [...today].filter((t) => !before.has(t)).sort();
  const bleibt = [...today].filter((t) => before.has(t)).sort();
  const behoben = incomplete ? [] : [...before].filter((t) => !today.has(t)).sort();
  return { erster: false, neu, bleibt, behoben, unvollstaendig: incomplete };
}

const SHOW = 15;
const list = (items) => [...items.slice(0, SHOW).map((t) => `- ${t}`), ...(items.length > SHOW ? [`- … und ${items.length - SHOW} weitere`] : [])];

/** The report in short German for the issue comment. */
export function render(r) {
  const out = [];
  if (r.erster) {
    out.push(`**Erster Vergleich:** die ${r.bleibt.length} Tests, die heute rot sind, gelten ab jetzt als bekannt. Ab der nächsten Nacht steht hier nur, was neu rot ist.`);
  } else if (r.neu.length) {
    out.push(`**Neu rot seit der letzten Nacht (${r.neu.length}):**`, '', ...list(r.neu));
  } else {
    out.push('**Nichts Neues rot.**');
  }
  if (!r.erster && r.bleibt.length) out.push('', `Weiterhin rot wie in der letzten Nacht: ${r.bleibt.length} Tests.`);
  if (r.behoben.length) out.push('', `Wieder grün (${r.behoben.length}):`, '', ...list(r.behoben));
  if (r.unvollstaendig) out.push('', 'Hinweis: bei mindestens einem Teil fehlt die Liste (Zeitlimit oder Absturz vor den Tests); «wieder grün» kann deshalb heute nicht gesagt werden.');
  return `${out.join('\n')}\n`;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const [dir, beforeFile, outFile, expected] = process.argv.slice(2);
  const { set: today, files } = readToday(dir);
  const before = beforeFile && beforeFile !== '-' && existsSync(beforeFile) ? new Set(lines(readFileSync(beforeFile, 'utf8'))) : null;
  const incomplete = expected ? files < Number(expected) : false;
  const r = compare(today, before, incomplete);
  // an incomplete night keeps what was known, so a job that came back the next night does not report old red as new
  const keep = incomplete && before ? new Set([...today, ...before]) : today;
  writeFileSync(outFile, [...keep].sort().map((l) => `${l}\n`).join(''));
  process.stdout.write(render(r));
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `neu=${r.neu.length}\nrot=${today.size}\nerster=${r.erster ? 'yes' : 'no'}\nunvollstaendig=${incomplete ? 'yes' : 'no'}\n`);
  }
}
