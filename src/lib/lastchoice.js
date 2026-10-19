/**
 * P3b «Bedienregeln», 4a (Noah 15.10.2026 «4a»): the bike chosen last stays chosen everywhere (Velos
 * tabs, New trip, Report a problem, a quick job, a note), until another one is chosen. Kept on this
 * device only (localStorage), like the trip open in Pack ('pack.currentTrip', nav.js openTrip).
 */
const BIKE = 'pg.lastBike';
const OLD = 'problem.lastBike'; // «Report a problem» kept its own before

/** The id of the bike chosen last on this device (not checked against the bikes), or null. */
export function lastBikeChoice() {
  try {
    return localStorage.getItem(BIKE) ?? localStorage.getItem(OLD);
  } catch {
    return null;
  }
}

/** The bike chosen last when it still exists in bikes, else null. */
export const chosenBike = (bikes = []) => {
  const id = lastBikeChoice();
  return id && bikes.some((b) => b.id === id) ? id : null;
};

/** A bike was chosen: it stays chosen everywhere. */
export function chooseBike(id) {
  if (!id) return;
  try {
    localStorage.setItem(BIKE, id);
  } catch {
    /* private mode: each page starts with its own first bike */
  }
}
