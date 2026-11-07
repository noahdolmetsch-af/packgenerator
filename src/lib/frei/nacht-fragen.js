/**
 * «Erste Nacht» › «Nach der Nacht» (Noah 05.11.2026 «7a»): three questions (sleep, cold, what was missing)
 * and the take-over onto the packing list of a real trip. Stored in the page record: night.answers =
 * { sleep, cold, coldWhere, missing, takenTo, takenAt }. Pure; the writes are in Nacht.svelte
 * (the packing list itself: uebernahme.js, the same way «For next time» does it).
 */
import { linesOf } from '../frei.js';

export const SLEEP = [
  { key: 'good', name: 'Well' },
  { key: 'ok', name: 'Okay' },
  { key: 'bad', name: 'Badly' },
];
export const COLD = [
  { key: 'no', name: 'No' },
  { key: 'bit', name: 'A bit' },
  { key: 'yes', name: 'Yes, too cold' },
];
export const MAX_MISSING = 12;

const clean = (s, n = 200) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

/** The answers made safe. */
export function answersOf(night) {
  const a = night?.answers && typeof night.answers === 'object' ? night.answers : {};
  return {
    sleep: SLEEP.some((x) => x.key === a.sleep) ? a.sleep : '',
    cold: COLD.some((x) => x.key === a.cold) ? a.cold : '',
    coldWhere: clean(a.coldWhere, 120),
    missing: String(a.missing ?? '').slice(0, 1200),
    takenTo: a.takenTo ?? null,
    takenAt: a.takenAt ?? null,
  };
}

/** What was missing, one thing per line (a few, each once). */
export function missingMarks(answers) {
  const seen = new Set();
  const out = [];
  for (const line of linesOf(answers?.missing)) {
    const name = clean(line, 120);
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    out.push({ key: `name:${name.toLowerCase()}`, name, pile: 'missing' });
    if (out.length >= MAX_MISSING) break;
  }
  return out;
}

/** Planning notes the answers suggest (English keys; tr fills them): cold and a bad night. */
export function nightNotes(answers, tr) {
  const out = [];
  if (answers?.cold === 'yes' || answers?.cold === 'bit') {
    const base = answers.cold === 'yes' ? tr('First night: it was too cold. Plan something warmer for sleeping.') : tr('First night: it was a bit cold. Check the layers for sleeping.');
    out.push(answers.coldWhere ? `${base} (${answers.coldWhere})` : base);
  }
  if (answers?.sleep === 'bad') out.push(tr('First night: I slept badly. Think about mat, pillow and a quieter place.'));
  return out;
}

/** How many things the take-over would do (for the button): missing things plus notes. */
export const overCount = (answers, tr) => missingMarks(answers).length + nightNotes(answers, tr).length;
