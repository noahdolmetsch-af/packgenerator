#!/usr/bin/env node
// Wobbly list (Noah 21.11.2026 «4», thread «Prüfungen so einrichten, dass main grün bleibt»): a test that is red once and green on the
// retry used to vanish («flaky») and was started again. Now every night run keeps a list of the tests that wobbled, counts the
// nights, and a test that wobbles on a SECOND night is a work order: find the cause and repair it within a day.
// Usage: node scripts/wackel-liste.mjs <folder with wackel-*.txt> <last list (json) or -> <out: today's list (json)> [YYYY-MM-DD]
// Output: a German report on stdout; `wackler` (tests that wobbled 2+ nights, last seen within a week), `neu2` (reached the second
// night today), `heute` (wobbled today) in $GITHUB_OUTPUT. The list keeps a test for 14 days after it last wobbled.
import { readFileSync, readdirSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const KEEP_DAYS = 14;
export const lines = (text) => text.split('\n').map((l) => l.trim()).filter(Boolean);

/** All flaky names of a folder (one file per job). */
export function readToday(dir) {
  const set = new Set();
  const names = existsSync(dir) ? readdirSync(dir).filter((f) => /^wackel-.*\.txt$/.test(f) && f !== 'wackel-liste.txt') : [];
  for (const f of names) for (const l of lines(readFileSync(join(dir, f), 'utf8'))) set.add(l);
  return set;
}

const daysBetween = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 864e5);

/** before: { key: { nights, first, last } } or null. today: Set of keys. day: 'YYYY-MM-DD'. → the new list. */
export function update(before, today, day) {
  const out = {};
  for (const [k, v] of Object.entries(before ?? {})) if (daysBetween(v.last, day) <= KEEP_DAYS && !today.has(k)) out[k] = v;
  for (const k of today) {
    const old = before?.[k];
    out[k] = old && old.last !== day ? { nights: old.nights + 1, first: old.first, last: day } : old ? old : { nights: 1, first: day, last: day };
  }
  return out;
}

const SHOW = 20;
/** The report in short German. */
export function render(list, day) {
  const all = Object.entries(list).map(([k, v]) => ({ k, ...v }));
  const repeat = all.filter((e) => e.nights >= 2 && daysBetween(e.last, day) <= 7).sort((a, b) => b.nights - a.nights || a.k.localeCompare(b.k));
  const once = all.filter((e) => e.last === day && e.nights === 1);
  const out = [];
  if (repeat.length) {
    out.push(`**Wackler (${repeat.length}): rot und beim zweiten Versuch grün, an mindestens zwei Nächten.** Jeder braucht eine Reparatur der Ursache, nicht einen Neustart.`, '');
    out.push(...repeat.slice(0, SHOW).map((e) => `- ${e.nights} Nächte (seit ${e.first}${e.last === day ? ', heute wieder' : `, zuletzt ${e.last}`}): ${e.k}`));
    if (repeat.length > SHOW) out.push(`- … und ${repeat.length - SHOW} weitere`);
  }
  if (once.length) out.push('', `Heute zum ersten Mal gewackelt (${once.length}, noch beobachtet): ${once.slice(0, 8).map((e) => e.k).join('; ')}${once.length > 8 ? `; … und ${once.length - 8} weitere` : ''}`);
  if (!repeat.length && !once.length) out.push('Kein Test hat heute gewackelt.');
  return `${out.join('\n')}\n`;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const [dir, beforeFile, outFile, dayArg] = process.argv.slice(2);
  const day = dayArg || new Date().toISOString().slice(0, 10);
  let before = null;
  try {
    if (beforeFile && beforeFile !== '-' && existsSync(beforeFile)) before = JSON.parse(readFileSync(beforeFile, 'utf8'));
  } catch {
    before = null; // a broken file starts a new list
  }
  const today = readToday(dir);
  const list = update(before, today, day);
  writeFileSync(outFile, `${JSON.stringify(list, null, 1)}\n`);
  process.stdout.write(render(list, day));
  if (process.env.GITHUB_OUTPUT) {
    const all = Object.values(list);
    const wackler = all.filter((e) => e.nights >= 2 && daysBetween(e.last, day) <= 7).length;
    const neu2 = all.filter((e) => e.nights === 2 && e.last === day).length;
    appendFileSync(process.env.GITHUB_OUTPUT, `wackler=${wackler}\nneu2=${neu2}\nheute=${today.size}\n`);
  }
}
