/**
 * «Haken zuerst» (Noah 19.11.2026 «1-5a», Thread «Training erfassen vereinfachen», T2): after a tick the page «Geschafft» offers
 * two optional chips: the duration (30, 45, 60, 90 min) and the feeling (light, good, hard). Both are saved on the entry of the
 * tick (flowLog: `min`, new `feel`); tapping the chosen chip again takes it back. Old entries without `feel` stay valid.
 * Pure functions; the page is src/pages/flow/Geschafft.svelte.
 */

/** The chips for the duration, in minutes. */
export const MIN_CHIPS = [30, 45, 60, 90];
/** The three words for the feeling, stored as these English ids and shown in German. */
export const FEELS = ['light', 'good', 'hard'];

/** A feeling id out of anything: one of FEELS or null. */
export const feelId = (v) => (FEELS.includes(v) ? v : null);

/** Whether the entry can take a duration chip: not a Strava tick (Strava has the time) and not the ride to work. */
export const canSetMinutes = (e) => !!e && e.via !== 'strava' && e.via !== 'commute';

/**
 * The entry with the duration chosen: the same minutes again take it back; the other entries stay as they are.
 * → a new object (never changes the one given).
 */
export function withMinutes(e, min) {
  const { min: had, ...rest } = e;
  const m = Math.round(Number(min));
  if (!Number.isFinite(m) || m < 1 || had === m) return rest;
  return { ...rest, min: m };
}

/** The entry with the feeling chosen: the same word again takes it back; an unknown word changes nothing. */
export function withFeel(e, feel) {
  const { feel: had, ...rest } = e;
  const f = feelId(feel);
  if (!f) return { ...e };
  return had === f ? rest : { ...rest, feel: f };
}
