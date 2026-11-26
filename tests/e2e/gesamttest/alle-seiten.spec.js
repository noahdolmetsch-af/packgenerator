// Gesamttest round 2, part 1: every address written out in the app's code (the same reading as the Wege-Wächter,
// tests/e2e/wege-lib.js) that round 1 (pages.spec.js CASES) does not open yet, with the big fictional data set of round 1
// plus the «Aktiv» layer (Fitbit days, Strava rides, «Im Flow» ticks, daily checks, km book: make.mjs aktivLayer).
// The same checks as round 1 on each page: no console errors, no sideways scroll, nothing cut off, no word broken in the
// middle, every control has a name, no untranslated English in German, and the time until the page is ready.
//
// Part of the nightly Gesamttest (test plan «Tests auf den neuen App-Stand bringen», step 3, Noah «1-8» 26.11.2026): the list of
// addresses is the one list of the app (tests/e2e/wege-lib.js), so a new page is opened without anyone writing it down. By hand:
//   PW_CHROMIUM=/opt/pw-browsers/chromium E2E_PORT=53xx npx playwright test tests/e2e/gesamttest/alle-seiten.spec.js --project=phone --workers=2
// Options: GTP_LANGS=de,en (default de; English only by hand), GTP_DARK=1 (dark colours), GTP_PAGE_SHOTS=1 with GTP_SHOTS=<folder> (a picture per page),
// GTP_ONLY=<text> (only addresses that contain it). Afterwards: git checkout -- qa/
//
// A failing check that is a real finding is marked in KNOWN with its G-ID (round 2 list /mnt/project-files/design/gesamttest/befunde-runde2.md).
import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { existsSync, statSync, mkdirSync, renameSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { settle } from '../settle.js';
import { adressen } from '../wege-lib.js';
import { aktivLayer } from '../../fixtures/gesamttest/make.mjs';
import { fixture, prepare, importBackup, view, sideways, cutOff, brokenWords, unnamed, untranslated, record, tr, table, shot } from './lib.js';

const { data, summary } = fixture();
const LANGS = (process.env.GTP_LANGS ?? 'de').split(',').filter(Boolean);
const DARK = !!process.env.GTP_DARK;
const BUDGET = process.env.CI ? 10_000 : 4000;

/** Round 1 already opens these (pages.spec.js CASES): read from that file, so the two lists never overlap. */
const ROUND1 = new Set([...readFileSync(new URL('./pages.spec.js', import.meta.url), 'utf8').matchAll(/hash: '(#[^']+)'/g)].map((m) => m[1]));
const bare = (h) => h.replace(/[?&].*$/, '');
const round1Bare = new Set([...ROUND1].map(bare));
/** Every address of the code that round 1 leaves out (a sub-address with a query counts as opened when its page is). */
const ADDRESSES = adressen().filter((h) => !round1Bare.has(bare(h)) && (!process.env.GTP_ONLY || h.includes(process.env.GTP_ONLY)));

/** The fixture with the Aktiv layer: the same backup as round 1 plus the rows that round 1 does not have. */
const DATA2 = { ...data, tables: { ...data.tables, ...aktivLayer(summary.today, summary.bikeIds) } };

/**
 * Findings that make a case fail today (G-IDs of the findings list, /mnt/project-files/design/gesamttest/befunde-runde2.md); keyed
 * "address/lang/project", "address/lang" or "address". A case marked here is expected to fail: when its page is repaired the case
 * turns red with «expected to fail, but passed», and whoever repaired it deletes its line here (the list only gets shorter).
 *  C6: long tour names in the lists of Auswerten › Analyse and of Körperwerte › Rückblick are cut off on a phone (a fixed column beside them).
 *  C9: Körperwerte pages are wider than 320 px after the window went from 390 to 320 px (not reproducible with a fresh page).
 */
const KNOWN = {
  '#/auswerten/analyse/late/de/phone': 'C6',
  '#/auswerten/analyse/rhr/de/phone': 'C6',
  '#/flow/review/de/phone': 'C6, C9',
  '#/flow/stats/felt/de/phone': 'C9',
};

let statePath = null;
const ctxOpts = (info, extra = {}) => {
  const u = info.project.use;
  return { baseURL: u.baseURL, viewport: u.viewport, isMobile: u.isMobile, hasTouch: u.hasTouch, timezoneId: u.timezoneId, serviceWorkers: 'block', colorScheme: DARK ? 'dark' : 'light', ...extra };
};
// One import per worker, kept 30 minutes on disk per project and fixture (like round 1; the layer changes the hash).
const HASH = createHash('sha1').update(JSON.stringify(DATA2)).digest('hex').slice(0, 10);
test.beforeAll(async ({ browser }, info) => {
  const dir = `${tmpdir()}/gesamttest-state/`;
  mkdirSync(dir, { recursive: true });
  const port = new URL(info.project.use.baseURL).port;
  statePath = `${dir}state2-${info.project.name}-${port}-${HASH}.json`;
  if (existsSync(statePath) && Date.now() - statSync(statePath).mtimeMs < 30 * 60_000) return;
  const ctx = await browser.newContext(ctxOpts(info));
  const page = await ctx.newPage();
  await prepare(page, ctx, 'de');
  await page.goto('./');
  await importBackup(page, info, DATA2, { lang: 'de', name: 'gesamttest2.json' });
  await expect.poll(async () => (await table(page, 'settings')).some((s) => s.key === 'update.templatesLinked2026'), { timeout: 30_000 }).toBe(true);
  // the rows of the layer are there (a table the import dropped would leave whole pages empty and the checks green)
  for (const t of ['healthDays', 'flowLog', 'flowChecks', 'kmBook', 'activities']) {
    await expect.poll(async () => (await table(page, t)).length, { message: `table ${t} imported`, timeout: 20_000 }).toBeGreaterThanOrEqual(DATA2.tables[t].length); // the app adds a few rows of its own at the start (kmBook: 4)
  }
  await page.waitForTimeout(500);
  const tmp = `${statePath}.${info.workerIndex}.tmp`;
  await ctx.storageState({ path: tmp, indexedDB: true });
  renameSync(tmp, statePath);
  await ctx.close();
});

test('the list of addresses is not empty (a sweep that opens nothing is no sweep)', () => {
  if (!process.env.GTP_ONLY) expect(ADDRESSES.length).toBeGreaterThan(100);
  else expect(ADDRESSES.length).toBeGreaterThan(0);
});

for (const lang of LANGS) {
  test.describe(`alle Seiten ${lang}`, () => {
    for (const hash of ADDRESSES) {
      test(`${hash} ${lang}`, async ({ browser }, info) => {
        const gid = KNOWN[`${hash}/${lang}/${info.project.name}`] ?? KNOWN[`${hash}/${lang}`] ?? KNOWN[hash];
        if (gid) test.fail(true, gid);
        const phone = info.project.name === 'phone';
        const widths = phone ? [390, 320] : [1366];
        const ctx = await browser.newContext(ctxOpts(info, { storageState: statePath, viewport: { width: widths[0], height: phone ? 844 : 900 } }));
        const page = await ctx.newPage();
        const errors = await prepare(page, ctx, lang);
        await page.addInitScript(([l]) => localStorage.setItem('lang', l), [lang]);
        try {
          await page.goto('./');
          await settle(page); // in the evening Heute opens Unterwegs once a day: let it decide before the page is opened
          await page.evaluate((id) => localStorage.setItem('pack.currentTrip', id), summary.tripIds.running);
          for (const w of widths) {
            await page.setViewportSize({ width: w, height: phone ? 844 : 900 });
            const before = errors.length;
            const ms = await view(page, hash);
            const where = `${hash} ${lang} ${w}px`;
            record('ready', { case: hash, lang, w, ms });
            const lost = await page.evaluate(() => /^(seite nicht gefunden|page not found)/i.test(document.querySelector('main h1')?.textContent?.trim() ?? ''));
            const side = await sideways(page);
            const cut = await cutOff(page);
            const broken = await brokenWords(page);
            const noName = await unnamed(page.locator('body'));
            const words = lang === 'de' ? await untranslated(page) : { exact: [], words: [] };
            if (words.words.length) record('english-hints', { case: hash, w, words: words.words });
            if (process.env.GTP_PAGE_SHOTS) await shot(page, `${hash.replace(/[^\w]+/g, '_')}-${lang}-${w}`, { fullPage: false });
            expect.soft(lost, `${where}: «page not found»`).toBe(false);
            expect.soft(errors.slice(before), `${where}: console errors`).toEqual([]);
            expect.soft(side.sw, `${where}: sideways scroll; sticking out: ${side.wide.join(', ')}`).toBeLessThanOrEqual(side.w);
            expect.soft(cut, `${where}: cut off`).toEqual([]);
            expect.soft(broken, `${where}: words broken in the middle`).toEqual([]);
            expect.soft(noName, `${where}: controls without a name`).toEqual([]);
            expect.soft(words.exact, `${where}: English UI text in German`).toEqual([]);
            expect.soft(ms, `${where}: ready time (ms)`).toBeLessThan(BUDGET);
          }
        } finally {
          await ctx.close();
        }
      });
    }
  });
}
