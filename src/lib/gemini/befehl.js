/**
 * «Frag Gemini» → «Mach es für mich» (Noah 23.11.2026 «4b»): what Gemini understood from a sentence, checked once more here and
 * made into the same actions the search does (suche/act.js: actionLabel, runActions, with one Undo). Only four kinds, all
 * of them only add: a to-do or reminder, a list with points, a note, a value (weight, resting heart rate, sleep). Gemini never
 * writes by itself: the page shows «Ich würde das tun» and nothing happens before the tap.
 */
export const VALUE_RANGE = { 'koerper.waage': [20, 300, 'kg'], 'koerper.ruhepuls': [25, 220, 'bpm'], 'erholung.schlaf': [1, 10, ''] };
const short = (v, n) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const day = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v ?? '')) ? v : null);

/** Gemini's actions → actions of the app (writes: true), the unknown or odd ones left out; at most 4. */
export function toActions(list) {
  const out = [];
  for (const a of Array.isArray(list) ? list : []) {
    if (a?.kind === 'remind' && short(a.text, 120)) out.push({ kind: 'remind', text: short(a.text, 120).replace(/^\p{Ll}/u, (c) => c.toUpperCase()), due: day(a.due), writes: true });
    else if (a?.kind === 'note' && short(a.text, 400)) out.push({ kind: 'cmd', cmd: { kind: 'note', text: short(a.text, 400) }, title: short(a.text, 80), writes: true });
    else if (a?.kind === 'list') {
      const points = (Array.isArray(a.points) ? a.points : []).map((x) => short(x, 80)).filter(Boolean).slice(0, 20);
      const name = short(a.name, 60);
      if (name || points.length) out.push({ kind: 'list', name, points, writes: true });
    } else if (a?.kind === 'value' && VALUE_RANGE[a.qid]) {
      const [lo, hi, unit] = VALUE_RANGE[a.qid];
      const v = Number(a.value);
      if (Number.isFinite(v) && v >= lo && v <= hi) out.push({ kind: 'value', qid: a.qid, value: v, ...(unit ? { unit } : {}), writes: true });
    }
  }
  return out.slice(0, 4);
}
