// «332 Use Cases sichtbar machen» (Noah 24.10.2026 «1a 2b 3a 4 nein 5b»): the robot opens the home page of every
// function (src/lib/know/heimat.js) on the phone and checks that the function can be seen there under its
// catalogue name: not inside a closed fold and within the first 2.5 screens. Functions in GAPS are not yet
// visible and are left out; the packages «Alltag sichtbar» and «Touren sichtbar» shorten that list.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { HOME, GAPS } from '../../src/lib/know/heimat.js';
import { start, tr } from './gesamttest/lib.js';
import { settle } from './settle.js';

const T = tr('de');
const SCREENS = 2.5;
// features.js and tips.js need Svelte (through i18n), so their titles are read as text: { id → English title }
const src = (f) => readFileSync(fileURLToPath(new URL(`../../src/lib/${f}`, import.meta.url)), 'utf8');
const TITLE = Object.fromEntries([...(src('tips.js') + src('features.js')).matchAll(/\{ id: '([^']+)'[^\n]*?title: (?:'((?:[^'\\]|\\.)*)'|"([^"]*)")/g)].map((m) => [m[1], (m[2] ?? m[3]).replace(/\\'/g, "'")]));
/** The German name of a function as «What the app can do» shows it, without brackets and stars. */
const nameOf = (id) => T(TITLE[id]).replace(/\s*\(.*?\)\s*/g, ' ').replace(/[«»★]/g, '').trim();

test.setTimeout(600_000);

test('every function is visible on its home page', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'measured on the phone, where space is short');
  await start(page, context, info);
  const byPage = {};
  for (const id of Object.keys(HOME)) if (!GAPS[id]) (byPage[HOME[id]] ??= []).push({ id, name: nameOf(id) });
  const missing = Object.keys(HOME).filter((id) => !GAPS[id] && !TITLE[id]).map((id) => `${id}: title not found in features.js or tips.js`);
  // «:trip»: the trip whose debrief is still open («Rückblick weiterschreiben» under Touren › Rückblick)
  let trip = null;
  if (Object.keys(byPage).some((h) => h.includes(':trip'))) {
    await page.goto('./#/debrief');
    await page.locator('main').waitFor();
    await settle(page);
    const href = await page.getByRole('link', { name: T('Continue the debrief') }).first().getAttribute('href');
    trip = decodeURIComponent(href.replace('#/debrief/', ''));
  }
  for (const [href, list] of Object.entries(byPage)) {
    await page.goto(`./${href.replace(':trip', encodeURIComponent(trip))}`);
    await page.locator('main').waitFor();
    await settle(page);
    const found = await page.evaluate(
      ({ names, screens }) => {
        const vh = innerHeight;
        const open = (el) => {
          for (let e = el; e; e = e.parentElement) {
            if (e.tagName === 'DETAILS' && !e.open && !e.querySelector(':scope > summary')?.contains(el)) return false;
            const s = getComputedStyle(e);
            if (s.display === 'none' || s.visibility === 'hidden') return false;
          }
          return el.getClientRects().length > 0;
        };
        const els = [...document.querySelectorAll('main *, header *, [role=dialog] *')].filter((e) => e.children.length === 0 || /^(BUTTON|A|SUMMARY|H\d|LABEL)$/.test(e.tagName));
        return names.map((n) => {
          const low = n.toLowerCase();
          return els.some((e) => (e.innerText || e.getAttribute('aria-label') || '').toLowerCase().includes(low) && open(e) && (e.getBoundingClientRect().top + scrollY) / vh <= screens);
        });
      },
      { names: list.map((x) => x.name), screens: SCREENS },
    );
    list.forEach((x, i) => found[i] || missing.push(`${x.id} «${x.name}» on ${href}`));
  }
  info.annotations.push({ type: 'checked', description: `${Object.values(byPage).flat().length} functions on ${Object.keys(byPage).length} pages` });
  expect(missing, 'not visible on the home page: fix the page, use the page name in the catalogue (2b), or add it to GAPS with why').toEqual([]);
});
