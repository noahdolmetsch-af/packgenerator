// Wege-Wächter (thread «Navigation ohne Sackgassen», Noah 23.11.2026 «ja»): a robot opens every address written
// out in the code, on a computer, with an empty app in German, and checks the three things Noah complained about:
//   1. PFAD: the path above the page starts with the place that is lit in the sidebar («Woche», not «Aktiv»).
//   2. SACKGASSE: the page has at least one link to another page of the app (the path counts).
//   3. ZURÜCK: the back button of the browser, after a step from Heute onto the page, lands on Heute again.
// The three lists below are what is known and open today. They only get shorter: a NEW problem fails the test at once
// («write the page right»), a problem that is gone only prints a note, so a PR of another thread that fixes
// one never turns red because of this list. Whoever fixes a page deletes its line here.
// Own helper: tests/e2e/wege-lib.js (the addresses are read from the source, like tests/links.test.js).
import { test, expect } from './clock.js';
import { ready } from './settle.js';
import { adressen } from './wege-lib.js';

test.skip(({ isMobile }) => isMobile, 'the sidebar (the lit place) exists on a computer only');
test.describe.configure({ mode: 'serial' });
test.setTimeout(20 * 60_000);

/** PFAD open: the path of these pages starts with another name than the lit place. Only gets shorter. */
export const PFAD_OFFEN = [];
/** SACKGASSE open: no link to another page. Only gets shorter. */
export const SACKGASSE_OFFEN = [
  // without a trip (or with an unknown id) these pages show nothing and no way on
  '#/ride', '#/race/race-sample', '#/race/race-sample/after', '#/race/race-sample/prepare', '#/race/race-sample/ride',
];
/** ZURÜCK open: the back button does not lead back to where you came from. Only gets shorter. */
export const ZURUECK_OFFEN = [
  // the page opens its own address after loading, so one more step of the back button is needed
  '#/inbox/new', '#/komoot/shared',
];

const norm = (s) => (s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();

/** What the page shows now: lit place, first step of the path, number of links in main. */
const messen = (page) =>
  page.evaluate(() => {
    const txt = (e) => (e?.textContent ?? '').replace(/\s+/g, ' ').trim();
    const main = document.querySelector('main');
    const side = document.querySelector('aside.side');
    const me = side?.querySelector('a.mecard[aria-current="page"]');
    const place = txt(side?.querySelector('.pl.on .pn')) || (me ? txt(me.querySelector('.tx b')) : '');
    const nav = main?.querySelector('nav.pcrumbs, nav.crumbs, nav.crumb, nav.pathline, [data-pathline] nav, nav[data-pathline]');
    const steps = nav ? [...nav.querySelectorAll('a, [aria-current="page"]')].filter((a) => !a.hasAttribute('data-crumb-back') && !a.classList.contains('back')).map((a) => txt(a)) : [];
    const links = new Set([...(main?.querySelectorAll('a[href^="#/"]') ?? [])].map((a) => a.getAttribute('href')));
    const body = txt(main);
    return { hash: location.hash, place, first: steps[0] ?? '', steps, links: links.size, empty: body.length === 0, lost: /^(seite nicht gefunden|page not found)/i.test(txt(main?.querySelector('h1'))) };
  });

async function oeffne(page, hash, warte = 0) {
  await page.evaluate((h) => { location.hash = h; }, hash);
  await page.locator('main').waitFor({ timeout: 15_000 });
  await page
    .waitForFunction(() => {
      const m = document.querySelector('main');
      return !!m && m.innerText.trim().length > 0 && !m.querySelector('[aria-busy="true"]');
    }, null, { timeout: 10_000 })
    .catch(() => {});
  await page.waitForTimeout(350 + warte);
}

const pruefe = (m) => ({
  pfad: !!m.place && !!m.first && norm(m.first) !== norm(m.place),
  sackgasse: m.links === 0,
});

test('Wege-Wächter: Pfad, Sackgasse und Zurück auf jeder Adresse', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/]|127\.0\.0\.1)/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/');
  await ready(page);

  const pfad = [];
  const sack = [];
  const zurueck = [];
  const liste = adressen();
  expect(liste.length, 'a guard that reads nothing is no guard').toBeGreaterThan(200);

  for (const hash of liste) {
    await page.goto('./#/');
    await page.waitForTimeout(80);
    await oeffne(page, hash);
    let m = await messen(page);
    let p = pruefe(m);
    if (p.pfad || p.sackgasse) {
      // late pages: look once more after a longer wait before it counts
      await page.waitForTimeout(1500);
      m = await messen(page);
      p = pruefe(m);
    }
    if (m.lost) {
      pfad.push(`${hash}  (Seite nicht gefunden)`);
      continue;
    }
    if (p.pfad) pfad.push(hash);
    if (p.sackgasse) sack.push(hash);
    // back: Heute → page → back lands on Heute (the page may have replaced its own address, so we compare with Heute)
    await page.goBack().catch(() => {});
    await page.waitForTimeout(250);
    const nach = await page.evaluate(() => location.hash || '#/');
    if (nach !== '#/' && nach !== '#') zurueck.push(`${hash} → ${nach}`);
  }

  if (process.env.WEGE_DRUCK) {
    console.log('PFAD_OFFEN', JSON.stringify(pfad, null, 1));
    console.log('SACKGASSE_OFFEN', JSON.stringify(sack, null, 1));
    console.log('ZURUECK_OFFEN', JSON.stringify(zurueck, null, 1));
    return;
  }

  const neu = (ist, bekannt) => ist.filter((x) => !bekannt.includes(x.split(' ')[0]) && !bekannt.includes(x));
  const weg = (ist, bekannt) => bekannt.filter((x) => !ist.some((y) => y === x || y.split(' ')[0] === x.split(' ')[0]));
  for (const [name, ist, bekannt] of [['PFAD_OFFEN', pfad, PFAD_OFFEN], ['SACKGASSE_OFFEN', sack, SACKGASSE_OFFEN], ['ZURUECK_OFFEN', zurueck, ZURUECK_OFFEN]]) {
    const w = weg(ist, bekannt);
    if (w.length) console.log(`${name}: no longer open (delete the line): ${w.join(', ')}`);
  }
  expect(neu(pfad, PFAD_OFFEN), 'the path starts with another name than the lit place: write it with the place name (src/lib/nav.js placeOf)').toEqual([]);
  expect(neu(sack, SACKGASSE_OFFEN), 'a page without a link to another page: add the way on («Weiter zu …») or the way back').toEqual([]);
  expect(neu(zurueck, ZURUECK_OFFEN), 'the back button does not lead back: the page pushed an address of its own, use replaceState').toEqual([]);
});
