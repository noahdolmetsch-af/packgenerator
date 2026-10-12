/** v0.111.0 Vorabend- und Schluss-Check (mockups V1–V6): one quiet icon per check row and per trip type. */
import { Mountain, Sun, ListChecks, Smartphone, Zap, User, Coffee, AlarmClock, Wrench, Droplets, House, TrainFront, Sandwich, Ticket, MapPin, FileText, Wallet, Plug, Navigation, Bike, Globe, Footprints, Check, Shirt, Package } from '@lucide/svelte';

const EVE = { bulletin: Mountain, weather: Sun, threes: ListChecks, route: Smartphone, gps: Navigation, charge: Zap, share: User, tea: Coffee, alarm: AlarmClock, tyres: Wrench, bottles: Droplets, hut: House, train: TrainFront, food: Sandwich, tickets: Ticket, address: MapPin, docs: FileText, cash: Wallet, adapter: Plug };
const AFTER = { skins: Mountain, dry: Shirt, lvs: Zap, refill: Package, charge: Smartphone, broken: Wrench, back: User, bike: Bike, boots: Footprints, bottle: Droplets, wash: Shirt };
/** The icon of a row by its id; own rows get a tick. */
export const checkIcon = (id, kind = 'eve') => (kind === 'after' ? AFTER : EVE)[id] ?? Check;

const TYPE = { bikepacking: Bike, ski: Mountain, hiking: Footprints, weekend: Ticket, travel: Globe };
/** The icon of a trip type. */
export const typeIcon = (domain) => TYPE[domain] ?? Bike;
