// v0.27.0 (AP23, M5): the 16 binding test cases PF01–PF16 of the roadmap ("Verbindliche
// Prüffälle"), played through the real screens with the same start data each time
// (tests/e2e/pf-fixture.json, fictional, test_data_gtp_ names). Open-Meteo is mocked; nothing
// leaves the preview server. Only the fixture is loaded "behind the screens" (through the app's own
// Import backup); everything else goes the way a human taps.
//
// Each case records its expectations as checks. A check that fails today and is listed in
// KNOWN_GAPS is reported (console line "[PF] …", test annotation) but does not turn the suite red;
// any other failing check does. When a gap gets fixed, the run says so: then remove it from
// KNOWN_GAPS so it is guarded from then on. Clicks and machine seconds (first click until the
// checkable result) are logged for PF01, PF05, PF06 and PF07.
// PF_SHOTS=<folder> saves one screenshot per case and project there (never into the repo).
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';

const LANG = process.env.PF_LANG === 'en' ? 'en' : 'de';
const tr = (lang) => (en, vars) => {
  const text = (lang === 'de' ? DE[en] : null) ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const T = tr(LANG);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const P = 'test_data_gtp_';
const RAW = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
const FIX = JSON.parse(RAW);
const key = (itemId) => (itemId.startsWith(P) ? itemId.slice(P.length) : itemId);
const ITEM = Object.fromEntries(FIX.tables.items.map((i) => [key(i.id), i]));
const nm = (key) => (LANG === 'de' ? ITEM[key].nameDe : ITEM[key].name);
const id = (key) => P + key;
const BIKE = { scale: `${P}scale`, spark: `${P}spark`, gravel: `${P}gravel` };

/** YYYY-MM-DD in Zurich, n days from today. */
const day = (n = 0) => new Date(Date.now() + n * 864e5).toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });

/** Items that only belong to night sets: on a day ride each of them is one to take out by hand. */
const NIGHT_SETS = ['base', 'sleep', 'warm', 'cook', 'lodging'];
const nightOnly = (i) => i.sets?.length && i.sets.every((s) => NIGHT_SETS.includes(s) || s.startsWith('u-')) && i.sets.some((s) => NIGHT_SETS.includes(s)) && !i.role && !i.always && i.coldBelow == null && !i.rain;

/**
 * Checks that fail on v0.27.0 and are reported in the protocol instead of failing the suite.
 * Key: "PFxx: check label". Remove a line once the run reports it as passing.
 */
// v0.27.0 (AP23): gaps found on 2026-10-08, see design/v0270/pf/protokoll.md. App code is not changed in AP23.
// v0.27.0 (pffix): PF02, PF03, PF04, PF05, PF10 and S1 are fixed and guarded again.
const KNOWN_GAPS = new Set([]);

/* ---------- start, mocks, records ---------- */

/** Open-Meteo: 16 days from today, 6–13 °C, dry (→ "Chilly"); one place for any search. */
function meteo() {
  const time = Array.from({ length: 16 }, (_, n) => day(n));
  return { daily: { time, temperature_2m_min: time.map(() => 6), temperature_2m_max: time.map(() => 13), precipitation_sum: time.map(() => 0.2), precipitation_probability_max: time.map(() => 20) } };
}

/** The fixture with its relative dates ("@+10" = in ten days) filled in, as a file to import. */
function fixtureFile(info) {
  const path = info.outputPath('pf-fixture.json');
  writeFileSync(path, RAW.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`));
  return path;
}

/** Fresh browser data: the fixture through Today → Your data → Import backup → Replace all data. */
async function start(page, context, info) {
  const file = fixtureFile(info);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await page.route(/api\.open-meteo\.com\/v1\/forecast/, (route) => route.fulfill({ json: meteo() }));
  await page.route(/geocoding-api\.open-meteo\.com/, (route) => route.fulfill({ json: { results: [{ name: `${P} Delémont`, admin1: 'Jura', country: 'Switzerland', latitude: 47.36, longitude: 7.35 }] } }));
  await context.addInitScript((l) => localStorage.setItem('lang', l), LANG);
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  const data = page.locator('details.data');
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await expect(data.getByText(T('Imported {name} (replaced all data).', { name: 'pf-fixture.json' }))).toBeVisible();
  return errors;
}

/** All records of a table, read straight from IndexedDB (reading only). */
const table = (page, name) =>
  page.evaluate((n) => new Promise((ok, no) => {
    const r = indexedDB.open('pack-generator');
    r.onerror = () => no(r.error);
    r.onsuccess = () => {
      const q = r.result.transaction(n).objectStore(n).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);
const tripNamed = async (page, title) => (await table(page, 'trips')).find((x) => x.title === title) ?? null;
const setting = async (page, key) => (await table(page, 'settings')).find((s) => s.key === key)?.value;
const wide = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/**
 * One case's record: checks, clicks, seconds. check() runs one expectation with a short wait and
 * records it; done() logs the line for the protocol and fails on any failing check that is not a
 * known gap.
 */
function record(caseId, info, page) {
  const r = { case: caseId, project: info.project.name, lang: LANG, checks: [], clicks: null, seconds: null, fields: null, counts: {} };
  let t0 = null;
  return {
    r,
    clicks: 0,
    fields: 0,
    /** A click a human makes (selectOption counts as one click too). */
    async click(loc) {
      if (t0 == null) t0 = Date.now();
      await loc.click();
      this.clicks++;
    },
    async select(loc, value) {
      if (t0 == null) t0 = Date.now();
      await loc.selectOption(value);
      this.clicks++;
    },
    async fill(loc, value) {
      if (t0 == null) t0 = Date.now();
      await loc.fill(value);
      this.fields++;
    },
    /** Stop the clock: the checkable result is on the screen. */
    stop() {
      r.seconds = Number(((Date.now() - (t0 ?? Date.now())) / 1000).toFixed(1));
      r.clicks = this.clicks;
      r.fields = this.fields;
    },
    async check(label, fn) {
      try {
        await fn();
        r.checks.push({ label, ok: true });
      } catch (err) {
        const why = String(err?.message ?? err).replace(/\u001b\[[0-9;]*m/g, '').split('\n').filter((l) => l.trim()).slice(0, 6).join(' | ');
        r.checks.push({ label, ok: false, why });
      }
    },
    async shot(name = '') {
      if (!process.env.PF_SHOTS) return;
      const file = `${caseId}${name ? `-${name}` : ''}-${info.project.name}.png`;
      await page.screenshot({ path: join(process.env.PF_SHOTS, file), fullPage: false });
      (r.shots ??= []).push(file);
    },
    done(errors = []) {
      if (errors.length) r.checks.push({ label: 'no page errors', ok: false, why: errors.join(' | ') });
      const bad = r.checks.filter((c) => !c.ok);
      const unknown = bad.filter((c) => !KNOWN_GAPS.has(`${caseId}: ${c.label}`));
      const fixed = r.checks.filter((c) => c.ok && KNOWN_GAPS.has(`${caseId}: ${c.label}`));
      r.result = bad.length ? 'nicht bestanden' : 'bestanden';
      console.log(`[PF] ${JSON.stringify(r)}`);
      for (const c of fixed) console.log(`[PF] ${caseId}: "${c.label}" passes now: remove it from KNOWN_GAPS`);
      info.annotations.push({ type: 'pf', description: `${caseId} ${r.result}${bad.length ? `: ${bad.map((c) => c.label).join('; ')}` : ''}` });
      expect(unknown.map((c) => `${c.label}: ${c.why}`), `${caseId}: failing checks that are not known gaps`).toEqual([]);
    },
  };
}

/* ---------- the way a human goes ---------- */

/** New → Plan a trip → (start) ; returns the open "New trip" dialog. start: 'standard' | 'last' | template name. */
async function openNewTrip(page, rec, start = 'standard') {
  await rec.click(page.getByRole('button', { name: T('New'), exact: true }).filter({ visible: true }));
  await rec.click(page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: T('Plan a trip') }));
  // v0.30.0 (Noah, finding 2): the window starts with the standard set; last trip and templates are folded in it.
  const dlg = page.getByRole('dialog', { name: T('New trip') });
  await expect(dlg).toBeVisible();
  // v0.40.0 (Noah 10a): the last trip and the templates are folded under "Start differently", below the standard.
  if (start !== 'standard') await rec.click(dlg.getByText(T('Start differently')));
  if (start === 'last') await rec.click(dlg.getByRole('button', { name: T('Copy the last trip') }));
  else if (start !== 'standard') {
    // v0.29.2 (Noah 7a): the templates are folded under "Start from a template".
    await rec.click(dlg.getByText(T('Start from a template')));
    await rec.click(dlg.getByRole('button', { name: new RegExp(esc(start)) }));
  }
  return dlg;
}

/**
 * The New trip dialog filled in like a human: o = { title, bike, date, days, hours, overnight, cook,
 * weather (preset name), rain }. Only what differs from the dialog's defaults is touched.
 */
async function fillTrip(dlg, rec, o) {
  if (o.title) await rec.fill(dlg.getByLabel(T('Name')), o.title);
  if (o.date) await rec.fill(dlg.getByLabel(T('Start date')), o.date);
  if (o.bike) {
    // v0.30.0: the bike is a chip in a new trip, a select in Edit trip.
    const chip = dlg.getByRole('group', { name: T('Bike') }).getByRole('button', { name: FIX.tables.bikes.find((b) => b.id === o.bike).name, exact: true });
    if (await chip.count()) {
      if ((await chip.getAttribute('aria-pressed')) !== 'true') await rec.click(chip);
    } else {
      const sel = dlg.locator('label').filter({ has: dlg.page().locator('select'), hasText: new RegExp(`^${esc(T('Bike'))}`) }).locator('select');
      if ((await sel.inputValue()) !== o.bike) await rec.select(sel, o.bike);
    }
  }
  // v0.40.0: in a new trip the days field comes with "More".
  if (o.days && (await dlg.getByRole('button', { name: T('More'), exact: true }).count())) await rec.click(dlg.getByRole('button', { name: T('More'), exact: true }));
  if (o.days) await rec.fill(dlg.getByLabel(T('Days')).first(), String(o.days));
  if (o.hours) await rec.fill(dlg.getByLabel(T('Riding hours per day')), String(o.hours));
  if (o.overnight) {
    const name = { none: T('None|overnight'), lodging: T('Lodging'), outdoor: T('Outdoor (tent, bivvy)') }[o.overnight];
    await rec.click(dlg.getByRole('button', { name, exact: true }));
  }
  if (o.cook) await rec.click(dlg.getByRole('checkbox', { name: T('Cooking') }));
  if (o.weather) {
    const b = dlg.getByRole('button', { name: new RegExp(`^${esc(T(o.weather))} `) });
    if ((await b.getAttribute('aria-pressed')) !== 'true') await rec.click(b);
  }
  if (o.rain) await rec.click(dlg.getByRole('button', { name: `+ ${T('Rain')}` }));
}

/** Open every folded bag in the packing list (to look at all rows). */
async function openAllBags(page) {
  await page.locator('.calm-pack section.bag-group').first().waitFor();
  const heads = page.locator('.calm-pack .bag-heading[aria-expanded="false"]');
  for (let n = await heads.count(); n > 0; n--) await heads.first().click();
}
const planningRow = (page, key) => page.locator('.calm-pack .planning-row').filter({ hasText: nm(key) });
const rowButton = (page, key) => page.getByRole('button', { name: T('Amount, move or take out: {name}', { name: nm(key) }) });

/** A tab in the trip band (v0.29.0): 'Plan|stage', 'Pack|stage', 'On the way', 'Debrief'. */
const tab = (page, key) => page.getByRole('navigation', { name: T('Steps of this trip') }).getByRole('link', { name: new RegExp(`^${esc(T(key))}`) });
/** The one orange button of the page (in the band; at the bottom on a phone). */
const goBtn = (page) => page.locator('.trip-band .go');

/** Pack's "•••" menu entry. */
async function packMenu(page, rec, entry) {
  await rec.click(page.getByLabel(T('More: other trip, edit trip, templates, print')));
  await rec.click(page.locator('.list-menu-content').getByRole('button', { name: T(entry), exact: true }));
}

/** Night-only items on a stored trip (each one would have to be taken out by hand on a day ride). */
const nightOn = (trip) => (trip?.entries ?? []).map((e) => ITEM[key(e.itemId)]).filter((i) => i && nightOnly(i)).map((i) => key(i.id));
const dupes = (trip) => {
  const ids = (trip?.entries ?? []).map((e) => e.itemId);
  return ids.filter((x, n) => ids.indexOf(x) !== n);
};

/* ======================================================================================== */

test('PF01: MTB, 2 h, 1 day, no overnight stay, Scott Scale: a list to check without night items', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const rec = record('PF01', info, page);
  const title = `${P} PF01 ${info.project.name}`;
  const dlg = await openNewTrip(page, rec);
  await fillTrip(dlg, rec, { title, bike: BIKE.scale, hours: 2 });
  // v0.30.0 (Noah, finding 2): the night is asked only from 2 days on; one day has none without a tap.
  await rec.check('1 day: no night without a tap', () => expect(dlg.getByRole('button', { name: T('None|overnight'), exact: true })).toHaveCount(0, { timeout: 2000 }));
  await rec.check('the live box says night gear stays at home', () => expect(dlg.getByRole('region', { name: T('Your packing list|preview') })).toContainText(T('Not included: overnight gear, event preparation'), { timeout: 2000 }));
  await rec.click(dlg.getByRole('button', { name: T('Create trip') }));
  await openAllBags(page); // v0.29.0 (Noah 5a): the bags start folded
  await expect(page.locator('.calm-pack .list-head h2')).toHaveText(T('Packing list'));
  await expect(planningRow(page, 'FD01')).toBeVisible();
  rec.stop();
  await rec.shot();
  const trip = await tripNamed(page, title);
  rec.r.counts.nightItemsToRemove = nightOn(trip).length;
  rec.r.counts.duplicates = dupes(trip).length;
  await rec.check('no night item on the list (nothing to take out by hand)', () => expect(nightOn(trip)).toEqual([]));
  await rec.check('no item twice on the list', () => expect(dupes(trip)).toEqual([]));
  await rec.check('trip stored as 2 h, 1 day, no overnight stay, on the Scale', () => expect(trip).toMatchObject({ hours: 2, days: 1, overnight: 'none', bikeId: BIKE.scale }));
  // v0.47.1 (Noah b): a one-day ride shows its hours in the top card, no «1 day · no overnight stay» field.
  await rec.check('header: 2 h in the top card, no duration field', async () => {
    await expect(page.locator('.trip-band [data-fact="duration"]')).toHaveText(T('{n} h', { n: 2 }), { timeout: 2000 });
    await expect(page.locator('.cond')).not.toContainText(T('no overnight stay'));
  });
  await rec.check('gel by the hour: 1 piece for 2 h (no "× n")', () => expect(planningRow(page, 'FD01').locator('.item-qty')).toHaveCount(0, { timeout: 2000 }));
  await rec.check('nothing left to decide in "Review weather suggestions"', () => expect(page.locator('.detail-link .tp-badge')).toHaveCount(0, { timeout: 2000 }));
  await rec.check('within 60 s (machine time; human time see protocol)', () => expect(rec.r.seconds).toBeLessThanOrEqual(60));
  await rec.check('no sideways scroll', async () => expect(await wide(page)).toBe(0));
  rec.done(errors);
});

test('PF02: alpine, 6 h, 4 to 12 C, showers, Scott Spark: reasoned suggestions, alternative, no hidden clothing duplicate', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const rec = record('PF02', info, page);
  const title = `${P} PF02 ${info.project.name}`;
  const dlg = await openNewTrip(page, rec);
  await fillTrip(dlg, rec, { title, bike: BIKE.spark, hours: 6, weather: 'Chilly', rain: true });
  await rec.click(dlg.getByRole('button', { name: T('Create trip') }));
  await expect(page.locator('.calm-pack .list-head h2')).toHaveText(T('Packing list'));
  // 4–12 °C and showers is no preset: Edit trip conditions → Min °C 4, Rain: showers.
  await packMenu(page, rec, 'Edit trip conditions');
  const sheet = page.getByRole('dialog', { name: T('Edit trip conditions') });
  await rec.click(sheet.locator('details.wxbox > summary'));
  await rec.fill(sheet.getByLabel('Min °C'), '4');
  await sheet.getByLabel('Min °C').press('Tab');
  // v0.27.0 (pffix): the weather box stays open while typing (it folded shut before; then a human had to open it again).
  const wxBox = sheet.locator('details.wxbox');
  rec.r.counts.weatherBoxReopened = 0;
  if (!(await wxBox.evaluate((d) => d.open))) {
    await rec.click(wxBox.locator('summary'));
    rec.r.counts.weatherBoxReopened = 1;
  }
  await rec.check('the weather box stays open after Min °C (no extra tap for the rain)', () => expect(rec.r.counts.weatherBoxReopened).toBe(0));
  await rec.select(sheet.locator('.wxin select'), 'showers');
  await expect.poll(async () => (await tripNamed(page, title))?.wx).toEqual({ min: 4, max: 12, rain: 'showers' });
  await rec.click(sheet.getByRole('button', { name: T('Done') }));
  rec.stop();
  const trip = await tripNamed(page, title);
  const on = new Set(trip.entries.map((e) => e.itemId));
  rec.r.counts.duplicates = dupes(trip).length;
  await rec.check('weather layers are on the list: rain jacket, wind vest, winter gloves, long sleeve jersey', () => expect([...on]).toEqual(expect.arrayContaining(['KL05', 'KL07', 'KL09', 'KL03'].map(id))));
  await rec.check('no item twice on the list', () => expect(dupes(trip)).toEqual([]));
  const worn = trip.entries.filter((e) => e.slot === 'body').map((e) => e.itemId);
  await rec.check('not two jerseys worn at once (long sleeve replaces short only when worn)', () => expect(worn.includes(id('KL01')) && worn.includes(id('KL03'))).toBe(false));
  await openAllBags(page);
  await rec.check('the list says why an added layer is there (e.g. "Below 6 °C" at the winter gloves)', () => expect(planningRow(page, 'KL09')).toContainText(T('Below {n} °C', { n: 6 }), { timeout: 2000 }));
  await rec.check('two jerseys on the list: the long sleeve one says why ("Below 10 °C")', async () => {
    if (on.has(id('KL01')) && on.has(id('KL03'))) await expect(planningRow(page, 'KL03')).toContainText(T('Below {n} °C', { n: 10 }), { timeout: 2000 });
  });
  await planningRow(page, 'KL09').scrollIntoViewIfNeeded();
  await rec.shot('rows');
  // v0.27.0 (pffix): the alternative is in the wind vest row's menu (the review only shows what is still open).
  await rec.check('the alternative (light gilet for the wind vest) is visible', async () => {
    await rowButton(page, 'KL07').click();
    await expect(page.getByRole('button', { name: T('Swap for {name}', { name: nm('KL08') }) })).toBeVisible({ timeout: 2000 });
  });
  await rec.check('swap for the gilet keeps the reason; Undo brings the wind vest back', async () => {
    await page.getByRole('button', { name: T('Swap for {name}', { name: nm('KL08') }) }).click();
    await expect(planningRow(page, 'KL08')).toContainText(T('Below {n} °C', { n: 12 }), { timeout: 2000 });
    await expect(planningRow(page, 'KL07')).toHaveCount(0);
    await page.locator('.list-toolbar .undo').click();
    await expect(planningRow(page, 'KL07')).toBeVisible({ timeout: 2000 });
    await expect(planningRow(page, 'KL08')).toHaveCount(0);
  });
  // Review weather suggestions: what is still open, with its reason.
  await rec.click(page.getByRole('button', { name: new RegExp(esc(T('Review weather suggestions'))) }));
  const review = page.locator('section.review');
  await expect(review.getByRole('heading', { name: T('Still to decide') })).toBeVisible();
  await rec.shot();
  await rec.check('the optional rain trousers are offered with a reason ("Rain, optional")', () => expect(review.locator('.decision').filter({ hasText: nm('KL06') })).toContainText(T('Rain, optional'), { timeout: 2000 }));
  await rec.check('no sideways scroll', async () => expect(await wide(page)).toBe(0));
  rec.done(errors);
});

test('PF03: confirmed rule 1 gel per 3 h; duration 2 → 6 h: visible 1 → 2; a hand-set amount stays until confirmed', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const rec = record('PF03', info, page);
  const title = `${P} PF03 ${info.project.name}`;
  const dlg = await openNewTrip(page, rec);
  await fillTrip(dlg, rec, { title, bike: BIKE.scale, hours: 2 });
  await rec.click(dlg.getByRole('button', { name: T('Create trip') }));
  await openAllBags(page); // v0.29.0 (Noah 5a): the bags start folded
  await expect(planningRow(page, 'FD01')).toBeVisible();
  await expect(planningRow(page, 'FD01').locator('.item-qty')).toHaveCount(0);
  // Edit trip: 2 → 6 h.
  // v0.47.1 (Noah a): a one-day ride changes its hours on the duration chip of the top card.
  await rec.click(page.locator('.trip-band [data-fact="duration"]'));
  const edit = page.getByRole('dialog', { name: T('Change duration') });
  await rec.fill(edit.getByRole('textbox', { name: T('Riding hours'), exact: true }), '6');
  await edit.getByRole('textbox', { name: T('Riding hours'), exact: true }).press('Enter');
  await rec.click(edit.getByRole('button', { name: T('Done') }));
  await expect(edit).toBeHidden();
  await rec.check('gel shows × 2 after 2 → 6 h', () => expect(planningRow(page, 'FD01').locator('.item-qty')).toHaveText('× 2', { timeout: 3000 }));
  await rec.check('stored amount 2', async () => expect((await tripNamed(page, title)).entries.find((e) => e.itemId === id('FD01')).qty).toBe(2));
  await rec.check('the change 1 → 2 is said on the screen (not only the new number)', () => expect(page.locator('main')).toContainText(/1\s*→\s*2/, { timeout: 2000 }));
  await rec.check('Undo is offered for the change', () => expect(page.locator('.list-toolbar .undo')).toBeVisible({ timeout: 2000 }));
  // By hand: 3 gels; then 12 h (rule: 4). The 3 stays until confirmed, the 4 is offered.
  await rec.click(rowButton(page, 'FD01'));
  await rec.click(page.getByRole('button', { name: T('One more {name}', { name: nm('FD01') }) }));
  await expect(planningRow(page, 'FD01').locator('.item-qty')).toHaveText('× 3');
  await rec.click(page.locator('.trip-band [data-fact="duration"]'));
  await rec.fill(edit.getByRole('textbox', { name: T('Riding hours'), exact: true }), '12');
  await edit.getByRole('textbox', { name: T('Riding hours'), exact: true }).press('Enter');
  await rec.click(edit.getByRole('button', { name: T('Done') }));
  await expect(edit).toBeHidden();
  await rec.check('the hand-set 3 stays after 6 → 12 h', async () => expect.poll(async () => (await tripNamed(page, title)).entries.find((e) => e.itemId === id('FD01')).qty, { timeout: 3000 }).toBe(3));
  await rec.click(page.getByRole('button', { name: new RegExp(esc(T('Review weather suggestions'))) }));
  const review = page.locator('section.review');
  const gel = review.locator('.decision').filter({ hasText: nm('FD01') });
  await rec.shot();
  await rec.check('the rule\'s 4 is offered to confirm', () => expect(gel.getByLabel(T('Amount for {name}', { name: nm('FD01') }))).toHaveValue('4', { timeout: 2000 }));
  await rec.click(review.getByRole('button', { name: T('Apply selection') }));
  await rec.check('after confirming: 4', async () => expect.poll(async () => (await tripNamed(page, title)).entries.find((e) => e.itemId === id('FD01')).qty, { timeout: 3000 }).toBe(4));
  rec.done(errors);
});

test('PF04: bar rule vs a note that says otherwise; maximum smaller than the need: explained, nothing hidden', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const rec = record('PF04', info, page);
  const title = `${P} PF04 ${info.project.name}`;
  const dlg = await openNewTrip(page, rec);
  // 1 bar per hour, at most 3, note "never more than 2": 6 h needs 6.
  await fillTrip(dlg, rec, { title, bike: BIKE.scale, hours: 6 });
  await rec.click(dlg.getByRole('button', { name: T('Create trip') }));
  await openAllBags(page); // v0.29.0 (Noah 5a): the bags start folded
  const bar = planningRow(page, 'FD03');
  await expect(bar).toBeVisible();
  await rec.check('the amount is capped at the maximum: × 3', () => expect(bar.locator('.item-qty')).toHaveText('× 3', { timeout: 2000 }));
  await rec.check('the shortage is said at the row ("Buy … on the way?")', () => expect(bar).toContainText(T('Buy {name} on the way?', { name: nm('FD03') }), { timeout: 2000 }));
  // The weight ("165 g") also holds a 6: look at the row text without the weight.
  await rec.check('the full need (6 for 6 h) stays visible', async () => expect(((await bar.textContent()) ?? '').replace(/[\d’']+\s*g\b/g, '')).toMatch(/(^|\D)6(\D|$)/));
  await rec.click(rowButton(page, 'FD03'));
  await rec.check('the note is visible at the row', () => expect(bar).toContainText(ITEM.FD03.note, { timeout: 2000 }));
  await rec.shot();
  await rec.click(page.getByRole('button', { name: new RegExp(esc(T('Review weather suggestions'))) }));
  await rec.check('the conflict rule vs note is pointed out ("Check amount rule and material note")', () => expect(page.locator('section.review')).toContainText(T('Check amount rule and material note'), { timeout: 2000 }));
  const trip = await tripNamed(page, title);
  await rec.check('stored amount 3, no silent overwrite to the note\'s 2 or the rule\'s 6', () => expect(trip.entries.find((e) => e.itemId === id('FD03')).qty).toBe(3));
  rec.done(errors);
});

test('PF05: bikepacking, 3 days, outdoor, cooking: explicit sleep/cook choice, bag places, per day and total', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const rec = record('PF05', info, page);
  const title = `${P} PF05 ${info.project.name}`;
  const dlg = await openNewTrip(page, rec);
  await fillTrip(dlg, rec, { title, bike: BIKE.gravel, days: 3, hours: 5 });
  await rec.check('from 2 days on "Outdoor" is chosen and cooking is asked', async () => {
    await expect(dlg.getByRole('button', { name: T('Outdoor (tent, bivvy)') })).toHaveAttribute('aria-pressed', 'true', { timeout: 2000 });
    await expect(dlg.getByRole('checkbox', { name: T('Cooking') })).toBeVisible({ timeout: 2000 });
  });
  await rec.click(dlg.getByRole('button', { name: T('Outdoor (tent, bivvy)') }));
  await rec.click(dlg.getByRole('checkbox', { name: T('Cooking') }));
  const box = dlg.getByRole('region', { name: T('Your packing list|preview') });
  await rec.check('the live box names the night sets with counts (Base, Sleep, Warm, Cook)', () => expect(box).toContainText(new RegExp(`${esc(T('Sleep'))} 3.*${esc(T('Cook'))} 3`), { timeout: 2000 }));
  await rec.click(dlg.getByRole('button', { name: T('Create trip') }));
  await openAllBags(page); // v0.29.0 (Noah 5a): the bags start folded
  await expect(page.locator('.calm-pack .list-head h2')).toHaveText(T('Packing list'));
  await expect(page.locator('.cond')).toContainText(T('Outdoor'));
  rec.stop();
  await rec.shot();
  const trip = await tripNamed(page, title);
  const on = trip.entries.map((e) => e.itemId);
  rec.r.counts.duplicates = dupes(trip).length;
  await rec.check('tent, mat, sleeping bag, stove, pot, gas, toothbrush, towel on the list', () => expect(on).toEqual(expect.arrayContaining(['SL01', 'SL02', 'SL03', 'CO01', 'CO02', 'CO03', 'HY01', 'HY02'].map(id))));
  await rec.check('lodging-only items stay at home (shower gel, flip-flops)', () => expect(on.filter((x) => [id('HY04'), id('OF01')].includes(x))).toEqual([]));
  await rec.check('wishlist tent is not packed', () => expect(on).not.toContain(id('SL05')));
  const bad = trip.entries.filter((e) => ITEM[key(e.itemId)]?.sets?.some((s) => ['sleep', 'cook'].includes(s)) && (e.slot === 'body' || !trip.setup[e.slot]));
  await rec.check('every sleep and cook item sits in a bag of this bike (or a place suggestion is shown)', async () => {
    if (bad.length) await expect(page.getByRole('region', { name: T('Suggested places') })).toBeVisible({ timeout: 2000 });
  });
  await rec.check('header: 5 h per day · 3 days · Outdoor', () => expect(page.locator('.cond')).toContainText(new RegExp(`${esc(T('{n} days', { n: 3 }))} · ${esc(T('Outdoor'))}.*${esc(T('{n} h per day', { n: 5 }))}`), { timeout: 2000 }));
  await rec.check('gel for 15 h capped at 4 with "Buy on the way?"', async () => {
    await expect(planningRow(page, 'FD01').locator('.item-qty')).toHaveText('× 4', { timeout: 2000 });
    await expect(planningRow(page, 'FD01')).toContainText(T('Buy {name} on the way?', { name: nm('FD01') }), { timeout: 2000 });
  });
  await rec.check('amounts are explained per day and in total (e.g. "per day")', () => expect(planningRow(page, 'FD01')).toContainText(/pro Tag|per day/, { timeout: 2000 }));
  await rec.check('no litres claimed while a bag has no litres', () => expect(page.locator('.calm-pack').getByText(/\d+ (of|von) \d+ L/)).toHaveCount(0, { timeout: 2000 }));
  await rec.check('no item twice', () => expect(dupes(trip)).toEqual([]));
  await rec.check('no sideways scroll', async () => expect(await wide(page)).toBe(0));
  rec.done(errors);
});

test('PF06: the same tour with lodging: no tent/mat set by itself, an own choice stays possible', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const rec = record('PF06', info, page);
  const title = `${P} PF06 ${info.project.name}`;
  const dlg = await openNewTrip(page, rec);
  await fillTrip(dlg, rec, { title, bike: BIKE.gravel, days: 3, hours: 5, overnight: 'lodging' });
  await rec.check('no cooking question with lodging', () => expect(dlg.getByRole('checkbox', { name: T('Cooking') })).toHaveCount(0, { timeout: 2000 }));
  await rec.click(dlg.getByRole('button', { name: T('Create trip') }));
  await expect(page.locator('.cond')).toContainText(T('Lodging'));
  rec.stop();
  await rec.shot();
  let trip = await tripNamed(page, title);
  let on = trip.entries.map((e) => e.itemId);
  rec.r.counts.duplicates = dupes(trip).length;
  rec.r.counts.nightItemsToRemove = on.filter((x) => ['SL01', 'SL02', 'SL03', 'CO01', 'CO02', 'CO03', 'SL04', 'HY02'].map(id).includes(x)).length;
  await rec.check('no tent, mat, sleeping bag, stove, down jacket on the list', () => expect(on.filter((x) => ['SL01', 'SL02', 'SL03', 'CO01', 'CO02', 'CO03', 'SL04'].map(id).includes(x))).toEqual([]));
  await rec.check('lodging set on the list (toothbrush, shower gel, flip-flops)', () => expect(on).toEqual(expect.arrayContaining(['HY01', 'HY04', 'OF01'].map(id))));
  // Own choice: Add material → "+ Sleep" adds the sleep block anyway.
  await rec.click(page.getByRole('button', { name: T('Add material') }).filter({ visible: true }).first());
  const add = page.getByRole('dialog', { name: T('Add material') });
  const sleepName = T('Night: Sleep').replace(/^(Night|Nacht): /, '');
  const chip = add.getByRole('button', { name: T('Add {block}: {n} items', { block: sleepName, n: 3 }) });
  await rec.check('"+ Sleep (3)" is offered', () => expect(chip).toBeVisible({ timeout: 2000 }));
  if (await chip.count()) {
    await rec.click(chip);
    await expect.poll(async () => (await tripNamed(page, title)).entries.length).toBeGreaterThan(on.length);
    trip = await tripNamed(page, title);
    await rec.check('after "+ Sleep": tent, mat, sleeping bag on the list once', () => expect(trip.entries.map((e) => e.itemId).filter((x) => ['SL01', 'SL02', 'SL03'].map(id).includes(x)).sort()).toEqual(['SL01', 'SL02', 'SL03'].map(id)));
  }
  await rec.check('no sideways scroll', async () => expect(await wide(page)).toBe(0));
  rec.done(errors);
});

test('PF07: a new item with name, category and status, weight missing: saved quickly, found, weight open', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const rec = record('PF07', info, page);
  const name = `${P} Spork ${info.project.name}`;
  await rec.click(page.getByRole('button', { name: T('New'), exact: true }).filter({ visible: true }));
  await rec.click(page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: new RegExp(`^${esc(T('Gear item'))}`) }));
  const dlg = page.getByRole('dialog', { name: T('Add item') });
  await expect(dlg).toBeVisible();
  await rec.fill(dlg.getByLabel(new RegExp(`^${esc(T('Name'))}`)), name);
  await rec.select(dlg.getByLabel(new RegExp(`^${esc(T('Category'))}`)), 'cook');
  // v0.40.0: the status is a segment (Owned · Wishlist · Gone).
  await rec.check('status is asked, "Owned" already chosen', () => expect(dlg.getByRole('group', { name: new RegExp(`^${esc(T('Status'))}`) }).getByRole('button', { name: T('Owned') })).toHaveAttribute('aria-pressed', 'true', { timeout: 2000 }));
  await rec.click(dlg.getByRole('button', { name: T('Save') }));
  await expect(dlg).toBeHidden();
  rec.stop();
  await rec.check('saved within 30 s (machine time; human time see protocol)', () => expect(rec.r.seconds).toBeLessThanOrEqual(30));
  const item = (await table(page, 'items')).find((i) => i.name === name);
  await rec.check('stored with category, status and no weight (weight status "missing")', () => expect(item).toMatchObject({ category: 'cook', ownership: 'owned', weightG: null, weightStatus: 'missing' }));
  const search = page.getByRole('searchbox', { name: T('Search gear') });
  await search.fill('Spork');
  const row = page.getByRole('button', { name: new RegExp(esc(name)) });
  await rec.check('the gear search finds it', () => expect(row).toBeVisible({ timeout: 3000 }));
  await rec.check('its weight shows as open ("not weighed"), not as 0 g', async () => {
    await expect(page.locator('main').getByText(T('not weighed'), { exact: true }).first()).toBeVisible({ timeout: 2000 });
    await expect(row).not.toContainText(/\b0 g\b/);
  });
  // The search in the top bar finds it too (phone: behind the search icon).
  if (info.project.name === 'phone') await page.getByRole('button', { name: T('Search everything') }).click();
  await page.getByRole('searchbox', { name: T('What do you want to do? Search or say an action') }).fill('Spork');
  await rec.check('the search everywhere (top bar) finds it', () => expect(page.getByRole('link', { name: new RegExp(esc(name)) }).or(page.getByRole('button', { name: new RegExp(esc(name)) })).first()).toBeVisible({ timeout: 3000 }));
  await rec.shot();
  rec.done(errors);
});

test('PF08: star an item, open the favourites on Today, reload: one tap, kept, right filter, numbers explained', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const rec = record('PF08', info, page);
  await page.goto('./#/gear');
  await page.getByRole('searchbox', { name: T('Search gear') }).fill('Multitool');
  const star = page.getByRole('button', { name: T('Mark as favourite') }).first();
  await rec.click(star);
  await rec.check('one tap marks it (★, saved)', async () => {
    await expect(page.getByRole('button', { name: T('Remove from favourites') }).first()).toHaveAttribute('aria-pressed', 'true', { timeout: 2000 });
    await expect.poll(async () => (await table(page, 'items')).find((i) => i.id === id('WZ01')).favorite, { timeout: 3000 }).toBe(true);
  });
  const favs = (await table(page, 'items')).filter((i) => i.favorite && ['owned', 'unclear'].includes(i.ownership));
  await page.goto('./#/');
  // v0.46.0: the Gear tile with its favourites count left Today; "Favourites" is one of the 16
  // functions (the favourites page), and Gear's ★ filter is reached at #/gear?fav=1.
  await rec.click(page.locator('.actions .grid [data-fn="all"]'));
  await rec.click(page.locator('dialog.fnsheet [data-fn="favorites"]'));
  await rec.check('Today: All functions → Favourites opens the favourites', () => expect(page).toHaveURL(/#\/favorites/, { timeout: 2000 }));
  await page.goto('./#/gear?fav=1');
  const check = async (when) => {
    await rec.check(`${when}: the favourites filter is on`, () => expect(page.getByRole('button', { name: new RegExp(`★ ${esc(T('Favourites'))}`) })).toHaveAttribute('aria-pressed', 'true', { timeout: 3000 }));
    await rec.check(`${when}: the number is explained ("3 favourites in your inventory")`, () => expect(page.locator('.favbase')).toContainText(T('{n} favourites in your inventory', { n: favs.length }), { timeout: 3000 }));
    await rec.check(`${when}: exactly the favourites are listed`, async () => {
      for (const i of favs) await expect(page.locator('main').getByText(LANG === 'de' ? i.nameDe : i.name).first()).toBeVisible({ timeout: 3000 });
      await expect(page.locator('main').getByText(nm('WZ02'))).toHaveCount(0);
    });
  };
  await check('after the tap on Today');
  await page.reload();
  await check('after a reload');
  await rec.check('the star is still set after the reload', async () => expect((await table(page, 'items')).find((i) => i.id === id('WZ01')).favorite).toBe(true));
  await rec.shot();
  rec.done(errors);
});

test('PF09: category of an item linked to a trip, a template, a block and a learning; export and import: links, amounts, ticks kept', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const rec = record('PF09', info, page);
  const before = { trip: (await table(page, 'trips')).find((x) => x.id === id('event')), tpl: (await setting(page, 'templates'))[0], learning: (await table(page, 'learnings'))[0] };
  await page.goto('./#/gear');
  await page.getByRole('searchbox', { name: T('Search gear') }).fill(nm('KL05'));
  await rec.click(page.getByRole('button', { name: new RegExp(esc(nm('KL05'))) }).first());
  const dlg = page.getByRole('dialog', { name: new RegExp(esc(nm('KL05'))) });
  await rec.select(dlg.getByLabel(new RegExp(`^${esc(T('Category'))}`)), 'onbike');
  await rec.click(dlg.getByRole('button', { name: T('Save') }));
  await expect(dlg).toBeHidden();
  // Export (Today → Your data → Export backup) and import the file again (Replace all data).
  await page.goto('./#/');
  const data = page.locator('details.data');
  if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
  const wait = page.waitForEvent('download');
  await rec.click(data.getByRole('button', { name: T('Export backup') }));
  const file = info.outputPath('pf09-export.json');
  await (await wait).saveAs(file);
  const exported = JSON.parse(readFileSync(file, 'utf8'));
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await expect(data.getByText(T('Imported {name} (replaced all data).', { name: 'pf09-export.json' }))).toBeVisible();
  const items = await table(page, 'items');
  const jacket = items.filter((i) => i.id === id('KL05'));
  await rec.check('one item with the same ID, new category', () => expect(jacket.map((i) => [i.id, i.category])).toEqual([[id('KL05'), 'onbike']]));
  await rec.check('no item lost or doubled', () => expect(items).toHaveLength(FIX.tables.items.length));
  const trip = (await table(page, 'trips')).find((x) => x.id === id('event'));
  await rec.check('the trip keeps its entries with amounts and ticks', () => expect(trip.entries).toEqual(before.trip.entries));
  await rec.check('the template keeps the item', async () => expect((await setting(page, 'templates'))[0].entries).toEqual(before.tpl.entries));
  await rec.check('the learning keeps its link', async () => expect((await table(page, 'learnings'))[0].itemIds).toEqual(before.learning.itemIds));
  await rec.check('the item stays in the Rain block', () => expect(jacket[0]?.sets).toEqual(['u-test-data-gtp-regen']));
  await rec.check('the export file has every table of the app', () => expect(Object.keys(exported.tables).sort()).toEqual(Object.keys(FIX.tables).sort()));
  await page.goto('./#/pack');
  await rec.check('Pack shows the jacket on the event trip after the import', async () => {
    await page.getByLabel(T('More: other trip, edit trip, templates, print')).click();
    await page.locator('.list-menu-content select').selectOption(id('event'));
    await openAllBags(page);
    await expect(planningRow(page, 'KL05')).toBeVisible({ timeout: 3000 });
  });
  await rec.shot();
  rec.done(errors);
});

test('PF10: one item from two building blocks and the weather: no duplicate, no doubled amount, origin traceable', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const rec = record('PF10', info, page);
  const title = `${P} PF10 ${info.project.name}`;
  // The Buff is in "Warm" (outdoor night) and in the own block "Rain", and comes below 8 °C.
  const dlg = await openNewTrip(page, rec);
  await fillTrip(dlg, rec, { title, bike: BIKE.gravel, days: 2, hours: 4, weather: 'Cold' });
  await rec.click(dlg.getByRole('button', { name: T('Create trip') }));
  await expect(page.locator('.cond')).toContainText(T('Outdoor'));
  await rec.click(page.getByRole('button', { name: T('Add material') }).filter({ visible: true }).first());
  const add = page.getByRole('dialog', { name: T('Add material') });
  const blockName = T('Add {block}: {n} items', { block: `${P} Rain`, n: '#' }).split('#')[0];
  await rec.click(add.getByRole('button', { name: new RegExp(`^${esc(blockName)}`) }));
  await expect(add.getByRole('status').first()).toBeVisible();
  await rec.click(add.getByRole('button', { name: T('Done') }));
  const trip = await tripNamed(page, title);
  const buff = trip.entries.filter((e) => e.itemId === id('KL10'));
  rec.r.counts.duplicates = dupes(trip).length;
  await rec.check('the Buff is on the list once', () => expect(buff).toHaveLength(1));
  await rec.check('amount 1, not doubled', () => expect(buff[0]?.qty).toBe(1));
  await rec.check('the rain jacket (block, no rain forecast) is on the list once', () => expect(trip.entries.filter((e) => e.itemId === id('KL05'))).toHaveLength(1));
  await rec.check('the rain gloves come with the block amount 2', () => expect(trip.entries.find((e) => e.itemId === id('KL12'))?.qty).toBe(2));
  await rec.check('no item twice', () => expect(dupes(trip)).toEqual([]));
  await openAllBags(page);
  await rec.shot();
  await rec.check('Pack shows where the Buff comes from (Warm, Rain block, below 8 °C)', () => expect(planningRow(page, 'KL10')).toContainText(/Warm|Regen|Rain|8 °C/, { timeout: 2000 }));
  await page.goto('./#/gear');
  await page.getByRole('searchbox', { name: T('Search gear') }).fill(nm('KL10'));
  await page.getByRole('button', { name: new RegExp(esc(nm('KL10'))) }).first().click();
  const item = page.getByRole('dialog', { name: new RegExp(esc(nm('KL10'))) });
  await rec.check('the item dialog lists both blocks and the trip ("In: …")', async () => {
    await expect(item).toContainText(`${P} Rain`, { timeout: 2000 });
    await expect(item).toContainText(T('Trip "{name}"', { name: title }), { timeout: 2000 });
    await expect(item).toContainText(T('Night: Warm').replace(/^.*?: /, ''), { timeout: 2000 });
  });
  rec.done(errors);
});

test('PF11: move the gel and Undo; an own seat pack for this tour: the bike and other trips stay as they are', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const rec = record('PF11', info, page);
  const title = `${P} PF11 ${info.project.name}`;
  const dlg = await openNewTrip(page, rec);
  await fillTrip(dlg, rec, { title, bike: BIKE.scale, hours: 3 });
  await rec.click(dlg.getByRole('button', { name: T('Create trip') }));
  await openAllBags(page); // v0.29.0 (Noah 5a): the bags start folded
  await expect(planningRow(page, 'FD01')).toBeVisible();
  const before = await tripNamed(page, title);
  const bikesBefore = await table(page, 'bikes');
  const eventBefore = (await table(page, 'trips')).find((x) => x.id === id('event'));
  const tplBefore = await setting(page, 'templates');
  await rec.click(rowButton(page, 'FD01'));
  await rec.select(page.getByLabel(T('Move {name} to', { name: nm('FD01') })), 'top');
  await expect.poll(async () => (await tripNamed(page, title)).entries.find((e) => e.itemId === id('FD01')).slot).toBe('top');
  await rec.click(page.locator('.list-toolbar .undo'));
  await rec.check('Undo puts the gel back into the frame bag, same amount', async () => expect.poll(async () => (await tripNamed(page, title)).entries.find((e) => e.itemId === id('FD01')), { timeout: 3000 }).toEqual(before.entries.find((e) => e.itemId === id('FD01'))));
  await rec.check('Undo restores the whole list as it was', async () => expect((await tripNamed(page, title)).entries).toEqual(before.entries));
  // Bags for this trip: the 10 L tour seat pack instead of the 6 L.
  await packMenu(page, rec, 'Bags for this trip');
  const sheet = page.getByRole('dialog', { name: T('Bags for this trip') });
  await rec.select(sheet.locator('#ts-seat'), 'bag-gtp-seat10');
  await rec.click(sheet.getByRole('button', { name: T('Done') }));
  await rec.check('this trip has the 10 L seat pack', async () => expect.poll(async () => (await tripNamed(page, title)).setup.seat, { timeout: 3000 }).toBe('bag-gtp-seat10'));
  await rec.check('the Scale keeps its 6 L seat pack (bike standard setup unchanged)', async () => expect(await table(page, 'bikes')).toEqual(bikesBefore));
  await rec.check('the other trip and the template are unchanged', async () => {
    expect((await table(page, 'trips')).find((x) => x.id === id('event'))).toEqual(eventBefore);
    expect(await setting(page, 'templates')).toEqual(tplBefore);
  });
  await rec.check('the items of the seat pack stay with the trip (none lost)', async () => expect((await tripNamed(page, title)).entries.map((e) => e.itemId).sort()).toEqual(before.entries.map((e) => e.itemId).sort()));
  await openAllBags(page);
  await rec.shot();
  rec.done(errors);
});

test('PF12: tick some, navigate and reload; save as template and start a new trip from it: progress stays with its trip, the new one is open', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const rec = record('PF12', info, page);
  const title = `${P} PF12 ${info.project.name}`;
  const dlg = await openNewTrip(page, rec);
  await fillTrip(dlg, rec, { title, bike: BIKE.scale, hours: 2 });
  await rec.click(dlg.getByRole('button', { name: T('Create trip') }));
  await expect(tab(page, 'Pack|stage')).toBeVisible();
  await rec.click(tab(page, 'Pack|stage'));
  const pd = page.locator('.pd');
  await expect(pd).toHaveAttribute('aria-label', T('Packing day: {title}', { title }));
  for (const n of [0, 1]) {
    // the open bag lists the unpacked items first: always tick the first unticked one
    const row = pd.locator('ul.items button[aria-pressed="false"]').first();
    await rec.click(row);
    await expect(pd.locator('ul.items button[aria-pressed="true"]')).toHaveCount(n + 1);
    // v0.30.1 (B4): a second tap on the same spot within 400 ms is a double tap and counts once
    await page.waitForTimeout(450);
  }
  await rec.click(tab(page, 'Plan|stage'));
  const ticked = (await tripNamed(page, title)).entries.filter((e) => e.packed).map((e) => e.itemId).sort();
  await rec.check('2 items ticked and stored', () => expect(ticked).toHaveLength(2));
  await page.goto('./#/');
  await page.reload();
  await page.goto('./#/pack');
  await expect(page.locator('.trip-band h1')).toHaveText(title);
  await rec.check('after Today and a reload the same 2 are ticked', async () => expect((await tripNamed(page, title)).entries.filter((e) => e.packed).map((e) => e.itemId).sort()).toEqual(ticked));
  await rec.click(tab(page, 'Pack|stage'));
  const total = (await tripNamed(page, title)).entries.length;
  await rec.check('Pack says "2 of N packed"', () => expect(pd.getByRole('img', { name: T('{n} of {total} items packed', { n: 2, total }) }).filter({ visible: true }).first()).toBeVisible({ timeout: 3000 }));
  await rec.click(tab(page, 'Plan|stage'));
  // Save as template, then a new trip from it.
  const tplName = `${P} PF12 tpl ${info.project.name}`;
  await packMenu(page, rec, 'Save as template');
  const td = page.getByRole('dialog', { name: T('Template') });
  await rec.fill(td.getByLabel(T('Name')), tplName);
  await rec.click(td.getByRole('button', { name: T('Save template') }).or(td.getByRole('button', { name: T('Save as new template') })));
  await expect(td).toBeHidden();
  const tpl = (await setting(page, 'templates')).find((x) => x.name === tplName);
  await rec.check('the template keeps no ticks', () => expect(tpl.entries.every((e) => !('packed' in e))).toBe(true));
  const nd = await openNewTrip(page, rec, tplName);
  const title2 = `${P} PF12 copy ${info.project.name}`;
  await fillTrip(nd, rec, { title: title2 });
  await rec.click(nd.getByRole('button', { name: T('Create trip') }));
  await expect(page.locator('.trip-band h1')).toHaveText(title2);
  const copy = await tripNamed(page, title2);
  await rec.check('the new trip has nothing ticked (items and ready check)', () => {
    expect(copy.entries.filter((e) => e.packed)).toEqual([]);
    expect(copy.ready.filter((r) => r.done)).toEqual([]);
  });
  const firstIds = (await tripNamed(page, title)).entries.map((e) => e.itemId).sort();
  await rec.check('the new trip has the same items as the first one', () => expect(copy.entries.map((e) => e.itemId).sort()).toEqual(firstIds));
  await rec.check('the first trip still has its 2 ticks', async () => expect((await tripNamed(page, title)).entries.filter((e) => e.packed).map((e) => e.itemId).sort()).toEqual(ticked));
  rec.r.counts.lostTicks = ticked.length - (await tripNamed(page, title)).entries.filter((e) => e.packed).length;
  await rec.shot();
  rec.done(errors);
});

test('PF13: short ride tomorrow vs event; bike care due: Today, Pack and Bike care say the same', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const rec = record('PF13', info, page);
  const title = `${P} PF13 short ${info.project.name}`;
  const dlg = await openNewTrip(page, rec);
  await fillTrip(dlg, rec, { title, bike: BIKE.spark, date: day(1), hours: 2 });
  await rec.click(dlg.getByRole('button', { name: T('Create trip') }));
  await expect(page.locator('.trip-band h1')).toHaveText(title);
  const bikeName = FIX.tables.bikes.find((b) => b.id === BIKE.spark).name;
  const tag = T('{n} due', { n: 1 });
  const careLine = T('Bike care {state}', { state: tag }); // v0.29.0: a badge in the fold
  const beforeTrip = page.locator('.calm-extra > summary').filter({ hasText: T('Before the trip') });
  await rec.check('short ride: no event preparation in Pack', () => expect(beforeTrip).not.toContainText(T('Event preparation'), { timeout: 2000 }));
  // v0.45.1 (G013a): no bike care list on a short ride, but the due count as one quiet badge and line
  await rec.check('short ride: bike care due as one quiet line in Pack', () => expect(beforeTrip).toContainText(careLine, { timeout: 2000 }));
  const texts = {};
  // Pack, the event trip.
  await page.getByLabel(T('More: other trip, edit trip, templates, print')).click();
  await page.locator('.list-menu-content select').selectOption(id('event'));
  await expect(page.locator('.trip-band h1')).toHaveText(`${P} Jura event`);
  texts.packEvent = (await beforeTrip.textContent()).trim();
  await rec.check('event trip in Pack: bike care "1 due" and the event preparation', async () => {
    await expect(beforeTrip).toContainText(careLine, { timeout: 2000 });
    await expect(beforeTrip).toContainText(T('Event preparation'), { timeout: 2000 });
  });
  // Today.
  await page.goto('./#/');
  const bikesTile = await tile(page, 'bikes'); // v0.38.0: "Bikes ready?"
  const sparkLine = bikesTile.locator('li').filter({ hasText: bikeName }).first();
  texts.today = ((await sparkLine.textContent({ timeout: 3000 }).catch(() => '')) ?? '').trim();
  await rec.check('Today, Bikes: the Spark shows "1 due"', () => expect(sparkLine).toContainText(tag, { timeout: 2000 }));
  await rec.check('Today: the next trip (short ride) carries no event preparation', () => expect(page.locator('main')).not.toContainText(T('Event preparation: {n} open', { n: 2 }), { timeout: 2000 }));
  await rec.shot('today');
  // Bikes → Care.
  await page.goto(`./#/bikes?tab=care&bike=${BIKE.spark}&open=1`);
  const each = page.getByLabel(T('Each bike'));
  const sparkCare = each.locator('details, section, article, li').filter({ hasText: bikeName }).first();
  texts.care = ((await sparkCare.textContent({ timeout: 3000 }).catch(() => '')) ?? '').trim().slice(0, 300);
  await rec.check('Bike care: the Spark shows "1 due" (waxed chain)', () => expect(sparkCare).toContainText(tag, { timeout: 3000 }));
  rec.r.counts.contradictingStatus = [texts.packEvent, texts.today, texts.care].filter((x) => !x || !x.includes(tag)).length;
  rec.r.texts = texts;
  await rec.shot('care');
  rec.done(errors);
});

test('PF14: missing weights and litres; empty search, no bike, no weather: honest sums and usable empty states', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const rec = record('PF14', info, page);
  const title = `${P} PF14 ${info.project.name}`;
  const dlg = await openNewTrip(page, rec);
  await fillTrip(dlg, rec, { title, bike: BIKE.gravel, hours: 3 });
  // No weather: switch off the preset the forecast chose.
  const pressed = dlg.locator('.chips button[aria-pressed="true"]').filter({ hasText: '°' });
  if (await pressed.count()) await rec.click(pressed.first());
  await rec.click(dlg.getByRole('button', { name: T('Create trip') }));
  await expect(page.locator('.trip-band h1')).toHaveText(title);
  // The power bank (no weight) goes onto the trip through Add material.
  await page.getByRole('button', { name: T('Add material') }).filter({ visible: true }).first().click();
  const add = page.getByRole('dialog', { name: T('Add material') });
  await add.getByRole('searchbox', { name: T('Search your gear') }).fill(nm('EL02'));
  await add.locator('.np li .plus').first().click();
  await expect(add.getByRole('status').first()).toBeVisible();
  await add.getByRole('button', { name: T('Done') }).click();
  await rec.check('no weather: the header says "No weather set", no invented °C', async () => {
    await expect(page.locator('.cond')).toContainText(T('No weather set'), { timeout: 2000 });
    await expect(page.locator('.cond')).not.toContainText('°C');
  });
  await page.locator('.weight-details > summary').click();
  await rec.check('weights: "known: …" with "n not weighed" next to it', async () => {
    await expect(page.locator('.weight-grid .kn').first()).toHaveText(T('known: {w}', { w: '' }).trim(), { timeout: 2000 });
    await expect(page.locator('.weight-grid .miss').first()).toContainText(T('not weighed'), { timeout: 2000 });
  });
  await rec.check('the Weight fold says weights are missing and the sums are known values', () => expect(page.locator('.calm-pack .weight-details')).toContainText(/fehlen|missing/, { timeout: 2000 }));
  await openAllBags(page);
  await rec.check('the power bank row says "not weighed"', () => expect(planningRow(page, 'EL02')).toContainText(T('not weighed'), { timeout: 2000 }));
  await rec.check('no litres claimed (bags and items without litres)', () => expect(page.locator('.calm-pack').getByText(/\d+ (of|von) \d+ L/)).toHaveCount(0, { timeout: 2000 }));
  await rec.shot('pack');
  // Empty search in Gear.
  await page.goto('./#/gear');
  await page.getByRole('searchbox', { name: T('Search gear') }).fill(`${P} nothing like this`);
  await rec.check('empty gear search: "Nothing found." with a way to add it', async () => {
    await expect(page.getByText(T('Nothing found.'))).toBeVisible({ timeout: 2000 });
    await expect(page.getByRole('button', { name: T('Add "{q}" as a new item', { q: `${P} nothing like this` }) })).toBeVisible({ timeout: 2000 });
  });
  // A trip without a bike (area Weekend): the dialog works without a bike.
  await page.getByRole('button', { name: T('New'), exact: true }).filter({ visible: true }).click();
  await page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: T('Plan a trip') }).click();
  // v0.30.0: the area is chosen in the New trip window.
  const wd = page.getByRole('dialog', { name: T('New trip') });
  await expect(wd).toBeVisible();
  await wd.locator('.area-fold > summary').click(); // v0.40.0: the area is folded
  await wd.locator('.areas button').nth(2).click();
  await rec.check('no bike: the New trip dialog asks no bike and says what the list starts with', async () => {
    await expect(wd.locator(`select:has(option[value="${BIKE.scale}"])`)).toHaveCount(0, { timeout: 2000 });
    await expect(wd.locator('p.note').last()).not.toBeEmpty();
  });
  await wd.getByLabel(T('Name')).fill(`${P} PF14 weekend`);
  await wd.getByRole('button', { name: T('Create trip') }).click();
  await rec.check('no bike: the trip opens in Pack with a usable list or empty state', async () => {
    await expect(page.locator('.trip-band h1')).toHaveText(`${P} PF14 weekend`, { timeout: 3000 });
    await expect(page.getByRole('button', { name: T('Add material') }).filter({ visible: true }).first()).toBeVisible({ timeout: 2000 });
  });
  await rec.check('no sideways scroll', async () => expect(await wide(page)).toBe(0));
  rec.done(errors);
});

test('PF15: core screens at 320 and 390 px, keyboard, labels and status texts', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'phone only');
  const errors = await start(page, context, info);
  const rec = record('PF15', info, page);
  const PAGES = ['#/', '#/pack', '#/pack/templates', '#/gear', '#/blocks', '#/bikes', '#/bikes?tab=care', '#/inbox', '#/debrief', '#/pack/past'];
  const unnamed = () => page.evaluate(() => {
    const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
    const named = (el) => (el.getAttribute('aria-label') || '').trim() || (el.getAttribute('aria-labelledby') ? 'x' : '') || (el.textContent || '').trim() || el.getAttribute('title') || (el.id && document.querySelector(`label[for="${el.id}"]`) ? 'x' : '') || (el.closest('label') ? (el.closest('label').textContent || '').trim() : '') || el.getAttribute('placeholder') || '';
    return [...document.querySelectorAll('main button, main a[href], main input:not([type=hidden]), main select, main textarea, header button, header a[href], nav a[href]')].filter(vis).filter((el) => !named(el)).map((el) => el.outerHTML.slice(0, 90));
  });
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 740 });
    for (const hash of PAGES) {
      await page.goto(`./${hash}`);
      await expect(page.locator('main')).not.toBeEmpty();
      await page.waitForTimeout(150);
      await rec.check(`${width} px ${hash}: no sideways scroll`, async () => expect(await wide(page)).toBe(0));
      await rec.check(`${width} px ${hash}: every visible control has a name`, async () => expect(await unnamed()).toEqual([]));
    }
    // The New trip dialog and Add material on the small screen.
    await page.goto('./#/pack');
    const dlg = await openNewTrip(page, rec);
    await rec.check(`${width} px New trip dialog: no sideways scroll`, async () => expect(await wide(page)).toBe(0));
    await rec.check(`${width} px New trip dialog: Create trip reachable`, async () => {
      await dlg.getByRole('button', { name: T('Create trip') }).scrollIntoViewIfNeeded();
      await expect(dlg.getByRole('button', { name: T('Create trip') })).toBeInViewport({ timeout: 2000 });
    });
    if (width === 320) await rec.shot('320-newtrip');
    await dlg.getByRole('button', { name: T('Cancel') }).click();
    await page.getByRole('button', { name: T('Add material') }).filter({ visible: true }).first().click();
    await rec.check(`${width} px Add material: no sideways scroll`, async () => expect(await wide(page)).toBe(0));
    await page.getByRole('dialog', { name: T('Add material') }).getByRole('button', { name: T('Done') }).click();
    if (width === 320) await rec.shot('320-pack');
  }
  // Keyboard: Tab reaches "New", Enter opens it, Escape closes it; the focus is visible.
  await page.goto('./#/');
  let found = false;
  for (let n = 0; n < 80 && !found; n++) {
    await page.keyboard.press('Tab');
    found = await page.evaluate((name) => document.activeElement?.getAttribute('aria-label') === name || document.activeElement?.textContent?.trim() === name, T('New'));
  }
  await rec.check('keyboard: Tab reaches "New"', () => expect(found).toBe(true));
  await rec.check('keyboard: the focus is visible (outline)', async () => expect(await page.evaluate(() => { const s = getComputedStyle(document.activeElement); return (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || s.boxShadow !== 'none'; })).toBe(true));
  await page.keyboard.press('Enter');
  await rec.check('keyboard: Enter opens "New"', () => expect(page.getByRole('dialog', { name: T('New') })).toBeVisible({ timeout: 2000 }));
  await page.keyboard.press('Escape');
  await rec.check('keyboard: Escape closes it', () => expect(page.getByRole('dialog', { name: T('New') })).toBeHidden({ timeout: 2000 }));
  // Status texts are announced (role=status) after an action.
  await page.goto('./#/pack');
  await page.getByRole('button', { name: T('Add material') }).filter({ visible: true }).first().click();
  const add = page.getByRole('dialog', { name: T('Add material') });
  await add.locator('.gh').first().click();
  await add.locator('.np li .plus').first().click();
  await rec.check('a change is announced as status text ("Added to this trip.")', () => expect(add.getByRole('status')).toContainText(T('Added to this trip.'), { timeout: 2000 }));
  rec.r.open = ['screen reader (VoiceOver/TalkBack) sample: only a human on the real phone can do it'];
  rec.done(errors);
});

/** A tiny GPX: 3 points, 200 m climb, about 7 km. */
const GPX = `<?xml version="1.0"?><gpx version="1.1" creator="test_data_gtp_"><trk><name>test_data_gtp_ Loop</name><trkseg>
<trkpt lat="47.36" lon="7.35"><ele>450</ele></trkpt><trkpt lat="47.39" lon="7.38"><ele>650</ele></trkpt><trkpt lat="47.41" lon="7.42"><ele>500</ele></trkpt></trkseg></trk></gpx>`;
/** A 4×4 PNG (grey). */
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAADklEQVR4nGNoQAIMxHEAcFIYAYPG8BkAAAAASUVORK5CYII=', 'base64');

test('PF16: ride and debrief note, GPX and weather, print/PDF, photo, share link, backup round trip, offline', async ({ page, context }, info) => {
  await context.addInitScript(() => {
    window.__printed = 0;
    window.print = () => { window.__printed++; };
    try {
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (x) => { window.__shared = x; } }, configurable: true });
      Object.defineProperty(navigator, 'share', { value: async (d) => { window.__shared = d.url; }, configurable: true });
    } catch { /* keep the browser's own */ }
  });
  const errors = await start(page, context, info);
  const rec = record('PF16', info, page);
  const title = `${P} PF16 ${info.project.name}`;
  const dlg = await openNewTrip(page, rec);
  await fillTrip(dlg, rec, { title, bike: BIKE.gravel, date: day(0), hours: 2 });
  await rec.click(dlg.getByRole('button', { name: T('Create trip') }));
  await expect(page.locator('.trip-band h1')).toHaveText(title);
  const tripId = (await tripNamed(page, title)).id;
  // GPX and forecast in Edit trip conditions.
  await packMenu(page, rec, 'Edit trip conditions');
  const sheet = page.getByRole('dialog', { name: T('Edit trip conditions') });
  await sheet.locator('input[type=file][accept*="gpx"]').first().setInputFiles({ name: 'test_data_gtp_loop.gpx', mimeType: 'application/gpx+xml', buffer: Buffer.from(GPX) });
  await rec.check('GPX: the route is on this trip (km, climb) and gives the start place', async () => {
    await expect.poll(async () => (await tripNamed(page, title)).route?.km ?? 0, { timeout: 3000 }).toBeGreaterThan(0);
    expect((await tripNamed(page, title)).place).toBeTruthy();
  });
  const get = sheet.getByRole('button', { name: T('Get forecast') });
  if (await get.count()) await get.click();
  await rec.check('weather: the forecast (mocked Open-Meteo) is stored on this trip', async () => expect.poll(async () => (await tripNamed(page, title)).forecast?.days?.length ?? 0, { timeout: 3000 }).toBeGreaterThan(0));
  await sheet.getByRole('button', { name: T('Done') }).click();
  // Print / PDF.
  await page.getByLabel(T('More: other trip, edit trip, templates, print')).click();
  await page.locator('.list-menu-content').getByRole('button', { name: T('Print / PDF') }).click();
  await rec.check('print/PDF: the print dialog opens with this trip\'s list', async () => {
    expect(await page.evaluate(() => window.__printed)).toBe(1);
    await expect(page.locator('section.print h1')).toHaveText(title);
  });
  // Share link: opens a read-only list with the same title.
  await page.locator('.list-menu-content').getByRole('button', { name: T('Share link') }).click();
  let shared = null;
  await rec.check('share: a link is made', async () => {
    await expect.poll(() => page.evaluate(() => window.__shared ?? null), { timeout: 3000 }).toBeTruthy();
    shared = await page.evaluate(() => window.__shared);
  });
  if (shared) {
    const view = await context.newPage();
    await view.goto(shared);
    await rec.check('share: the link opens the list read-only with the trip title', () => expect(view.locator('main')).toContainText(title, { timeout: 3000 }));
    await view.close();
  }
  // Setup photo of the bike (Bikes → Photos → + Photo).
  await page.goto(`./#/bikes?bike=${BIKE.gravel}`);
  await rec.check('photo: a setup photo is stored on the right bike', async () => {
    const fold = page.locator('details.fold').filter({ has: page.locator('summary .lbl', { hasText: new RegExp(`^${esc(T('Photos'))}$`) }) }).first();
    if (!(await fold.evaluate((d) => d.open))) await fold.locator('summary').click();
    await page.locator('label.add input[type=file]').first().setInputFiles({ name: 'test_data_gtp_photo.png', mimeType: 'image/png', buffer: PNG });
    await expect.poll(async () => (await table(page, 'photos')).map((p) => p.bikeId), { timeout: 3000 }).toEqual([BIKE.gravel]);
  });
  // Ride day: a note; then the debrief shows it, and saving keeps it on this trip.
  await page.goto('./#/pack');
  await goBtn(page).click();
  await expect(page).toHaveURL(/#\/ride/);
  const note = page.getByRole('region', { name: T('Note for the debrief') });
  await note.getByRole('button', { name: T('Free text') }).click();
  await note.getByRole('textbox').fill(`${P} PF16 note`);
  await note.getByRole('button', { name: T('Save note') }).click();
  await rec.check('ride note: stored on this trip', async () => expect.poll(async () => (await table(page, 'notes')).find((n) => n.text === `${P} PF16 note`)?.tripId, { timeout: 3000 }).toBe(tripId));
  await goBtn(page).click();
  await expect(page).toHaveURL(/#\/debrief\//);
  await rec.check('debrief: the ride note is shown for this trip', () => expect(page.locator('.ridenotes')).toContainText(`${P} PF16 note`, { timeout: 3000 }));
  await page.getByRole('button', { name: T('Save debrief') }).click();
  await expect(page.getByRole('heading', { name: T('Saved'), exact: true })).toBeVisible();
  await rec.check('debrief: saved for this trip', async () => expect((await table(page, 'debriefs')).map((d) => d.tripId)).toContain(tripId));
  await rec.shot('debrief');
  // Backup round trip.
  const snapshot = {};
  for (const name of ['items', 'trips', 'debriefs', 'notes', 'photos', 'bikes', 'containers', 'learnings', 'settings']) snapshot[name] = await table(page, name);
  await page.goto('./#/');
  const data = page.locator('details.data');
  if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
  const wait = page.waitForEvent('download');
  await data.getByRole('button', { name: T('Export backup') }).click();
  const file = info.outputPath('pf16-export.json');
  await (await wait).saveAs(file);
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await expect(data.getByText(T('Imported {name} (replaced all data).', { name: 'pf16-export.json' }))).toBeVisible();
  // v0.30.0 (Noah 1a): Today keeps the tips it shows in the setting "tips" and adds to it as it
  // shows them (the export itself ends the backup reminder, so one more tip shows).
  const tipsOf = (rows) => rows.find((r) => r.key === 'tips')?.value ?? null;
  const exported = JSON.parse(readFileSync(file, 'utf8'));
  await rec.check('backup: every record comes back the same (items, trips, debriefs, notes, photos, bikes, bags, learnings, settings)', async () => {
    for (const name of Object.keys(snapshot)) {
      const now = await table(page, name);
      if (name !== 'settings') expect(now, name).toEqual(snapshot[name]);
      else expect(now.filter((r) => r.key !== 'tips'), name).toEqual(snapshot[name].filter((r) => r.key !== 'tips'));
    }
    // v0.45.1 (G015a): the tips memory is no longer in the file; the device keeps its own over "Replace all data"
    expect(tipsOf(exported.tables.settings)).toBeNull();
    const had = tipsOf(snapshot.settings);
    const back = tipsOf(await table(page, 'settings'));
    // v0.46.0: Today no longer writes the shown tips ("Good to know" is gone); when there is a record it must come back
    if (had == null) expect(back).toBeNull();
    else expect({ known: back.known, tapped: back.tapped }).toEqual({ known: had.known, tapped: had.tapped });
  });
  // Offline: the tests block the service worker (it would cache old builds), so offline use cannot be shown here.
  rec.r.open = ['offline use: not testable here (service worker blocked in the tests); Noah checks it on the phone in flight mode'];
  rec.done(errors);
});

/* ======================================================================================== */
/* The five everyday scenarios of AP23, as far as they run without Noah. Counted per run:    */
/* night items taken out by hand, duplicate suggestions, lost references/ticks, status texts */
/* that contradict each other.                                                               */

/** Today's words for a fully packed trip: "100 % packed" (v0.27.0: the same on phone and desktop, desktop adds "N of N"). */
const allPacked = () => new RegExp(esc(T('{n} % packed', { n: 100 })));

/** Today's tile (on a phone it starts folded). key: 'pack' | 'gear' | 'bikes'. */
async function tile(page, key) {
  // v0.46.0 «Startseite neu»: the trip card and the bike cards
  if (key === 'pack') return page.locator('section.trip');
  if (key === 'bikes') return page.locator('section.bikes');
  const fold = page.locator('details.hub').filter({ has: page.locator(`#${key}-h`) });
  if ((await fold.count()) && !(await fold.evaluate((d) => d.open))) await fold.locator('summary').click();
  return page.locator('.hub').filter({ has: page.locator(`#${key}-h`) });
}

/** Pack (v0.29.0, a page): bag by bag with "Whole bag packed" (the next bag opens by itself), then "Tick all checks". */
async function packingDay(page, rec, title) {
  const pd = page.locator('.pd');
  await expect(pd).toHaveAttribute('aria-label', T('Packing day: {title}', { title }));
  const whole = pd.locator('.pbag.cur').getByRole('button', { name: T('Whole bag packed') });
  for (let guard = 0; guard < 15 && (await whole.count()); guard++) {
    const bag = await pd.locator('.pbag.cur .bagh b').textContent();
    await rec.click(whole);
    await expect(pd.locator('.pbag.cur .bagh b')).not.toHaveText(bag);
  }
  const checks = pd.getByRole('button', { name: T('Tick all checks') });
  if (await checks.count()) await rec.click(checks);
  await expect(pd.getByText(T('Everything is in. Have a good ride!'))).toBeVisible();
}

test('Scenario 1: 2 h MTB after work: Day ride on Today, change to the Scale, pack, ride, debrief', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const rec = record('S1', info, page);
  await page.goto('./#/');
  // v0.38.0 (Noah 8a): "Day ride now" in the quick row under the bikes on Today.
  // v0.46.0: the first button of "What do you want to do?".
  await rec.click(page.locator('.actions .grid [data-fn="dayride"]'));
  const bar = page.locator('.made-card');
  await expect(bar).toBeVisible();
  // The day ride copies the last day ride (gravel, 3 h): change it to the Scale and 2 h.
  await rec.click(bar.getByRole('button', { name: T('Change') }));
  const edit = page.getByRole('dialog', { name: T('Trip details') });
  // L7: ridden today (after 14:00 the day ride is made for tomorrow, and before its day there is no debrief yet).
  await fillTrip(edit, rec, { bike: BIKE.scale, hours: 2, date: day(0) });
  await rec.click(edit.getByRole('button', { name: T('Save') }));
  await expect(edit).toBeHidden();
  const trip0 = (await table(page, 'trips')).find((x) => x.bikeId === BIKE.scale);
  rec.stop();
  rec.r.listSeconds = rec.r.seconds;
  rec.r.listClicks = rec.r.clicks;
  rec.r.counts.nightItemsToRemove = nightOn(trip0).length;
  rec.r.counts.duplicates = dupes(trip0).length;
  await rec.check('day ride on the Scale, 2 h, no night', () => expect(trip0).toMatchObject({ hours: 2, overnight: 'none', days: 1 }));
  await rec.check('no night item to take out', () => expect(nightOn(trip0)).toEqual([]));
  await rec.check('the Gravel items of the copied trip do not stay as Gravel bags', () => expect(Object.values(trip0.setup).filter(Boolean).every((b) => !['bag-gtp-seat14', 'bag-gtp-bar', 'bag-gtp-fork'].includes(b))).toBe(true));
  await rec.shot('list');
  await rec.click(goBtn(page));
  await expect(page).toHaveURL(/#\/ride/);
  const packed = (await table(page, 'trips')).find((x) => x.id === trip0.id);
  await rec.check('"All packed, let\'s go" ticks every item', () => expect(packed.entries.every((e) => e.packed)).toBe(true));
  // v0.45.2 (Noah): the base check waits on the ride page as a reminder; one tap ticks it all.
  await rec.click(page.getByRole('region', { name: T('Base check') }).getByRole('button', { name: T('All with me') }));
  await expect.poll(async () => (await table(page, 'trips')).find((x) => x.id === trip0.id).ready.every((r) => r.done || r.itemId)).toBe(true);
  await rec.check('ride day: no hint to a Pack place that does not exist ("Ride and weather")', () => expect(page.getByText(T('under "Ride and weather".'))).toHaveCount(0, { timeout: 2000 }));
  await rec.click(goBtn(page));
  await rec.click(page.getByRole('button', { name: T('Save debrief') }));
  await expect(page.getByRole('heading', { name: T('Saved'), exact: true })).toBeVisible();
  rec.stop();
  const done = (await table(page, 'trips')).find((x) => x.id === trip0.id);
  rec.r.counts.lostTicks = done.entries.filter((e) => !e.packed).length;
  await rec.check('after the debrief all ticks are still there', () => expect(rec.r.counts.lostTicks).toBe(0));
  await page.goto('./#/');
  await rec.check('Today no longer asks for this debrief', () => expect(page.getByRole('link', { name: T('Write debrief') }).filter({ hasText: trip0.title })).toHaveCount(0, { timeout: 2000 }));
  rec.r.counts.contradictingStatus = 0;
  rec.done(errors);
});

test('Scenario 2: 6 h alpine on the Spark: conditions, review the suggestions, pack', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const rec = record('S2', info, page);
  const title = `${P} S2 ${info.project.name}`;
  const dlg = await openNewTrip(page, rec);
  // Starts in three days: on the trip day itself Today switches to the ride day and has no packing tile.
  await fillTrip(dlg, rec, { title, bike: BIKE.spark, date: day(3), hours: 6, weather: 'Chilly', rain: true });
  await rec.click(dlg.getByRole('button', { name: T('Create trip') }));
  await expect(page.locator('.trip-band h1')).toHaveText(title);
  await rec.click(page.getByRole('button', { name: new RegExp(esc(T('Review weather suggestions'))) }));
  const review = page.locator('section.review');
  await expect(review.getByRole('heading', { name: T('Still to decide') })).toBeVisible();
  const decisions = await review.locator('.decision').count();
  rec.r.counts.openDecisions = decisions;
  const box = review.getByLabel(T('Include {name}', { name: nm('KL06') }));
  if (await box.count()) await rec.click(box);
  await rec.click(review.getByRole('button', { name: T('Apply selection') }).or(review.getByRole('button', { name: T('Continue to packing list') })));
  await expect(page.locator('.calm-pack .list-head h2')).toHaveText(T('Packing list'));
  const trip = await tripNamed(page, title);
  rec.r.counts.duplicates = dupes(trip).length;
  rec.r.counts.nightItemsToRemove = nightOn(trip).length;
  await rec.check('rain trousers on the list after choosing them', () => expect(trip.entries.map((e) => e.itemId)).toContain(id('KL06')));
  await rec.check('no item twice', () => expect(dupes(trip)).toEqual([]));
  await rec.check('no night item', () => expect(nightOn(trip)).toEqual([]));
  await rec.click(tab(page, 'Pack|stage'));
  await packingDay(page, rec, title);
  rec.stop();
  const packed = await tripNamed(page, title);
  rec.r.counts.lostTicks = packed.entries.filter((e) => !e.packed).length;
  await rec.check('everything packed after the packing day', () => expect(rec.r.counts.lostTicks).toBe(0));
  await rec.check('Pack now leads to On the way', () => expect(goBtn(page)).toContainText(T('Next: On the way'), { timeout: 2000 }));
  await page.goto('./#/');
  const pack = await tile(page, 'pack');
  await rec.check('Today says 100 % packed for this trip (same as Pack)', () => expect(pack).toContainText(allPacked(), { timeout: 2000 }));
  rec.r.counts.contradictingStatus = rec.r.checks.filter((c) => c.label.startsWith('Today says') && !c.ok).length;
  await rec.shot();
  rec.done(errors);
});

test('Scenario 3: 3 days bikepacking on the gravel bike: outdoor with cooking, pack bag by bag', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const rec = record('S3', info, page);
  const title = `${P} S3 ${info.project.name}`;
  const dlg = await openNewTrip(page, rec);
  await fillTrip(dlg, rec, { title, bike: BIKE.gravel, date: day(3), days: 3, hours: 5, cook: true });
  await rec.click(dlg.getByRole('button', { name: T('Create trip') }));
  await expect(page.locator('.trip-band h1')).toHaveText(title);
  const trip = await tripNamed(page, title);
  rec.r.counts.duplicates = dupes(trip).length;
  rec.r.counts.lodgingItemsToRemove = trip.entries.filter((e) => [id('HY04'), id('OF01')].includes(e.itemId)).length;
  await rec.check('sleep, cook and base sets on the list; no lodging-only items', () => {
    expect(trip.entries.map((e) => e.itemId)).toEqual(expect.arrayContaining(['SL01', 'SL02', 'SL03', 'CO01', 'CO02', 'CO03', 'HY02'].map(id)));
    expect(rec.r.counts.lodgingItemsToRemove).toBe(0);
  });
  await rec.check('no item twice', () => expect(dupes(trip)).toEqual([]));
  await rec.click(goBtn(page));
  await packingDay(page, rec, title);
  rec.stop();
  const packed = await tripNamed(page, title);
  rec.r.counts.lostTicks = packed.entries.filter((e) => !e.packed).length;
  await rec.check('everything packed after the packing day', () => expect(rec.r.counts.lostTicks).toBe(0));
  await page.reload();
  await rec.check('after a reload still everything packed', async () => expect((await tripNamed(page, title)).entries.every((e) => e.packed)).toBe(true));
  await page.goto('./#/');
  const pack = await tile(page, 'pack');
  await rec.check('Today says 100 % packed', () => expect(pack).toContainText(allPacked(), { timeout: 2000 }));
  rec.r.counts.contradictingStatus = rec.r.checks.filter((c) => c.label.startsWith('Today says') && !c.ok).length;
  await rec.shot();
  rec.done(errors);
});

test('Scenario 4: gear care: log km, the due chain on Today and in Bike care, a workshop visit, then done', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const rec = record('S4', info, page);
  const bikeName = FIX.tables.bikes.find((b) => b.id === BIKE.spark).name;
  const due = T('{n} due', { n: 1 });
  await page.goto('./#/');
  // v0.38.0 (Noah 8a): the km are a quick button of the bike on Today.
  // v0.46.0: "Log km" is one of the 16 functions (in "All 16 functions" when not among the buttons).
  const kmBtn = page.locator('.actions .grid [data-fn="km"]');
  if (await kmBtn.count()) await rec.click(kmBtn);
  else {
    await rec.click(page.locator('.actions .grid [data-fn="all"]'));
    await rec.click(page.locator('dialog.fnsheet [data-fn="km"]'));
  }
  const km = page.getByRole('dialog', { name: T('km for a bike') });
  await rec.select(km.locator('select').first(), BIKE.spark);
  await rec.fill(km.getByLabel(T('km on the counter')), '5100');
  await rec.click(km.getByRole('button', { name: T('Save km') }));
  await rec.check('km saved for the Spark', async () => expect.poll(async () => (await table(page, 'bikes')).find((b) => b.id === BIKE.spark).km, { timeout: 3000 }).toBe(5100));
  await expect(km).toBeHidden();
  const line = (await tile(page, 'bikes')).locator('li').filter({ hasText: bikeName }).first();
  // v0.38.0: the chain button says how far past the interval it is (5100 − 4850 = 250 km over).
  await rec.check('Today: the Spark shows the chain due, past its interval', async () => {
    await expect(line).toContainText(due, { timeout: 3000 });
  });
  // A workshop visit (Today → the line under the bike cards → Log a workshop visit).
  await rec.click((await tile(page, 'bikes')).getByRole('button', { name: T('Log a workshop visit') }));
  const visit = page.getByRole('dialog', { name: T('Log a workshop visit') });
  await rec.select(visit.locator('select').first(), BIKE.spark);
  await rec.fill(visit.getByLabel(T('Bike shop')), `${P} Velo shop`);
  await rec.fill(visit.getByLabel(T('km at the visit')), '5100');
  await rec.click(visit.getByRole('button', { name: T('Save') }));
  await rec.check('the visit is stored on the Spark', async () => expect.poll(async () => (await table(page, 'visits')).map((v) => v.bikeId), { timeout: 3000 }).toEqual([BIKE.spark]));
  // The chain was waxed: Bike care → Spark → Chain → "Waxed".
  await page.goto(`./#/bikes?tab=care&bike=${BIKE.spark}&open=1`);
  const each = page.getByLabel(T('Each bike'));
  const care = each.locator('details, section, article, li').filter({ hasText: bikeName }).first();
  await rec.check('Bike care: the Spark shows the same "1 due" as Today', () => expect(care).toContainText(due, { timeout: 3000 }));
  // v0.38.0 (Noah 5a): the bike shop and the year are one folded row "Bike shop & 2026".
  await care.locator('summary').filter({ hasText: /Velomech & \d{4}/ }).click();
  // The fold renders its rows after the click, so wait for them instead of reading the text once.
  await rec.check('Bike care: the workshop visit is listed for the Spark', () => expect(care).toContainText(`${P} Velo shop`, { timeout: 3000 }));
  // v0.38.0: a tap on the part opens its row, "Record …" the dialog.
  await rec.click(each.getByRole('button', { name: new RegExp(`^${esc(T('Chain'))}`) }).first());
  await rec.click(each.locator('li.pt.x').getByRole('button', { name: T('Record …') }));
  const part = page.getByRole('dialog').filter({ has: page.getByRole('button', { name: T('Waxed') }) });
  await rec.click(part.getByRole('button', { name: T('Waxed') }));
  await expect(part).toBeHidden();
  rec.stop();
  await rec.check('Bike care: the Spark is still listed', () => expect(care).toBeVisible({ timeout: 3000 }));
  await rec.check('Bike care: nothing due any more on the Spark', () => expect(care).not.toContainText(due, { timeout: 3000 }));
  await page.goto('./#/');
  const bikesTile = await tile(page, 'bikes');
  await expect(bikesTile).toBeVisible();
  const after = bikesTile.locator('li').filter({ hasText: bikeName }).filter({ hasText: due });
  await rec.check('Today: nothing due any more on the Spark (same as Bike care)', () => expect(after).toHaveCount(0, { timeout: 3000 }));
  rec.r.texts = { today: ((await bikesTile.textContent()) ?? '').replace(/\s+/g, ' ').trim().slice(0, 300) };
  // Pack, the event trip on the Spark: the same statement.
  await page.goto('./#/pack');
  await page.getByLabel(T('More: other trip, edit trip, templates, print')).click();
  await page.locator('.list-menu-content select').selectOption(id('event'));
  await expect(page.locator('.trip-band h1')).toHaveText(FIX.tables.trips.find((x) => x.id === id('event')).title);
  await rec.check('Pack (event trip on the Spark): no "1 due" any more', () => expect(page.getByText(T('Bike care · {bike}: {state}', { bike: bikeName, state: due }))).toHaveCount(0, { timeout: 3000 }));
  rec.r.counts.contradictingStatus = rec.r.checks.filter((c) => /same|any more/.test(c.label) && !c.ok).length;
  await rec.shot();
  rec.done(errors);
});

test('Scenario 5: adapt an existing list: from the template, change it, update the template', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const rec = record('S5', info, page);
  const tplName = `${P} Evening loop`;
  const title = `${P} S5 ${info.project.name}`;
  const dlg = await openNewTrip(page, rec, tplName);
  await rec.check('the template brings its bike (Scale), 2 h and no night', async () => {
    await expect(dlg.getByLabel(T('Riding hours per day'))).toHaveValue('2', { timeout: 2000 });
    // v0.30.0: one day asks no night (the question comes from 2 days on).
    await expect(dlg.getByRole('button', { name: T('None|overnight'), exact: true })).toHaveCount(0, { timeout: 2000 });
  });
  await fillTrip(dlg, rec, { title });
  await rec.click(dlg.getByRole('button', { name: T('Create trip') }));
  await expect(page.locator('.trip-band h1')).toHaveText(title);
  const made = await tripNamed(page, title);
  // The forecast (6 to 12 C) already brings the arm warmers. Change by hand: USB cable in, rain jacket out.
  await rec.click(page.getByRole('button', { name: T('Add material') }).filter({ visible: true }).first());
  const add = page.getByRole('dialog', { name: T('Add material') });
  await rec.fill(add.getByRole('searchbox', { name: T('Search your gear') }), nm('EL03'));
  await rec.click(add.locator('.np li .plus').first());
  await expect(add.getByRole('status').first()).toBeVisible();
  await rec.click(add.getByRole('button', { name: T('Done') }));
  await openAllBags(page);
  if (await planningRow(page, 'KL05').count()) {
    await rec.click(rowButton(page, 'KL05'));
    await rec.click(planningRow(page, 'KL05').getByRole('button', { name: T('Take out'), exact: true }));
  }
  const changed = await tripNamed(page, title);
  await packMenu(page, rec, 'Save as template');
  const td = page.getByRole('dialog', { name: T('Template') });
  await rec.check('the dialog offers to update the template it came from', () => expect(td.getByRole('button', { name: T('Update template «{name}»', { name: tplName }) })).toBeVisible({ timeout: 2000 }));
  await rec.click(td.getByRole('button', { name: T('Update template «{name}»', { name: tplName }) }));
  await expect(td).toBeHidden();
  rec.stop();
  const tpl = (await setting(page, 'templates')).find((x) => x.id === 'tpl-gtp-evening');
  const ids = tpl.entries.map((e) => e.itemId);
  await rec.check('the template now has the USB cable and no rain jacket', () => {
    expect(ids).toContain(id('EL03'));
    expect(ids).not.toContain(id('KL05'));
  });
  await rec.check('the template keeps the trip\'s items, places and amounts (none lost)', () => expect(tpl.entries).toEqual(changed.entries.map(({ itemId, slot, qty }) => ({ itemId, slot, qty: qty || 1 }))));
  rec.r.counts.lostReferences = FIX.tables.settings.find((s) => s.key === 'templates').value[0].entries.filter((e) => e.itemId !== id('KL05') && !ids.includes(e.itemId)).length;
  await rec.check('still one template (updated, not copied)', async () => expect((await setting(page, 'templates')).length).toBe(1));
  await rec.check('the trip made from it keeps its own list', async () => expect((await tripNamed(page, title)).entries).toEqual(changed.entries));
  rec.r.counts.duplicates = dupes(changed).length;
  rec.r.counts.madeFromTemplate = made.entries.length;
  await rec.shot();
  rec.done(errors);
});
