/**
 * «Freude als Auswertung» (Noah 04.11.2026, Persönliches Lernen Idee 6, Runde 1 «3a»): in the debrief four small
 * scales say what made the tour good: Fahrspass (riding fun), Natur (nature), Flow, Gesellschaft (company). Each is
 * 1–5, each optional, a second tap on the chosen value takes it away. Over several tours one calm line says which
 * of the four was highest on average. It describes and never explains; a few tours say little.
 *
 * Stored on the debrief (no new table): d.joy = { fun, nature, flow, company } with only the answered keys.
 * Pure (no database, no clock). Tested in tests/freude.test.js. Labels are English keys for t().
 */
export const JOY_FIELD = 'joy';
/** The four dimensions in the order they are shown; names are English keys for t(). */
export const JOY = [
  { key: 'fun', name: 'Riding fun|joy', hint: 'How much did the riding itself please you?' },
  { key: 'nature', name: 'Nature|joy', hint: 'How much did the landscape and the air do for you?' },
  { key: 'flow', name: 'Flow|joy', hint: 'How often did time and effort fall away?' },
  { key: 'company', name: 'Company|joy', hint: 'How good was being together (or alone, as you wanted)?' },
];
export const JOY_KEYS = JOY.map((j) => j.key);
/** The scale: 1 = a little … 5 = a lot. */
export const MAX = 5;
/** At least this many debriefs with an answer before the «highest on average» line shows. */
export const MIN_TOURS = 3;

const whole = (v) => (Number.isInteger(v) && v >= 1 && v <= MAX ? v : null);

/** The answers of a debrief, made whole: { fun, nature, flow, company } with null for unanswered. */
export function joyOf(d) {
  const v = d?.[JOY_FIELD];
  return Object.fromEntries(JOY_KEYS.map((k) => [k, whole(v?.[k])]));
}

/** Any answer at all? */
export const hasJoy = (d) => JOY_KEYS.some((k) => joyOf(d)[k] != null);

/** The new value of d.joy when a value is tapped: the same value again takes it away. Returns an object, or null when nothing is left. */
export function joyChange(d, key, n) {
  if (!JOY_KEYS.includes(key)) return d?.[JOY_FIELD] ?? null;
  const cur = joyOf(d);
  cur[key] = cur[key] === n ? null : whole(n);
  const kept = Object.fromEntries(JOY_KEYS.filter((k) => cur[k] != null).map((k) => [k, cur[k]]));
  return Object.keys(kept).length ? kept : null;
}

const r1 = (x) => Math.round(x * 10) / 10;

/**
 * Over several debriefs: the mean of each dimension over the debriefs that answered it. → { n (debriefs with any
 * answer), means: [{ key, mean, count }] sorted high to low, top: key | null (null on a tie or too few) } or null
 * while fewer than MIN_TOURS debriefs have an answer.
 */
export function overview(debriefs) {
  const answered = (debriefs ?? []).filter(hasJoy);
  if (answered.length < MIN_TOURS) return null;
  const means = JOY_KEYS.map((key) => {
    const vals = answered.map((d) => joyOf(d)[key]).filter((v) => v != null);
    return { key, count: vals.length, mean: vals.length ? r1(vals.reduce((s, v) => s + v, 0) / vals.length) : null };
  }).filter((m) => m.mean != null).sort((a, b) => b.mean - a.mean);
  if (!means.length) return null;
  const top = means.length > 1 && means[0].mean === means[1].mean ? null : means[0].key;
  return { n: answered.length, means, top };
}

const dayOf = (d) => String(d?.doneAt ?? d?.updatedAt ?? d?.createdAt ?? '').slice(0, 10);

/** The debriefs with an answer, newest first: [{ tripId, day, joy: { fun, nature, flow, company } }]. */
export function perTour(debriefs) {
  return (debriefs ?? [])
    .filter(hasJoy)
    .map((d) => ({ tripId: d.tripId, day: dayOf(d), joy: joyOf(d) }))
    .sort((a, b) => b.day.localeCompare(a.day) || String(a.tripId).localeCompare(String(b.tripId)));
}

/** The means over all answers whatever their number (for the page), highest first, or [] without answers. */
export function means(debriefs) {
  const answered = (debriefs ?? []).filter(hasJoy);
  return JOY_KEYS.map((key) => {
    const vals = answered.map((d) => joyOf(d)[key]).filter((v) => v != null);
    return { key, count: vals.length, mean: vals.length ? r1(vals.reduce((s, v) => s + v, 0) / vals.length) : null };
  }).filter((m) => m.mean != null).sort((a, b) => b.mean - a.mean);
}
