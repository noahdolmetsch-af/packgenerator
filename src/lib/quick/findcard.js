/**
 * «Quick Links» steps 2 and 3: the card of a function on the page. The functions whose home is this page
 * (know/heimat.js) are found by their shown title, as tests/e2e/heimat.spec.js does; the card is the
 * closest section, list row, fold or tile around it. PinMarks.svelte puts its pin there, and a tap on a
 * pin in Quick Links goes to the page and lights the card up (Noah «5a»: «springt genau hin und leuchtet»).
 */
import { FEATURE } from '../features.js';
import { t } from '../i18n.svelte.js';
import { featuresOn, textFits, homeMatches } from './pinmarks.js';
import { HOME } from '../know/heimat.js';
import { SPOT, showSpot, light } from '../know/spot.js';

const SEL = 'h1, h2, h3, h4, summary, button, a, label, [role=tab], th';
const CARD = 'section, article, details, li, [role=tab], table, .card, [class*="card"], [class*="tile"]';
// titles first (a card's heading), then folds, tabs and table heads, buttons and links last
const rank = (e) => (/^H[1-4]$/.test(e.tagName) ? 0 : /^(SUMMARY|TH|LABEL)$/.test(e.tagName) || e.getAttribute('role') === 'tab' ? 1 : 2);

/** The shown title and card of each function of this page: [{ id, card, title }], one per card. ids: only these. */
export function findCards(hash, ids = null) {
  const main = document.querySelector('main');
  if (!main) return [];
  const els = [...main.querySelectorAll(SEL)]
    .filter((e) => e.getClientRects().length && !e.closest('dialog, [role=dialog]'))
    .sort((a, b) => rank(a) - rank(b));
  const used = new Set();
  const out = [];
  for (const id of ids ?? featuresOn(hash)) {
    if (!FEATURE[id]) continue;
    const name = t(FEATURE[id].title);
    const title = els.find((e) => textFits(e.innerText || e.getAttribute('aria-label') || '', name));
    if (!title) continue;
    let card = title.closest(CARD);
    if (!card || !main.contains(card) || card.getBoundingClientRect().height > innerHeight * 1.5) card = title;
    if (used.has(card)) continue;
    used.add(card);
    out.push({ id, card, title });
  }
  return out;
}

/**
 * After a tap on a pin: wait for the page, then light up the card of the function (its own steps in
 * know/spot.js first; a function that is a page of its own lights up the page title). False when the card is not found within a few seconds (the page stays as it is).
 */
export async function glowFeature(id, wait = 5000) {
  if (SPOT[id]) return showSpot(id);
  await new Promise((ok) => setTimeout(ok, 300));
  for (let n = 0; n < wait / 200; n++) {
    const [hit] = findCards(location.hash, [id]);
    if (hit) {
      light(hit.card, id);
      return true;
    }
    // the function is a page of its own (its home is the page that leads there): light up its title
    const h1 = document.querySelector('main h1');
    if (h1 && HOME[id] && !homeMatches(HOME[id], location.hash)) {
      light(h1, id);
      return true;
    }
    await new Promise((ok) => setTimeout(ok, 200));
  }
  return false;
}
