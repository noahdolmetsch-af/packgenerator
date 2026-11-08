/**
 * 08.11.2026 (UX-Test D-3, Noah «1–5 a»): an address under #/flow that does not exist (an old bookmark such as
 * #/flow/tennis, a typo) used to show the start of Aktiv without a word. Now Flow.svelte says the page is gone and
 * offers the way on. `FLOW_ROUTES` lists every first part Flow.svelte answers; a test (tests/oldaddress.test.js)
 * checks that each address written in the source is on the list, so a new page cannot be called «gone».
 */
import { sportHref } from './mysports.js';

export const FLOW_ROUTES = [
  '', 'act', 'activity', 'auswertung', 'bags', 'edit', 'form', 'gipfelbuch', 'goals', 'ideen', 'impulse', 'milestones', 'new',
  'plans', 'rest', 'review', 'sport', 'sports', 'stats', 'training', 'trophies', 'week',
];

/** Old addresses that had a page of their own once: where the same thing lives now (a sport's page). */
const MOVED = { tennis: { id: 'tennis', label: 'To Tennis' } };

/** null when Flow answers the address; else { target } with the page the old address moved to, or null. */
export function flowGone(sub = '') {
  const first = String(sub).split('?')[0].split('/')[0];
  if (FLOW_ROUTES.includes(first)) return null;
  const m = MOVED[first.toLowerCase()];
  return { target: m ? { href: sportHref({ id: m.id }), label: m.label } : null };
}
