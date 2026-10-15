/** v0.47.2 «Material-Ansichten»: one quiet icon per gear category, for the cards and the item page. */
import { Zap, Lightbulb, Shirt, CloudRain, Footprints, Wrench, Apple, CookingPot, Tent, Droplet, CreditCard, Backpack, Bike, Sparkles, Package, Tag, Heart, Sun, Moon, Camera, Mountain, Snowflake, Music, Dumbbell, BookOpen } from '@lucide/svelte';
import { CATEGORY, UNKNOWN_CATEGORY } from '../gear.js';

const ICON = { elec: Zap, light: Lightbulb, onbike: Shirt, rain: CloudRain, offbike: Shirt, shoes: Footprints, tools: Wrench, food: Apple, cook: CookingPot, sleep: Tent, hyg: Droplet, docs: CreditCard, bags: Backpack, bike: Bike, lux: Sparkles };

/**
 * v0.134.0 «Listen und Typen» (LI3): the symbols a person can choose for a category. The key is what
 * the overrides keep; label: the name a screen reader says (German in i18n/de/lists.js).
 */
export const ICON_CHOICES = {
  Tag: { I: Tag, label: 'Label|symbol' },
  Zap: { I: Zap, label: 'Lightning|symbol' },
  Lightbulb: { I: Lightbulb, label: 'Bulb|symbol' },
  Shirt: { I: Shirt, label: 'Shirt|symbol' },
  CloudRain: { I: CloudRain, label: 'Rain|symbol' },
  Footprints: { I: Footprints, label: 'Footprints|symbol' },
  Wrench: { I: Wrench, label: 'Wrench|symbol' },
  Apple: { I: Apple, label: 'Apple|symbol' },
  CookingPot: { I: CookingPot, label: 'Pot|symbol' },
  Tent: { I: Tent, label: 'Tent|symbol' },
  Droplet: { I: Droplet, label: 'Drop|symbol' },
  CreditCard: { I: CreditCard, label: 'Card|symbol' },
  Backpack: { I: Backpack, label: 'Backpack|symbol' },
  Bike: { I: Bike, label: 'Bike|symbol' },
  Sparkles: { I: Sparkles, label: 'Sparkles|symbol' },
  Heart: { I: Heart, label: 'Heart|symbol' },
  Sun: { I: Sun, label: 'Sun|symbol' },
  Moon: { I: Moon, label: 'Moon|symbol' },
  Camera: { I: Camera, label: 'Camera|symbol' },
  Mountain: { I: Mountain, label: 'Mountain|symbol' },
  Snowflake: { I: Snowflake, label: 'Snowflake|symbol' },
  Music: { I: Music, label: 'Music|symbol' },
  Dumbbell: { I: Dumbbell, label: 'Dumbbell|symbol' },
  BookOpen: { I: BookOpen, label: 'Book|symbol' },
};
/** The name of a category's Standard symbol (for the picker). */
export const stdIconName = (key) => Object.entries(ICON_CHOICES).find(([, c]) => c.I === ICON[key])?.[0] ?? 'Tag';

/** The chosen symbol wins, then the Standard one; an own category without one gets a tag. */
export const catIcon = (key) => ICON_CHOICES[CATEGORY[key]?.icon]?.I ?? ICON[key] ?? (CATEGORY[key] ? Tag : Package);
/** The category colour (a neutral grey for an unknown one). */
export const catColor = (key) => CATEGORY[key]?.color ?? UNKNOWN_CATEGORY.color;
