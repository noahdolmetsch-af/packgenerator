/**
 * «Heute abhaken» on top of Heute (Noah 23.11.2026 «2a»): which activities the block shows. The same rule as «Aktiv heute»
 * (ActsTile): the ones that already stand on top as habit cards (upIds) are named in a quiet line, not shown twice; those
 * that are resting today do not count; the rest keeps the order of the states, also after a tick (a tile never jumps away under the finger).
 * Pure; tested in tests/haken.test.js.
 *
 *   hakenPick(states, upIds, n) → { shown, up, done, total }
 *
 * states: flowStates(...) of the day. shown: at most n states to tick. up: the states that are habit cards. done / total:
 * how many of the ticks of the day (without the resting ones) are done. open: the ones still open (a daily goal not reached,
 * not resting): the same number the menu shows at «Plan» (src/lib/nav/punkte.js, openTicks), so both always agree.
 */
export function hakenPick(states = [], upIds = new Set(), n = 4) {
  const live = states.filter((s) => !s.resting);
  const up = live.filter((s) => upIds.has(s.act.id));
  const rest = live.filter((s) => !upIds.has(s.act.id));
  const shown = rest.slice(0, n);
  return { shown, up, done: live.filter((s) => s.todayDone).length, total: live.length, open: live.filter((s) => s.open).length };
}

/** The activities «Aktiv heute» must not show again when the block on top shows them (same first n as hakenPick). */
export function hakenIds(states = [], upIds = new Set(), n = 4) {
  return new Set(hakenPick(states, upIds, n).shown.map((s) => s.act.id));
}
