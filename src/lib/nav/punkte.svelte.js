/** The numbers behind the quiet dots of the menu (punkte.js); written by Punkte.svelte, read by PlaceBar and SideBar. */
import { dotsOf } from './punkte.js';
import { ops } from '../bedienung.svelte.js';

export const punkte = $state({ ticks: 0, tours: 0 });

/** { week, trips } for the menu: only what is switched on in Ich › Darstellung. */
export const dots = () => dotsOf(punkte, { plan: ops.dotplan, trips: ops.dottrips });
