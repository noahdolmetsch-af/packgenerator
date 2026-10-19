/**
 * P3b «Daten sicher» (Noah 15.10.2026 «1a»): the browser keeps the app's data for good.
 *
 * Without «persistent storage» a browser may delete a website's data by itself when the device runs
 * low on space, without asking. main.js asks once at every start (navigator.storage.persist()); most
 * browsers answer by themselves (Chrome: yes for an installed app icon or a site you use often), some
 * ask you. Ich › Daten und Backup shows the answer as a dot in «Everything in order?», and the button
 * beside a yellow dot asks again (from a tap, which some browsers need).
 */

/** 'kept' (the browser keeps the data), 'not' (it may delete it when space runs low) or 'unknown'. */
export async function keepState(nav = globalThis.navigator) {
  try {
    if (typeof nav?.storage?.persisted !== 'function') return 'unknown';
    return (await nav.storage.persisted()) ? 'kept' : 'not';
  } catch {
    return 'unknown';
  }
}

/** Ask the browser to keep the data; returns the state afterwards. Never throws. */
export async function askKeep(nav = globalThis.navigator) {
  try {
    if (typeof nav?.storage?.persist !== 'function') return 'unknown';
    return (await nav.storage.persist()) ? 'kept' : 'not';
  } catch {
    return 'unknown';
  }
}
