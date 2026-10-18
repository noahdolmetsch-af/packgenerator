/**
 * WS6 «Wieder sichtbar» (Noah 14.10.2026 «1a 2b 3a ws1-ws7 freigeben», 3a: folds open under the rings):
 * what counts for the ring «Erholung», each with when it was last done («zuletzt am»).
 * states: flowStates (the activities with their state); log: all entries; today: YYYY-MM-DD.
 * → [{ act, done, of, last: { day, min } | null }] in the order of the page, resting ones left out.
 */
import { entriesFor } from '../flow.js';

export function restRows(states = [], log = [], today) {
  return states
    .filter((s) => s.act.ring === 'rest' && !s.resting)
    .map((s) => {
      const past = entriesFor(s.act, log).filter((e) => e.day <= today);
      const lastDay = past.reduce((m, e) => (e.day > m ? e.day : m), '');
      const min = past.filter((e) => e.day === lastDay).reduce((t, e) => t + (Number(e.min) || 0), 0);
      return {
        act: s.act,
        done: s.goals.reduce((a, r) => a + Math.min(r.done, r.goal.count), 0),
        of: s.goals.reduce((a, r) => a + r.goal.count, 0),
        last: lastDay ? { day: lastDay, min: min || null } : null,
      };
    });
}
