/**
 * «Fahrtechnik-Tagebuch» (Noah 04.11.2026, Persönliches Lernen Idee 3, Runde 1 «4a»): in the debrief you tick the
 * riding techniques you worked on («Hairpins», «Braking control», «Steep climbs» …) and say how it went (well or still
 * unsure). A page next to the Rückblick lists every technique with how often you worked on it, how the last time
 * went, whether you want to practise it and where. The techniques start as suggestions and are a list you change
 * (Me › Lists and types: rename, add, hide, delete). Observation only: the app never says why a technique is hard.
 *
 * Stored without a new table: d.skills = { [techniqueId]: 'tried' | 'good' | 'unsure' } on the debrief; the wish and
 * the place in one settings record (TECH_KEY): { [techniqueId]: { want: true, place: '…' } }.
 * Pure (no database, no clock). Tested in tests/technik.test.js. Names are English keys for t().
 */
import { hasId, nameOf, offered } from './applists.js';

export const SKILLS_FIELD = 'skills';
export const TECH_KEY = 'fahrtechnik';
export const TECH_NAMES = {
  hairpins: 'Hairpins|technique',
  braking: 'Braking control|technique',
  climbs: 'Steep climbs|technique',
  descents: 'Fast descents|technique',
  wet: 'Wet roads|technique',
  gravel: 'Gravel and loose ground|technique',
  group: 'Riding in a group|technique',
  standing: 'Riding out of the saddle|technique',
};
export const TECH_STD = Object.entries(TECH_NAMES).map(([id, name]) => ({ id, name }));
export const KINDS = ['tried', 'good', 'unsure'];
/** The longest place text. */
export const PLACE_MAX = 60;

export const techName = (id, tr) => nameOf('techniques', TECH_STD, id, tr, '');
export const techOffered = (keep = []) => {
  const keepIds = new Set(keep);
  const list = offered('techniques', TECH_STD);
  // a technique answered earlier stays visible even when it is hidden now
  const extra = [...keepIds].filter((id) => !list.some((e) => e.id === id) && hasId('techniques', TECH_STD, id)).map((id) => ({ id, name: techName(id) }));
  return [...list, ...extra];
};

/** The answers of a debrief, made whole: { id: kind }. */
export function skillsOf(d) {
  const v = d?.[SKILLS_FIELD];
  if (!v || typeof v !== 'object') return {};
  return Object.fromEntries(Object.entries(v).filter(([id, k]) => hasId('techniques', TECH_STD, id) && KINDS.includes(k)));
}

/** The new d.skills when the chip of a technique is tapped: first tap «tried», another tap takes it away. null when nothing is left. */
export function skillToggle(d, id) {
  const cur = skillsOf(d);
  if (id in cur) delete cur[id];
  else cur[id] = 'tried';
  return Object.keys(cur).length ? cur : null;
}

/** The new d.skills when «went well» / «still unsure» is tapped: the same one again goes back to «tried». */
export function skillSay(d, id, kind) {
  const cur = skillsOf(d);
  if (!(id in cur) || !['good', 'unsure'].includes(kind)) return Object.keys(cur).length ? cur : null;
  cur[id] = cur[id] === kind ? 'tried' : kind;
  return cur;
}

const day = (d) => String(d?.doneAt ?? d?.updatedAt ?? d?.createdAt ?? '').slice(0, 10);

/**
 * Over all debriefs: one row per technique that was ever worked on: { id, count, good, unsure, last: { day, kind } },
 * the most recently worked on first.
 */
export function overview(debriefs) {
  const rows = new Map();
  for (const d of [...(debriefs ?? [])].sort((a, b) => day(a).localeCompare(day(b)))) {
    for (const [id, kind] of Object.entries(skillsOf(d))) {
      const r = rows.get(id) ?? { id, count: 0, good: 0, unsure: 0, last: null };
      r.count += 1;
      if (kind === 'good') r.good += 1;
      if (kind === 'unsure') r.unsure += 1;
      r.last = { day: day(d), kind };
      rows.set(id, r);
    }
  }
  return [...rows.values()].sort((a, b) => (b.last?.day ?? '').localeCompare(a.last?.day ?? '') || a.id.localeCompare(b.id));
}

/** The wishes and places record, made whole: { id: { want: true?, place: '…'? } }. */
export function notesOf(rec) {
  const out = {};
  for (const [id, v] of Object.entries(rec && typeof rec === 'object' ? rec : {})) {
    const want = v?.want === true;
    const place = typeof v?.place === 'string' ? v.place.trim().slice(0, PLACE_MAX) : '';
    if (want || place) out[id] = { ...(want ? { want: true } : {}), ...(place ? { place } : {}) };
  }
  return out;
}

/** The record after a change of one technique: patch { want?, place? }; an entry without wish and place is dropped. null when empty. */
export function noteChange(rec, id, patch) {
  const cur = notesOf(rec);
  const next = notesOf({ ...cur, [id]: { ...(cur[id] ?? {}), ...patch } });
  return Object.keys(next).length ? next : null;
}

export const wanted = (rec) => Object.keys(notesOf(rec)).filter((id) => notesOf(rec)[id].want);
