// Gesamttest round 1, part 1: every page and the main open states, with the big fictional data set
// (tests/fixtures/gesamttest/make.mjs: 700 items, 4 bikes, 30 trips, 25 debriefs …), in German and
// English, on a phone (390 and 320 px) and a computer (1366 px). On every page:
//   no console errors, no sideways scroll, nothing cut off (no hidden overflow, no word broken in
//   the middle of a control), every control has a name, no untranslated English in German
//   (English UI keys that have a German text), and the time until the page is ready.
// The fixture is imported once per worker through the app's own "Import backup" and kept as the
// browser state (IndexedDB included), so each test starts from the same data.
// Failing checks that are real findings are marked with test.fail and the G-ID of
// /mnt/project-files/design/gesamttest/befunde-runde1.md.
import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { existsSync, statSync, mkdirSync, renameSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fixture, prepare, importBackup, view, sideways, cutOff, brokenWords, unnamed, untranslated, record, tr, table, shot } from './lib.js';
import { newButton } from '../newbutton.js';

const { summary } = fixture();
const TRIP = summary.tripIds;

/** Ready-time budget per page (ms, fresh load with 700 items). In CI (shared, slower runners) a
 * generous budget, so load never flips the check; it still catches a page that takes many seconds. */
const BUDGET = process.env.CI ? 10_000 : 4000;

const tap = async (loc) => {
  await loc.first().click();
  await loc.page().waitForTimeout(250);
};
/** The pages and main open states. trip: the trip Pack and Ride open; act: what a person opens. */
const CASES = [
  { id: 'today', hash: '#/' },
  // v0.76.0: on a phone the round + steps aside while Today's 8 buttons are on the screen (newbutton.js)
  { id: 'today-new-sheet', hash: '#/', act: async (page, T) => tap(await newButton(page, T('New'))) },
  // v0.76.0 «Fünf Orte»: «Ich» (top right) took the place of the «More» sheet
  { id: 'me', hash: '#/me' },
  { id: 'keys', hash: '#/me', act: async (page, T) => tap(page.locator('main').getByRole('button', { name: T('Help and keyboard shortcuts') })) },
  {
    id: 'today-search',
    hash: '#/',
    act: async (page, T) => {
      // v0.46.0: the search is the "What do you want to do?" command line (search or say an action)
      const box = page.getByRole('searchbox', { name: T('What do you want to do? Search or say an action') });
      if (!(await box.isVisible())) await tap(page.getByRole('button', { name: T('Search everything') }));
      await box.fill('jacke');
      await page.waitForTimeout(400);
    },
  },
  { id: 'today-data', hash: '#/', act: async (page) => tap(page.locator('details.data > summary')) },
  { id: 'features', hash: '#/features' },
  // v0.77.0 KI-Helfer: Ich › Helfer and New trip before the setup (the notice with «What goes to Claude?» open).
  // v0.76.0 «Fünf Orte»: New trip opens from Trips («+ New trip»), no longer from the list's ••• menu.
  { id: 'helper', hash: '#/helper' },
  {
    id: 'new-trip-helper',
    hash: '#/trips',
    act: async (page, T) => {
      await tap(page.locator('main').getByRole('button', { name: T('New trip'), exact: true }));
      await tap(page.getByRole('dialog', { name: T('New trip') }).getByText(T('What goes to Claude?')));
    },
  },
  { id: 'plan-event', hash: '#/pack', trip: TRIP.event },
  { id: 'plan-event-before', hash: '#/pack', trip: TRIP.event, act: async (page, T) => tap(page.locator('summary, button').filter({ hasText: T('Before the trip') })) },
  { id: 'plan-ski', hash: '#/pack', trip: TRIP.ski },
  { id: 'plan-world', hash: '#/pack', trip: TRIP.travel },
  { id: 'pack-tent', hash: '#/pack?day', trip: TRIP.tent },
  { id: 'ride-running', hash: '#/ride', trip: TRIP.running },
  { id: 'templates', hash: '#/pack/templates' },
  { id: 'past', hash: '#/pack/past' },
  { id: 'debriefs', hash: '#/debrief' }, // v0.49.0 R1: also the old #/review and #/debrief/compare
  { id: 'debrief-past', hash: `#/debrief/${TRIP.past}` },
  { id: 'debrief-running', hash: `#/debrief/${TRIP.running}` },
  { id: 'learnings', hash: '#/debrief/learnings' },
  { id: 'pace', hash: '#/debrief/pace' },
  { id: 'logbook', hash: '#/debrief/logbook' },
  { id: 'rides', hash: '#/debrief/ride' },
  { id: 'ride-detail', hash: '#/debrief/ride/ride-gtp-01' },
  { id: 'gear', hash: '#/gear' },
  { id: 'gear-wishlist', hash: '#/gear', act: async (page, T) => tap(page.getByRole('button', { name: new RegExp(`^${T('Wishlist')}`) }).or(page.getByRole('tab', { name: new RegExp(`^${T('Wishlist')}`) }))) },
  {
    id: 'gear-item',
    hash: '#/gear?q=Multitool',
    act: async (page) => {
      await page.waitForTimeout(300);
      await tap(page.getByRole('button', { name: /Multitool/ }));
    },
  },
  { id: 'gear-import', hash: '#/gear/import' },
  { id: 'favorites', hash: '#/favorites' },
  { id: 'wardrobe', hash: '#/wardrobe' },
  { id: 'blocks', hash: '#/blocks' },
  { id: 'bikes', hash: '#/bikes' },
  { id: 'bike-gravel', hash: `#/bikes?bike=${encodeURIComponent(summary.bikeIds[2])}` },
  { id: 'care', hash: '#/care' },
  { id: 'care-hardtail', hash: `#/bikes?tab=care&bike=${encodeURIComponent(summary.bikeIds[0])}&open=1` },
  { id: 'inbox', hash: '#/inbox' },
  // v0.69.1 Gesamttest-Runde: the screens of 0.68 «Q1», 0.69 «Velo-Blätter» and «Im Flow»
  { id: 'km-import', hash: `#/bikes?tab=care&view=import&bike=${encodeURIComponent(summary.bikeIds[2])}` },
  { id: 'sheets-all', hash: `#/bikes?bike=${encodeURIComponent(summary.bikeIds[2])}&sheet=all` },
  { id: 'flow', hash: '#/flow' },
  { id: 'flow-new', hash: '#/flow/new' },
  { id: 'notes', hash: '#/notes' },
];

/** Findings that make a case fail today (G-IDs of the findings list); keyed "case" or "case/lang". */
// Keys: "case/lang/project", "case/lang" or "case" (the most exact one wins).
const KNOWN = {};
const known = (gid, project, langs, ids) => {
  for (const id of ids) for (const l of langs) KNOWN[`${id}/${l}/${project}`] = gid;
};
// G004–G009 fixed in 0.45.1 (break-word instead of anywhere); G003 (Today) fixed by the new start page in 0.46.0.

/* ---------- one import per worker, kept as the browser state ---------- */

let statePath = null;
/** The context options of this project (only what a context takes). */
const ctxOpts = (info, extra = {}) => {
  const u = info.project.use;
  return { baseURL: u.baseURL, viewport: u.viewport, isMobile: u.isMobile, hasTouch: u.hasTouch, timezoneId: u.timezoneId, serviceWorkers: 'block', ...extra };
};
// A failing test restarts its worker (and so this beforeAll): the imported state is kept on disk for
// 30 minutes per project and fixture, so the 700 items are imported a few times per run, not per failure.
const HASH = createHash('sha1').update(JSON.stringify(fixture().data)).digest('hex').slice(0, 10);
test.beforeAll(async ({ browser }, info) => {
  const dir = `${tmpdir()}/gesamttest-state/`;
  mkdirSync(dir, { recursive: true });
  // the stored IndexedDB belongs to one origin: the port is part of the name (several checkouts run at once)
  const port = new URL(info.project.use.baseURL).port;
  statePath = `${dir}state-${info.project.name}-${port}-${HASH}.json`;
  if (existsSync(statePath) && Date.now() - statSync(statePath).mtimeMs < 30 * 60_000) return;
  const ctx = await browser.newContext(ctxOpts(info));
  const page = await ctx.newPage();
  await prepare(page, ctx, 'de');
  await page.goto('./');
  await importBackup(page, info, fixture().data, { lang: 'de', name: 'gesamttest.json' });
  await expect.poll(async () => (await table(page, 'settings')).some((s) => s.key === 'update.templatesLinked2026'), { timeout: 30_000 }).toBe(true);
  await page.waitForTimeout(500);
  const tmp = `${statePath}.${info.workerIndex}.tmp`;
  await ctx.storageState({ path: tmp, indexedDB: true });
  renameSync(tmp, statePath);
  await ctx.close();
});

for (const lang of ['de', 'en']) {
  test.describe(`pages ${lang}`, () => {
    for (const c of CASES) {
      test(`${c.id} ${lang}`, async ({ browser }, info) => {
        const gid = KNOWN[`${c.id}/${lang}/${info.project.name}`] ?? KNOWN[`${c.id}/${lang}`] ?? KNOWN[c.id];
        if (gid) test.fail(true, gid);
        const T = tr(lang);
        const phone = info.project.name === 'phone';
        const widths = phone ? [390, 320] : [1366];
        const ctx = await browser.newContext(ctxOpts(info, { storageState: statePath, viewport: { width: widths[0], height: phone ? 844 : 900 } }));
        const page = await ctx.newPage();
        const errors = await prepare(page, ctx, lang);
        await page.addInitScript(([l]) => localStorage.setItem('lang', l), [lang]);
        try {
          await page.goto('./');
          if (c.trip) await page.evaluate((id) => localStorage.setItem('pack.currentTrip', id), c.trip);
          for (const w of widths) {
            await page.setViewportSize({ width: w, height: phone ? 844 : 900 });
            const before = errors.length;
            const ms = await view(page, c.hash);
            if (c.act) await c.act(page, T);
            const where = `${c.id} ${lang} ${w}px`;
            record('ready', { case: c.id, lang, w, ms });
            const side = await sideways(page);
            const cut = await cutOff(page);
            const broken = await brokenWords(page);
            const noName = await unnamed(page.locator('body'));
            const words = lang === 'de' ? await untranslated(page) : { exact: [], words: [] };
            if (words.words.length) record('english-hints', { case: c.id, w, words: words.words });
            if (process.env.GTP_PAGE_SHOTS) await shot(page, `${c.id}-${lang}-${w}`, { fullPage: false });
            expect.soft(errors.slice(before), `${where}: console errors`).toEqual([]);
            expect.soft(side.sw, `${where}: sideways scroll; sticking out: ${side.wide.join(', ')}`).toBeLessThanOrEqual(side.w);
            expect.soft(cut, `${where}: cut off`).toEqual([]);
            expect.soft(broken, `${where}: words broken in the middle`).toEqual([]);
            expect.soft(noName, `${where}: controls without a name`).toEqual([]);
            expect.soft(words.exact, `${where}: English UI text in German`).toEqual([]);
            expect.soft(ms, `${where}: ready time (ms)`).toBeLessThan(BUDGET);
            if (c.act) await page.keyboard.press('Escape');
          }
        } finally {
          await ctx.close();
        }
      });
    }
  });
}
