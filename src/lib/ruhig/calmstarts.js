/**
 * Ruhige Ansicht › quick starts (Noah 02.11.2026 «bauen alles», step 7): ready-made things to do, one tap starts
 * the calm view. Own and changeable like every list in the app (add, rename, sort, delete; KindsEdit).
 * Built-in ones: { id, std } (std: the English key for t()), renamed ones keep `std` and get `name`.
 * Stored in the settings record STARTS_KEY. Pure, tested in tests/ruhig.test.js.
 */
import { kindsOf } from './kinds.js';

export const STARTS_KEY = 'ruhig.calmStarts';
export const STD_STARTS = [
  { id: 'clean', std: 'Clean the bike' },
  { id: 'pack', std: 'Pack calmly' },
  { id: 'analysis', std: 'Analysis|calm' },
];
export const startsOf = (value) => kindsOf(value, STD_STARTS);
