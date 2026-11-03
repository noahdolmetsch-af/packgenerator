/**
 * «Wetter gedreht» (idea C2 of «App denkt mit», Noah 02.11.2026 «3b»): the notice in Packen «the forecast is
 * something else than the trip is packed for» now says what changes on the list: the temperature kit of the
 * forecast against the kit of the packed weather. New items = in the new kit, not on the trip yet; can go =
 * in the old kit, on the trip, not in the new kit. A line for rain. Only a suggestion, nothing is changed here.
 * Pure functions, tested in tests/wxdiff.test.js.
 */
import { chooseKit, tempKits } from './wardrobe.js';
import { setView } from './sets.js';

const inKit = (kit, items) => (kit ? setView(kit, items).inventory : []);

/**
 * gap: { fc, have } as Pack's wxGap (wx = { min, max, rain }); sets: the building blocks (allSets);
 * items: all gear; entries: the trip's entries; offset: the felt shift.
 * → { kitFrom, kitTo, add: [item], leave: [item], rain: 'more' | 'less' | null }
 */
export function wxDiff(gap, sets = [], items = [], entries = [], offset = 0) {
  if (!gap) return null;
  const kits = tempKits(sets);
  const from = chooseKit(kits, gap.have?.min, offset);
  const to = chooseKit(kits, gap.fc?.min, offset);
  const onTrip = new Set((entries ?? []).map((e) => e.itemId));
  const same = from?.key === to?.key;
  const fromItems = same ? [] : inKit(from, items);
  const toItems = same ? [] : inKit(to, items);
  const fromIds = new Set(fromItems.map((i) => i.id));
  const toIds = new Set(toItems.map((i) => i.id));
  const add = toItems.filter((i) => !onTrip.has(i.id));
  const leave = fromItems.filter((i) => onTrip.has(i.id) && !toIds.has(i.id) && fromIds.has(i.id));
  const wet = (w) => (w?.rain ?? 'none') !== 'none';
  const rain = wet(gap.fc) && !wet(gap.have) ? 'more' : !wet(gap.fc) && wet(gap.have) ? 'less' : null;
  return add.length || leave.length || rain ? { kitFrom: from, kitTo: to, add, leave, rain } : null;
}
