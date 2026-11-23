/**
 * Velos aufräumen (Noah 23.11.2026): «Cleat linker Schuh» stood as work due on the Canyon, but a cleat belongs to the shoe.
 * Work on shoes and cleats is no work on the bike: it does not count in the bike's care («1 fällig»), and it is listed
 * under Material › Alle («Arbeit am Material»). It is a suggestion: the row there has «Zum Velo» (the job goes back to the bike).
 *
 * A job is gear work when the field `gear` says so (true), or, while `gear` is not set, when its text names shoes or cleats
 * (and no brake part: «Bremsschuh», «brake shoes» are bike work). `gear: false` is the user's «Zum Velo» and always wins.
 */
const GEAR = /\b(cleats?|schuhplatten?|radschuhe?|schuhe?|shoes?)\b/i;
const BIKE_PART = /brems|brake|disc|rotor|belag|beläge|pads?\b/i;

/** Is this repair/problem job work on gear (shoes, cleats) and not on the bike? */
export function isGearWork(task) {
  if (!task) return false;
  if (task.gear === true) return true;
  if (task.gear === false) return false;
  const text = String(task.task ?? '');
  return GEAR.test(text) && !BIKE_PART.test(text);
}
