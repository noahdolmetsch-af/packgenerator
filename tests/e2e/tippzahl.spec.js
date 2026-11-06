// «Versteckte Funktionen» (Noah 03.11.2026 «2a 5a»): the robot starts on Heute and taps links like a person.
// A link you see costs 1 tap, a link inside a closed fold or window («Alle n», the + menu) costs 2. Every
// function's page (HOME in src/lib/know/heimat.js) must be at most MAX_TAPS away, except TAP_GAPS.
import { test, expect } from './clock.js';
import { HOME } from '../../src/lib/know/heimat.js';
import { MAX_TAPS, FINDERS, TAP_GAPS, TAP_GAPS_BY_DATA } from '../../src/lib/know/tipps.js';
import { start } from './gesamttest/lib.js';
import { settle } from './settle.js';

test.use({ cardsOpen: false });
test.setTimeout(900_000);

const isFinder = (h) => FINDERS.some((f) => h === f || h.startsWith(f + '?') || h.startsWith(f + '/'));
const split = (h) => { const [p, q = ''] = h.split('?'); return { p: decodeURIComponent(p), q: [...new URLSearchParams(q).entries()] }; };
/** Does the link href lead to the home page target? «:trip» and the like stand for any id. */
function reaches(href, target) {
  const a = split(href), b = split(target);
  const re = new RegExp('^' + b.p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/:(trip|race|note|entry)/g, '[^/?]+') + '$');
  if (!re.test(a.p)) return false;
  const m = new Map(a.q);
  return b.q.every(([k, v]) => m.has(k) && (v === '' || v.startsWith(':') || m.get(k) === v));
}

test('every function is at most 3 taps from Heute', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'counted on the phone, where the bar has the least room');
  await start(page, context, info);
  const dist = { '#/': 0 };
  const via = {};
  const done = new Set();
  // shortest first: a page is opened only while a link on it can still be within MAX_TAPS
  for (;;) {
    const next = Object.keys(dist).filter((h) => !done.has(h) && dist[h] < MAX_TAPS && !(isFinder(h) && h !== '#/')).sort((a, b) => dist[a] - dist[b])[0];
    if (!next) break;
    done.add(next);
    await page.goto('./' + next);
    await page.locator('main').first().waitFor();
    await settle(page);
    // the tile «New» shows the newest merge, so its «Try it» link changes with every PR: it never counts as a way
    const scan = () => page.evaluate(() => [...document.querySelectorAll('a[href^="#/"]')].filter((a) => !a.closest('[data-news]')).map((a) => {
      if (a.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return [a.getAttribute('href'), 1];
      return a.closest('details:not([open]), dialog:not([open])') ? [a.getAttribute('href'), 2] : null;
    }).filter(Boolean));
    const links = await scan();
    // a card that starts as one line on the phone (Etappe 2, 1a) is a closed fold: its links cost 2 (the line, then the link)
    const lines = page.locator('[data-card-line]');
    if (await lines.count()) {
      for (let n = await lines.count(); n > 0; n = await lines.count()) {
        await lines.first().click();
        await expect(lines).toHaveCount(n - 1);
      }
      const seen = new Set(links.map(([h]) => h));
      for (const [h] of await scan()) if (!seen.has(h)) links.push([h, 2]);
      // fold them again: the choice is kept, and the next page must start from the same state
      const folds = page.locator('[data-card-fold]');
      for (let n = await folds.count(); n > 0; n = await folds.count()) {
        await folds.first().click();
        await expect(folds).toHaveCount(n - 1);
      }
    }
    for (const [href, cost] of links) if (dist[href] === undefined || dist[next] + cost < dist[href]) { dist[href] = dist[next] + cost; via[href] = next; }
  }
  const taps = (target) => Math.min(Infinity, ...Object.keys(dist).filter((h) => reaches(h, target)).map((h) => dist[h]));
  const pages = [...new Set(Object.values(HOME))];
  const far = pages.filter((p) => taps(p) > MAX_TAPS);
  console.log(`Tipps: ${pages.length} pages, ${far.length} further than ${MAX_TAPS} taps, ${done.size} pages opened`);
  if (process.env.TIPPS_LIST) console.log(JSON.stringify(far.sort()));
  if (process.env.TIPPS_VIA) for (const h of Object.keys(dist).filter((x) => reaches(x, process.env.TIPPS_VIA))) console.log(`VIA ${h} = ${dist[h]} from ${via[h]} (${dist[via[h]]})`);
  const fns = (p) => Object.keys(HOME).filter((id) => HOME[id] === p).join(', ');
  expect(far.filter((p) => !TAP_GAPS.includes(p)).map((p) => `${p} (${fns(p)})`), `Further than ${MAX_TAPS} taps from Heute: give it a link on its area page (or add it to «Alles hier»)`).toEqual([]);
  expect(TAP_GAPS.filter((p) => !far.includes(p) && !TAP_GAPS_BY_DATA.includes(p)), 'Near enough now: take it off TAP_GAPS in src/lib/know/tipps.js').toEqual([]);
});
