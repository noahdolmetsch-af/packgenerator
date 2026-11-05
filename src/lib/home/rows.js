/**
 * «Jetzt dran» steuern (Noah 05.11.2026 «4a»): the calm rows of Heute can be put off for a week («Später») and every
 * kind of row that is only a hint can be switched off (and on again) in one window. Nothing is deleted:
 * the rows come back by themselves after a week or with «Show again».
 *
 * Setting ROWS_KEY: { off: ['wear', …], later: { [row key]: { until: 'YYYY-MM-DD', text } } }.
 * The backup and the sync take the setting like every other. Pure, tested in tests/jetzt-dran-zeilen.test.js.
 */
export const ROWS_KEY = 'homeRows';
export const LATER_DAYS = 7;

/**
 * The kinds of row that can be switched off (the kind is the start of the row's key). Reminders that protect data
 * or a trip stay: the backup, care that is due, the debrief, the question after a trip, charging, trip preparation.
 * name / eg: English keys for t().
 */
export const ROW_KINDS = [
  { kind: 'idea', name: 'Ride idea for today', eg: 'Idea: ride up to 2.5 h with the …' },
  { kind: 'wear', name: 'Wear outlook', eg: 'Chain waxing due in about 18 km' },
  { kind: 'todo', name: 'Open tasks (weighing, GPX …)', eg: 'Weigh 3 bikes' },
  { kind: 'unused', name: 'Parts not used for a long time', eg: '183 items not on any trip for 12 months' },
  { kind: 'learnings', name: 'A learning for the next trip', eg: 'Your own rule from a debrief' },
  { kind: 'upgrade', name: 'Lighter gear tip', eg: '… g lighter for CHF …' },
  { kind: 'templates', name: 'Suggestions for your templates', eg: '2 suggestions for your templates' },
  { kind: 'compass', name: 'Next step of a goal', eg: 'Goal «…»: next step' },
  { kind: 'inbox', name: 'Notes to sort', eg: '2 notes to sort' },
  { kind: 'folderok', name: 'Backup folder needs OK', eg: 'The backup folder waits for your OK.' },
  { kind: 'tests', name: 'Tidy up test trips', eg: 'Clean up 1 test trip' },
];
const KINDS = new Set(ROW_KINDS.map((x) => x.kind));
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The kind of a row: its key up to the first colon. */
export const kindOf = (row) => String(row?.key ?? '').split(':')[0];

/** Calendar-day arithmetic (no time zone drift). */
const plus = (day, n) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** The stored setting, cleaned. Unknown kinds and bad days are dropped. */
export function rowsOf(raw) {
  const off = [...new Set((Array.isArray(raw?.off) ? raw.off : []).filter((k) => KINDS.has(k)))];
  const later = {};
  for (const [key, v] of Object.entries(raw?.later && typeof raw.later === 'object' ? raw.later : {})) {
    if (v && DAY.test(v.until ?? '')) later[key] = { until: v.until, text: String(v.text ?? '').slice(0, 120) };
  }
  return { off, later };
}

/** Is this row hidden today: its kind is off, or it was put off and the week is not over? */
export function isHidden(row, cfg, today) {
  const c = rowsOf(cfg);
  if (c.off.includes(kindOf(row))) return true;
  const l = c.later[row?.key];
  return !!l && today < l.until;
}

/** The setting with a kind switched off or on. */
export function setKind(cfg, kind, off) {
  const c = rowsOf(cfg);
  if (!KINDS.has(kind)) return c;
  return { ...c, off: off ? [...new Set([...c.off, kind])] : c.off.filter((k) => k !== kind) };
}

/** The setting with one row put off for a week from today (and the ended ones forgotten). */
export function putOff(cfg, row, today) {
  const c = dropEnded(rowsOf(cfg), today);
  return { ...c, later: { ...c.later, [row.key]: { until: plus(today, LATER_DAYS), text: String(row.text ?? '').slice(0, 120) } } };
}

/** The setting with one row (or, without a key, every row) shown again. */
export function showAgain(cfg, key = null) {
  const c = rowsOf(cfg);
  if (key == null) return { ...c, later: {} };
  const later = { ...c.later };
  delete later[key];
  return { ...c, later };
}

const dropEnded = (c, today) => ({ ...c, later: Object.fromEntries(Object.entries(c.later).filter(([, v]) => today < v.until)) });

/** The rows that are put off at the moment: [{ key, text, until }], the soonest to come back first. */
export const waiting = (cfg, today) =>
  Object.entries(dropEnded(rowsOf(cfg), today).later)
    .map(([key, v]) => ({ key, text: v.text, until: v.until }))
    .sort((a, b) => a.until.localeCompare(b.until) || a.key.localeCompare(b.key));
