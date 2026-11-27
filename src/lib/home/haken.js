/**
 * «Heute abhaken» on top of Heute (Noah 23.11.2026 «2a»): which activities the block shows. Since 27.11.2026 (Noah «1a», thread
 * «Abhaken auf einen Blick verbessern») it shows ALL of them, always: no limit of 4 on a phone or 8 on a computer, nothing behind
 * «Alle ›», and the activities that stand on top as habit cards are in the grid too. Only those that are resting today stay out;
 * the rest keeps the order of the states, also after a tick (a tile never jumps away under the finger).
 * Pure; tested in tests/haken.test.js.
 *
 *   hakenPick(states) → { shown, done, total, open }
 *
 * states: flowStates(...) of the day. shown: the states to tick. done / total: how many of the ticks of the day (without the
 * resting ones) are done. open: the ones still open (a daily goal not reached, not resting): the same number the menu shows
 * at «Plan» (src/lib/nav/punkte.js, openTicks), so both always agree.
 */
export function hakenPick(states = []) {
  const shown = states.filter((s) => !s.resting);
  return { shown, done: shown.filter((s) => s.todayDone).length, total: shown.length, open: shown.filter((s) => s.open).length };
}

/** The activities «Aktiv heute» must not show again: all that the block on top shows. */
export function hakenIds(states = []) {
  return new Set(hakenPick(states).shown.map((s) => s.act.id));
}
