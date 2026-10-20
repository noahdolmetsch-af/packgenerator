// A running ride must not be cut by an automatic reload (Noah 20.10.2026: the live map «stürzte ab» and fell
// back to the start: a new version had taken over and the page loaded anew in the middle of the ride).
// While something holds, swupdate.js and lazy.js do not reload; the new version comes after the ride.

const holds = new Set();

/** Hold automatic reloads; returns the release. */
export function hold(key) {
  holds.add(key);
  return () => holds.delete(key);
}
/** Is a reload held right now? */
export const held = () => holds.size > 0;
