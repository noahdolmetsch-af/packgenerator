/**
 * «Kleider-Sets» step 2 (Noah 27.10.2026 «3a»): the nine sample sets the app creates once, all
 * changeable and deletable like any own building block. A set is a building block of the settings
 * record "sets" ({ key, preset, minC?, maxC?, rain?, off? }); its pieces carry the key in item.sets,
 * like the temperature kits of the import, so Pack suggests them too (Noah «5a»).
 * name: the label through t() until you rename it. seedC: the temperature its pieces are first
 * picked for (felt °C). No imports here: sets.js reads the names.
 */
export const WEAR_PRESETS = [
  { preset: 'everyday', name: 'Everyday clothes|wearset', seedC: 15, everyday: true },
  { preset: 'long', name: 'Long top and bottom', minC: 5, maxC: 12, seedC: 8 },
  { preset: 'short', name: 'Short top and bottom', minC: 18, maxC: 28, seedC: 22 },
  { preset: 'between', name: 'In between|wearset', minC: 12, maxC: 18, seedC: 14 },
  { preset: 'rain', name: 'Rain|wearset', seedC: 12, rain: true },
  { preset: 'cold', name: 'Cold|wearset', maxC: 5, seedC: 0 },
  { preset: 'hot', name: 'Hot|wearset', minC: 28, seedC: 30 },
  { preset: 'descent', name: 'Descent and pass', seedC: 3 },
  { preset: 'camp', name: 'Bikepacking evening', seedC: 6 },
];
export const presetKey = (preset) => `w-${preset}`;
export const presetOf = (preset) => WEAR_PRESETS.find((p) => p.preset === preset) ?? null;
