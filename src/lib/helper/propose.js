import { newTrip } from '../nav.js';

/**
 * KI-Helfer (answer 2a): «Als Packliste vorschlagen» from the helper's answer in the search: New trip
 * opens with the question in «Frag den Helfer» (TripDialog takes 'pack.helperAsk'), and the helper's
 * proposal comes at once. Kept here (not in nav.js) so the navigation file stays small.
 */
export function proposeTrip(question) {
  try {
    localStorage.setItem('pack.helperAsk', String(question ?? '').trim());
  } catch {
    /* private mode: New trip opens with an empty question */
  }
  newTrip('standard');
}
