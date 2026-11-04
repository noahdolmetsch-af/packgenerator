/**
 * «Aktiv und Auswerten» 3a (Noah 03.11.2026): the Sunday thread. From Friday 17:00 until the end of Monday the
 * week part of Aktiv says that the week is nearly over (or just was) and leads to the Wochenrückblick, which
 * already shows the running week until Sunday and the week before on Monday (weekreview.js defaultMonday).
 * Pure: takes a Date on the device's own clock. → { text } (an English key of t()) or null.
 */
export const FADEN_FROM_HOUR = 17;

export function sonntagsFaden(now = new Date()) {
  const dow = now.getDay(); // 0 = Sunday
  if (dow === 1) return { text: 'A new week begins. Look back at the last one' };
  if (dow === 0 || dow === 6) return { text: 'The week is almost over. Look back at it' };
  if (dow === 5 && now.getHours() >= FADEN_FROM_HOUR) return { text: 'The week is almost over. Look back at it' };
  return null;
}
