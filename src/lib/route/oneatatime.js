// OpenStreetMap (Overpass) answers only a few requests of one device at a time; more come back as
// «busy» (429). The live map asked twice at once (the stops around you and the place search), so the
// place search said «OpenStreetMap ist gerade ausgelastet» (Noah 20.10.2026, picture). Now every
// Overpass request of the app waits for the one before it.
//
// The file name must not contain «overpass»: the browser tests answer every address with that word as Overpass.

let chain = Promise.resolve();

/** Run fn after the requests before it; its result or error is passed on. */
export function queued(fn) {
  const run = chain.then(() => fn());
  chain = run.catch(() => {});
  return run;
}
