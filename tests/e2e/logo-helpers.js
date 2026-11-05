// «Geheimmenü»: the five taps pick a surprise by chance (src/lib/logo/surprises.js). A test fixes the chance so that
// it gets the surprise it wants, whatever other surprises are added later: it sets Math.random after the page has loaded.
import { SURPRISES } from '../../src/lib/logo/surprises.js';

/**
 * The value for Math.random() that picks `id` (the surprise before it, `prev`, is left out of the choice).
 * @param {string} id
 * @param {string|null} prev
 */
export function chanceFor(id, prev = null) {
  const pool = SURPRISES.filter((s) => s !== prev);
  const i = pool.indexOf(id);
  if (i < 0) throw new Error(`no surprise «${id}» to pick after «${prev}»`);
  return (i + 0.5) / pool.length;
}

/** Fixes the chance in the page (after the page loaded: the app itself may use Math.random on the way). */
export const fixChance = (page, id, prev = null) => page.evaluate((v) => (Math.random = () => v), chanceFor(id, prev));

/** Every surprise has one of these on screen (the weather first waits up to 1.5 s for the forecast): for a test that only needs «some surprise came». */
export const ANY_SURPRISE = '[data-logo-ride], [data-logo-saying], [data-logo-flat], [data-logo-marmot], [data-logo-weather], [data-logo-panorama], [data-logo-bells]';
