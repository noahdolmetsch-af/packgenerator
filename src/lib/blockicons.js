/**
 * SN3 «Seiten neu»: the icon and colour of a building block, the same on Bausteine, a template and
 * Packen (the big option buttons of PackBlocks.svelte use the same words). An own block named like
 * rain gets the cloud; every other own block the package.
 */
import { Wrench, Zap, Lightbulb, Flag, Cross, CookingPot, Apple, Droplet, CloudRain, Package, Tent, BedDouble, Sofa, Moon } from '@lucide/svelte';
import { RAIN_WORDS } from './packblocks.js';

const ICON = { standard: Package, repair: Wrench, charge: Zap, lights: Lightbulb, race: Flag, firstaid: Cross, cook: CookingPot, food: Apple, hygiene: Droplet, bivy: Moon, tent: Tent, hotel: BedDouble, comfort: Sofa };
const TONE = { lights: 'amber', race: 'purple', charge: 'amber' };

/** The lucide icon of a block (key, and its name for an own rain block). */
export const blockIcon = (key, name = '') => ICON[key] ?? (RAIN_WORDS.test(name) ? CloudRain : Package);

/** The tone of a block's icon tile: 'green' | 'amber' | 'blue' | 'purple' (OptionButton's `tone`). */
export const blockTone = (key, name = '') => TONE[key] ?? (RAIN_WORDS.test(name) ? 'blue' : 'green');
