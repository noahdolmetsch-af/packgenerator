/**
 * v0.70.0 «Velo-Blätter Teil 2»: which new sheets were opened once on this device (the folder marks a
 * new sheet «new» until then). Only a convenience: without storage every new sheet stays marked.
 */
const KEY = 'sheets.seen';
export function seenSheets() {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}
export function markSeen(key) {
  try {
    const list = seenSheets();
    if (!list.includes(key)) localStorage.setItem(KEY, JSON.stringify([...list, key]));
  } catch {
    /* no storage: nothing to remember */
  }
}
