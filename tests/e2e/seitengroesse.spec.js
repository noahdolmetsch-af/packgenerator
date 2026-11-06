// Wächter «Seitengrösse» (Tempo-Runde, Noah 05.11.2026): the pages that open slowest on a phone, each with the number
// of elements it builds. A page that builds more than its budget fails: the page opens slower for everyone, so
// parts that wait folded must be built when they are opened (like Meine Sportarten, Meilensteine, Bausteine).
// Elements, not milliseconds: the count is the same on every machine, so the test does not flake. The budget is
// the count measured on 05.11.2026 with the fictional data of home0460-fixture.js plus 12 %; a page that got
// lighter keeps its old budget until someone lowers it (tests/seitengroesse-budget.json). Run
// SEITE_UPDATE=1 npx playwright test tests/e2e/seitengroesse.spec.js --project=desktop
// to write today's counts (+12 %) as the new budget (say why in the PR). The window is 390 px wide (a phone): the sidebar of a computer adds its own.
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { openHome } from './home0460-fixture.js';

const ROUTES = [
  '#/trips',
  '#/gear',
  '#/gear?tab=wishlist',
  '#/gear/supplies',
  '#/bikes',
  '#/bikes?tab=care',
  '#/blocks',
  '#/flow',
  '#/flow/sports',
  '#/flow/milestones',
  '#/trips/dreams',
  '#/neuland',
  '#/me/abfragen',
  '#/me/wohl',
];
const FILE = fileURLToPath(new URL('../seitengroesse-budget.json', import.meta.url));
const UPDATE = !!process.env.SEITE_UPDATE;
const budget = UPDATE ? {} : JSON.parse(readFileSync(FILE, 'utf8'));

/** The number of elements once two readings, 300 ms apart, agree (the page may still fill from the database). */
async function count(page) {
  let last = -1;
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(i ? 300 : 500);
    const n = await page.evaluate(() => document.getElementsByTagName('*').length);
    if (n === last) return n;
    last = n;
  }
  return last;
}

test('Seitengroesse: slow pages stay under their element budget', async ({ page, context }, info) => {
  // The Wächter job runs the desktop project first: it opens a phone-sized window, so the count does not wait for the phone job.
  test.skip(info.project.name !== 'desktop', 'one project is enough');
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 390, height: 844 });
  page.on('dialog', (d) => d.dismiss());
  await openHome(page, context, info);
  const got = {};
  for (const route of ROUTES) {
    await page.goto(`./${route}`);
    await page.locator('main h1').first().waitFor();
    got[route] = await count(page);
  }
  if (UPDATE) {
    writeFileSync(FILE, JSON.stringify(Object.fromEntries(Object.entries(got).map(([k, v]) => [k, Math.ceil((v * 1.12) / 10) * 10])), null, 2) + '\n');
    console.log('SEITE', JSON.stringify(got));
    return;
  }
  const over = Object.entries(got).filter(([r, n]) => n > budget[r]).map(([r, n]) => `${r}: ${n} elements, budget ${budget[r]}`);
  expect(over, `Pages that build too many elements (build folded parts when they are opened, or lower the budget with a reason):\n${over.join('\n')}`).toEqual([]);
  expect(Object.keys(budget).sort()).toEqual([...ROUTES].sort());
});
