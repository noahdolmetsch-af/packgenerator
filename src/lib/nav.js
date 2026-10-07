/**
 * Start actions from anywhere (v0.19.6): the "New" sheet, the search and the start page open
 * another page with something already started. The wish is kept in localStorage (the page reads
 * it when it opens) and an event tells a page that is already open.
 */
const keep = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode: the page opens without the dialog */
  }
};

/** Read a wish once (and forget it). */
export function take(key) {
  try {
    const v = localStorage.getItem(key);
    localStorage.removeItem(key);
    return v;
  } catch {
    return null;
  }
}

/** Open the "New" sheet: 'all' (everything) or 'list' (the ways to start a packing list). */
export const openNew = (mode = 'all') => window.dispatchEvent(new CustomEvent('pg:new', { detail: mode }));

/** A trip becomes the one Pack and Ride day show. */
export const openTrip = (id) => keep('pack.currentTrip', id);

/**
 * New packing list: from a template (its id), 'last' (copy the last trip on the bike, or of the
 * area) or 'standard'. domain (v0.21.0): the area chosen in the "New" sheet.
 */
export function newTrip(startFrom, domain = null) {
  keep('pack.startFrom', startFrom);
  if (domain) keep('pack.domain', domain);
  location.hash = '#/pack';
  window.dispatchEvent(new Event('pg:newtrip'));
}

/** New gear item: Gear opens with the "Add item" dialog. */
export function addItem() {
  keep('gear.add', '1');
  location.hash = '#/gear';
  window.dispatchEvent(new Event('pg:additem'));
}

/** Quick note from anywhere (the App opens the dialog). prefill: text to start with. */
export const openNote = (prefill = '') => window.dispatchEvent(new CustomEvent('pg:note', { detail: prefill }));
