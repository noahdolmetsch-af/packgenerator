/**
 * SN3 «Seiten neu»: the icon and colour of a building block, the same on Bausteine, a template and
 * Packen (the big option buttons of PackBlocks.svelte use the same words). An own block named like
 * rain gets the cloud; every other own block the package.
 * SN3+: the seven blocks «je nach Lage» (situation.js) with their own icons (mockup SN3e).
 */
import { Wrench, Zap, Lightbulb, Flag, Cross, CookingPot, Apple, Droplet, CloudRain, Package, Tent, BedDouble, Sofa, Moon, ThermometerSnowflake, ThermometerSun, Mountain, Timer, Globe, TrainFront, BedSingle, CalendarDays, Wind, HeartPulse, Snowflake, Waves, Bath, Droplets, ShoppingBag, Hand, Shirt, MoonStar, Soup, BatteryFull, ShieldPlus, Sparkles } from '@lucide/svelte';
import { RAIN_WORDS } from './packblocks.js';

const ICON = { standard: Package, repair: Wrench, charge: Zap, lights: Lightbulb, race: Flag, firstaid: Cross, cook: CookingPot, food: Apple, hygiene: Droplet, bivy: Moon, tent: Tent, hotel: BedDouble, comfort: Sofa, cold: ThermometerSnowflake, heat: ThermometerSun, climb: Mountain, long: Timer, abroad: Globe, train: TrainFront, rain: CloudRain,
  // v0.154.0 «Bausteine mehr»: the nine new blocks and the stages
  sleepwell: BedSingle, twonights: CalendarDays, descent: Wind, recovery: HeartPulse, icy: Snowflake, swim: Waves, sauna: Bath, coldwater: Droplets, drybag: ShoppingBag,
  coldHands: Hand, coldLayers: Shirt, coldEvening: MoonStar, cookWarm: Soup, chargeLong: BatteryFull, aidWinter: ShieldPlus, hygieneCare: Sparkles };
const TONE = { lights: 'amber', race: 'purple', charge: 'amber', cold: 'blue', heat: 'amber', rain: 'blue', icy: 'blue', swim: 'blue', coldwater: 'blue', drybag: 'blue', coldHands: 'blue', coldLayers: 'blue', coldEvening: 'blue', chargeLong: 'amber' };

/** The lucide icon of a block (key, and its name for an own rain block). */
export const blockIcon = (key, name = '') => ICON[key] ?? (RAIN_WORDS.test(name) ? CloudRain : Package);

/** The tone of a block's icon tile: 'green' | 'amber' | 'blue' | 'purple' (OptionButton's `tone`). */
export const blockTone = (key, name = '') => TONE[key] ?? (RAIN_WORDS.test(name) ? 'blue' : 'green');
