/**
 * «Eigene Werte»: the live values for the whole app (reactive, so a $derived that reads them follows
 * at once). App.svelte keeps them in step with the settings record (liveQuery); until it has loaded,
 * and in the unit tests, the standards count. own.v is always whole (normOwn).
 */
import { OWN_DEFAULTS, normOwn } from './ownvalues.js';

export const own = $state({ v: { ...OWN_DEFAULTS } });

/** Take a stored record (or null) as the live values. */
export function useOwn(raw) {
  own.v = normOwn(raw);
}
