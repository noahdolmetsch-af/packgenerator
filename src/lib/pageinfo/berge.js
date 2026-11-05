/**
 * «Schweizer Berge statt Everest» (Noah 03.11.2026 «E und F», Paket E, Idee 25): next to the Everest the metres
 * climbed in a period are also counted in Swiss mountains: «1.3× Säntis». The mountain fits the metres
 * by itself (the highest one they reach at least once) and can be chosen by hand; the choice is kept.
 * Heights above sea level, rounded. Pure, tested in tests/berge.test.js.
 */

export const MOUNTAIN_KEY = 'far.mountain';

/** Swiss mountains from small to big. */
export const MOUNTAINS = [
  { key: 'uetliberg', name: 'Uetliberg', m: 870 },
  { key: 'rigi', name: 'Rigi', m: 1798 },
  { key: 'pilatus', name: 'Pilatus', m: 2128 },
  { key: 'saentis', name: 'Säntis', m: 2502 },
  { key: 'eiger', name: 'Eiger', m: 3967 },
  { key: 'matterhorn', name: 'Matterhorn', m: 4478 },
  { key: 'dufour', name: 'Dufourspitze', m: 4634 },
];

export const AUTO = 'auto';

/** A stored choice or «auto». */
export const choiceOf = (v) => (MOUNTAINS.some((m) => m.key === v?.key) ? v.key : AUTO);

/** The highest mountain the metres reach at least once (the smallest one when they do not reach any). */
export const bestMountain = (gainM) => MOUNTAINS.reduce((b, m) => (m.m <= gainM ? m : b), MOUNTAINS[0]);

/**
 * How often the metres climbed go up a mountain: { mountain, x (one decimal, rounded down), fill (the part of the
 * round under way, 0…1), next (the number of the next round), left (m to it) }, or null with nothing climbed.
 */
export function mountainOf(gainM, choice = AUTO) {
  if (!(Number(gainM) > 0)) return null;
  const mountain = MOUNTAINS.find((m) => m.key === choice) ?? bestMountain(gainM);
  const x = gainM / mountain.m;
  const next = Math.floor(x) + 1;
  return { mountain, x: Math.floor(x * 10) / 10, fill: x - Math.floor(x), next, left: Math.ceil(next * mountain.m - gainM) };
}
