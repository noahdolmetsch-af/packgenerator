/**
 * «Orte auf der Karte»: the lucide icon of each kind (CATEGORIES[].icon in poisearch.js names it; the
 * test checks both agree). For the chips, the list, the detail and the map symbols.
 */
import { Droplet, ShoppingCart, Utensils, Fuel, Bike, Wrench, Bed, Tent, House, Toilet, Pill, Hospital, Banknote, TrainFront, WashingMachine, Binoculars, MapPin } from '@lucide/svelte';

export const POI_ICONS = {
  water: Droplet,
  shop: ShoppingCart,
  food: Utensils,
  fuel: Fuel,
  bike: Bike,
  repair: Wrench,
  sleep: Bed,
  camp: Tent,
  shelter: House,
  toilet: Toilet,
  pharmacy: Pill,
  hospital: Hospital,
  atm: Banknote,
  station: TrainFront,
  laundry: WashingMachine,
  view: Binoculars,
};
/** The icon component of a kind (a pin for anything else). */
export const iconOf = (kind) => POI_ICONS[kind] ?? MapPin;
