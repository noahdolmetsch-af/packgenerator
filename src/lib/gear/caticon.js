/** v0.47.2 «Material-Ansichten»: one quiet icon per gear category, for the cards and the item page. */
import { Zap, Lightbulb, Shirt, CloudRain, Footprints, Wrench, Apple, CookingPot, Tent, Droplet, CreditCard, Backpack, Bike, Sparkles, Package } from '@lucide/svelte';
import { CATEGORY, UNKNOWN_CATEGORY } from '../gear.js';

const ICON = { elec: Zap, light: Lightbulb, onbike: Shirt, rain: CloudRain, offbike: Shirt, shoes: Footprints, tools: Wrench, food: Apple, cook: CookingPot, sleep: Tent, hyg: Droplet, docs: CreditCard, bags: Backpack, bike: Bike, lux: Sparkles };

export const catIcon = (key) => ICON[key] ?? Package;
/** The category colour (a neutral grey for an unknown one). */
export const catColor = (key) => CATEGORY[key]?.color ?? UNKNOWN_CATEGORY.color;
