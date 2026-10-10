// Gesamttest (full browser test) round 1: shared helpers for tests/e2e/gesamttest/*.spec.js.
// The big fictional data set comes from tests/fixtures/gesamttest/make.mjs (built for the real day,
// so "running", "past" and "planned" stay true). Open-Meteo is mocked; nothing leaves the preview
// server. Service workers are blocked by playwright.config.js (serviceWorkers: 'block').
import { DATA_TABLES } from '../../../src/lib/db.js';
import { expect } from '@playwright/test';
import { writeFileSync, mkdirSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../../src/lib/i18n/de/index.js';
import { build, step1, step2, track, gpxText, P } from '../../fixtures/gesamttest/make.mjs';

export { P, build, step1, step2, track, gpxText, DE };

/** Today in Zurich (YYYY-MM-DD), n days from now. */
export const day = (n = 0) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`));

/** The text of an English key in a language (as the app's t() does). */
export const tr = (lang) => (en, vars) => {
  const text = (lang === 'de' ? DE[en] : null) ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
export const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The fixture for today, once per worker. */
let cache = null;
export function fixture() {
  if (!cache || cache.summary.today !== day()) cache = build(day());
  return cache;
}

/** Open-Meteo: 16 days from today, 6–13 °C, dry; one place for any search. */
export function meteo() {
  const time = Array.from({ length: 16 }, (_, n) => day(n));
  const hours = time.flatMap((d) => Array.from({ length: 24 }, (_, h) => `${d}T${String(h).padStart(2, '0')}:00`));
  return {
    daily: { time, temperature_2m_min: time.map(() => 6), temperature_2m_max: time.map(() => 13), precipitation_sum: time.map(() => 0.2), precipitation_probability_max: time.map(() => 20), weathercode: time.map(() => 2), weather_code: time.map(() => 2), wind_speed_10m_max: time.map(() => 12) },
    hourly: { time: hours, temperature_2m: hours.map((_, h) => 6 + (h % 24) / 3), precipitation: hours.map(() => 0), precipitation_probability: hours.map(() => 10), weathercode: hours.map(() => 2), weather_code: hours.map(() => 2), wind_speed_10m: hours.map(() => 10) },
  };
}

/** Mocks and listeners for one page: returns the list of console errors and page errors. */
export async function prepare(page, context, lang = 'de') {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await page.route(/api\.open-meteo\.com\/v1\/forecast/, (route) => route.fulfill({ json: meteo() }));
  await page.route(/geocoding-api\.open-meteo\.com/, (route) => route.fulfill({ json: { results: [{ name: `${P} Delemont`, admin1: 'Jura', country: 'Switzerland', latitude: 47.36, longitude: 7.35 }] } }));
  await context.addInitScript((l) => {
    try {
      if (!sessionStorage.getItem('gtp.lang')) (localStorage.setItem('lang', l), sessionStorage.setItem('gtp.lang', '1'));
    } catch {
      /* ignore */
    }
  }, lang);
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const text = m.text();
    // the blocked outside world (fonts, maps) is our own doing, not the app's
    if (/net::ERR_FAILED|ERR_BLOCKED|Failed to load resource/.test(text)) return;
    errors.push(`console: ${text}`);
  });
  return errors;
}

/** The "Your data" fold on Today, open. */
export async function openData(page) {
  const data = page.locator('details.data');
  // after an import the app may show the ride day: "Your data" is on Today
  if (!(await data.count())) {
    await page.goto('./#/');
    await data.waitFor();
  }
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  return data;
}

/** Writes a backup object to the test's output folder and imports it: Replace all data (or merge). */
export async function importBackup(page, info, obj, { lang = 'de', name = 'gesamttest.json', mode = 'replace' } = {}) {
  const T = tr(lang);
  const file = info.outputPath(name);
  writeFileSync(file, typeof obj === 'string' ? obj : JSON.stringify(obj));
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  const label = mode === 'replace' ? 'Replace all data' : 'Merge';
  await data.getByRole('button', { name: T(label) }).press('Enter');
  // The app may switch to the ride day right after the import (a trip runs today), so the message
  // can be gone at once: wait for the data itself.
  const want = typeof obj === 'string' ? JSON.parse(obj) : obj;
  const ids = (want.tables.items ?? []).map((i) => i.id);
  await expect
    .poll(async () => {
      const have = new Set((await table(page, 'items')).map((i) => i.id));
      return ids.every((id) => have.has(id)) && (mode !== 'replace' || have.size === ids.length);
    }, { timeout: 30_000 })
    .toBe(true);
  return data;
}

/** Fresh browser data with the big fixture (the real import, as a person does it). */
export async function start(page, context, info, { lang = 'de', data = null } = {}) {
  const errors = await prepare(page, context, lang);
  await page.goto('./');
  await importBackup(page, info, data ?? fixture().data, { lang });
  // the tidy-up after an import runs on: wait until the settings markers are there
  await expect.poll(async () => (await table(page, 'settings')).some((s) => s.key === 'update.templatesLinked2026'), { timeout: 20_000 }).toBe(true);
  // v0.51.0: Today's «Im Flow» card seeds the starter activities once after an import without flow data
  await expect.poll(async () => (await table(page, 'settings')).some((s) => s.key === 'flowSeeded'), { timeout: 20_000 }).toBe(true);
  // v0.76.0: the fictional data has a trip running today with a ride block 18–21 h. In the evening
  // Today opens Unterwegs by itself, once a day: let that happen here, so the tests find Today later.
  await page.goto('./#/');
  await page.locator('main').waitFor();
  await page.waitForTimeout(1500);
  return errors;
}

/** All records of a table, read straight from IndexedDB (reading only). */
export const table = (page, name) =>
  page.evaluate(
    (n) =>
      new Promise((ok, no) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = () => no(r.error);
        r.onsuccess = () => {
          const db = r.result;
          if (!db.objectStoreNames.contains(n)) return (db.close(), ok([]));
          const q = db.transaction(n).objectStore(n).getAll();
          q.onsuccess = () => (db.close(), ok(q.result));
        };
      }),
    name,
  );

// hobby pages 1: read from the app (db.js DATA_TABLES) instead of a copy, so a new table (v8: flowSessions,
// flowTemplates, flowStars) is in the snapshot as it is in the backup
export const TABLES = DATA_TABLES;
/** The whole database as { table: rows } (meta left out, as a backup does). */
export async function snapshot(page) {
  const out = {};
  for (const t of TABLES) out[t] = await table(page, t);
  return out;
}

/** A fresh page load of one view; returns the ms until the page is ready (main filled, fonts in, no spinner). */
export async function view(page, hash) {
  await page.goto(`./${hash}`);
  const t0 = Date.now();
  await page.reload();
  await page.locator('main').waitFor();
  await page.waitForFunction(() => {
    const m = document.querySelector('main');
    return !!m && m.innerText.trim().length > 20 && !m.querySelector('[aria-busy="true"]');
  }, null, { timeout: 30_000 });
  await page.evaluate(() => document.fonts.ready);
  const ms = Date.now() - t0;
  await page.waitForTimeout(150);
  return ms;
}

/** Page wider than the screen: { sw, w, wide: elements that stick out }. */
export const sideways = (page) =>
  page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    w: document.documentElement.clientWidth,
    wide: [...document.querySelectorAll('body *')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width && r.right > document.documentElement.clientWidth + 1 && getComputedStyle(el).position !== 'fixed';
      })
      .slice(0, 5)
      .map((el) => `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/).join('.')}` : ''} "${(el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 30)}"`),
  }));

/**
 * Text that is cut off: a visible element with its own text whose content is wider than its box
 * while it hides the rest (overflow hidden / clip / ellipsis), or a control that reaches past the
 * right edge of the screen. Returns short descriptions.
 */
export const cutOff = (page) =>
  page.evaluate(() => {
    const out = [];
    const W = document.documentElement.clientWidth;
    for (const el of document.querySelectorAll('main *, header *, nav *, dialog[open] *')) {
      if (!el.getClientRects().length) continue;
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!own) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || el.closest('[aria-hidden="true"], .sr, .sr-only, .visually-hidden')) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) continue;
      const hides = /hidden|clip/.test(cs.overflowX) || cs.textOverflow === 'ellipsis';
      // the full text is still there for a person (tooltip) or a screen reader: not counted
      const full = el.textContent.trim();
      const told = [el.closest('[title]')?.getAttribute('title'), el.closest('[aria-label]')?.getAttribute('aria-label')].some((s) => s && s.includes(full));
      // a folded row (summary, or a button that opens more) may end in "…": it opens to the full text
      const opens = !!el.closest('summary, [aria-expanded]');
      if (hides && el.scrollWidth > el.clientWidth + 2 && !told && !opens) out.push(`cut: ${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 40)}" (${el.scrollWidth} > ${el.clientWidth})`);
      else if (/^(BUTTON|A|LABEL|H1|H2|H3|SUMMARY)$/.test(el.tagName) && r.right > W + 1 && cs.position !== 'fixed') out.push(`off screen: ${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 40)}"`);
    }
    return [...new Set(out)].slice(0, 12);
  });

/**
 * Words broken in the middle ("Ket|te ge|ölt"): a word of 4+ letters whose letters sit on two lines,
 * in controls and headings (where a person reads a label). Returns short descriptions.
 */
export const brokenWords = (page) =>
  page.evaluate(() => {
    const out = [];
    const sel = 'button, a, label, summary, h1, h2, h3, [role="tab"], [role="button"]';
    const range = document.createRange();
    let checked = 0;
    for (const host of document.querySelectorAll(`main :is(${sel}), header :is(${sel}), nav :is(${sel}), dialog[open] :is(${sel})`)) {
      if (!host.getClientRects().length || checked > 4000) continue;
      const walk = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        const el = n.parentElement;
        // text for screen readers only (visually hidden) is not read on the screen
        if (!el || el.closest('.sr, .sr-only, .visually-hidden, [aria-hidden="true"]')) continue;
        // v0.45.1: a deliberate syllable break (hyphens: auto, the page has a lang) is no broken word:
        // used only where one long word cannot fit its column (the bag names on the bike drawing)
        if (getComputedStyle(el).hyphens === 'auto' && document.documentElement.lang) continue;
        const r = el.getBoundingClientRect();
        if (r.width <= 2 || r.height <= 2) continue;
        const text = n.textContent;
        for (const m of text.matchAll(/[\p{L}\p{N}’'-]{4,}/gu)) {
          if (++checked > 4000) break;
          range.setStart(n, m.index);
          range.setEnd(n, m.index + m[0].length);
          const tops = new Set([...range.getClientRects()].filter((r) => r.width > 0.5).map((r) => Math.round(r.top)));
          if (tops.size > 1 && !m[0].includes('-')) out.push(`"${m[0]}" in ${host.tagName.toLowerCase()} "${host.textContent.trim().replace(/\s+/g, ' ').slice(0, 40)}"`);
        }
      }
    }
    return [...new Set(out)].slice(0, 10);
  });

/** Controls without an accessible name (from the accessibility tree). */
export async function unnamed(locator) {
  const snap = await locator.ariaSnapshot();
  const re = /^\s*- (button|link|textbox|checkbox|combobox|radio|switch|slider|spinbutton|searchbox|menuitem|tab)(\s*\[[^\]]*\])*\s*(:.*)?$/;
  return snap.split('\n').filter((l) => re.test(l)).slice(0, 10);
}

/** English UI keys that have a German text, so in German mode they must never be on the screen as they are. */
const KEYS = new Map();
for (const [en, de] of Object.entries(DE)) {
  const plain = en.replace(/\|[a-z]+$/, '');
  if (plain === de || /\{\w+\}/.test(plain) || plain.length < 4 || !/[a-z]/.test(plain)) continue;
  if (Object.values(DE).includes(plain)) continue; // also a German word ("Tarp", "Buff", "Multitool")
  KEYS.set(plain, de);
}
// short English words a German screen should not show (beyond the keys); names and numbers aside
const WORDS = /\b(the|and|with|without|not weighed|items?|trips?|due|today|tomorrow|weeks?|days?|hours?|ago|left|edit|delete|save|cancel|close|back|next|more|less|show|hide|open|add|remove|done|undo|loading|search|settings|bike|bikes|gear|wishlist|owned|gone|packed|planned|past|running)\b/i;

/**
 * Untranslated English on a German page: { exact: texts that are an English key with a German text,
 * words: other text with common English words (a hint, checked by a person) }.
 */
export async function untranslated(page) {
  const texts = await page.evaluate(() => {
    const out = [];
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const el = n.parentElement;
      if (!el || el.closest('script, style, [hidden]') || !el.getClientRects().length) continue;
      const s = n.textContent.replace(/\s+/g, ' ').trim();
      if (s.length > 1) out.push(s);
    }
    for (const el of document.querySelectorAll('[aria-label], [title], input[placeholder], textarea[placeholder]')) {
      if (!el.getClientRects().length) continue;
      for (const a of ['aria-label', 'title', 'placeholder']) {
        const v = el.getAttribute(a);
        if (v && v.trim().length > 1) out.push(v.trim());
      }
    }
    return [...new Set(out)];
  });
  const exact = [];
  const words = [];
  for (const s of texts) {
    if (s.includes('test_data_gtp_')) continue;
    const bare = s.replace(/[:.…,;!?]+$/, '');
    if (KEYS.has(s) || KEYS.has(bare)) exact.push(s);
    else if (WORDS.test(s) && !/[äöüÄÖÜß]/.test(s) && !Object.values(DE).some((de) => de === s)) words.push(s);
  }
  return { exact: exact.slice(0, 15), words: words.slice(0, 15) };
}

/** Results of the run (ready times, hints), one JSON line per record, outside the repo's tracked files. */
const RESULTS = fileURLToPath(new URL('../../../test-results/gesamttest/', import.meta.url));
export function record(kind, obj) {
  try {
    mkdirSync(RESULTS, { recursive: true });
    appendFileSync(`${RESULTS}${kind}.jsonl`, `${JSON.stringify(obj)}\n`);
  } catch {
    /* results are a convenience */
  }
}

/* ---------- data integrity ---------- */

/**
 * Problems in the stored data: duplicate ids, entries pointing at missing items, debriefs of missing
 * trips, trips of missing bikes, bike setups with missing bags, rides of missing trips, set keys on
 * items that no set has, template entries pointing at missing items. Returns a list of texts.
 */
export function integrity(db) {
  const problems = [];
  const dup = (rows, key, name) => {
    const seen = new Set();
    for (const r of rows) {
      const k = r?.[key];
      if (seen.has(k)) problems.push(`${name}: duplicate ${key} ${k}`);
      seen.add(k);
    }
  };
  dup(db.items, 'id', 'items');
  dup(db.trips, 'id', 'trips');
  dup(db.debriefs, 'tripId', 'debriefs');
  dup(db.learnings, 'id', 'learnings');
  dup(db.notes, 'id', 'notes');
  dup(db.rides, 'id', 'rides');
  dup(db.bikes, 'id', 'bikes');
  dup(db.containers, 'id', 'containers');
  const items = new Set(db.items.map((i) => i.id));
  const trips = new Set(db.trips.map((t) => t.id));
  const bikes = new Set(db.bikes.map((b) => b.id));
  const bags = new Set(db.containers.map((c) => c.id));
  for (const t of db.trips) {
    const seen = new Set();
    for (const e of t.entries ?? []) {
      if (!items.has(e.itemId)) problems.push(`trip ${t.id}: entry ${e.itemId} has no item`);
      const k = `${e.itemId}|${e.slot}`;
      if (seen.has(k)) problems.push(`trip ${t.id}: ${e.itemId} twice in ${e.slot}`);
      seen.add(k);
    }
    if (t.bikeId && !bikes.has(t.bikeId)) problems.push(`trip ${t.id}: bike ${t.bikeId} missing`);
  }
  for (const d of db.debriefs) if (!trips.has(d.tripId)) problems.push(`debrief of missing trip ${d.tripId}`);
  for (const r of db.rides) if (r.tripId && !trips.has(r.tripId)) problems.push(`ride ${r.id}: trip ${r.tripId} missing`);
  for (const b of db.bikes) for (const [slot, c] of Object.entries(b.setup ?? {})) if (c && !bags.has(c)) problems.push(`bike ${b.id}: ${slot} bag ${c} missing`);
  for (const c of db.containers) if (c.itemId && !items.has(c.itemId)) problems.push(`bag ${c.id}: item ${c.itemId} missing`);
  const setRec = db.settings.find((s) => s.key === 'sets')?.value ?? [];
  // The built-in blocks (gear.js SETS, v0.66.0) plus the old keys, which stay on the items for two versions.
  const builtIn = ['standard', 'bivy', 'tent', 'hotel', 'cook', 'firstaid', 'repair', 'charge', 'lights', 'race', 'food', 'hygiene', 'comfort'];
  const known = new Set([...builtIn, 'base', 'warm', 'sleep', 'light', 'lodging', ...setRec.map((s) => s.key)]);
  for (const i of db.items) for (const k of i.sets ?? []) if (!known.has(k)) problems.push(`item ${i.id}: block ${k} unknown`);
  for (const tpl of db.settings.find((s) => s.key === 'templates')?.value ?? []) for (const e of tpl.entries ?? []) if (!items.has(e.itemId)) problems.push(`template ${tpl.id}: ${e.itemId} missing`);
  for (const n of db.notes) if (n.tripId && !trips.has(n.tripId)) problems.push(`note ${n.id}: trip ${n.tripId} missing`);
  return problems;
}

/** Ticks (packed entries) of every trip: { tripId: ['itemId|slot', …] }. */
export const ticks = (db) => Object.fromEntries(db.trips.map((t) => [t.id, (t.entries ?? []).filter((e) => e.packed).map((e) => `${e.itemId}|${e.slot}`).sort()]));

/** A backup's tables without the fields that change on every save (for "before equals after"). */
export function comparable(tables) {
  const out = {};
  for (const [name, rows] of Object.entries(tables)) {
    const key = name === 'debriefs' ? 'tripId' : name === 'settings' ? 'key' : 'id';
    out[name] = [...rows].map((r) => JSON.parse(JSON.stringify(r))).sort((a, b) => String(a[key]).localeCompare(String(b[key])));
  }
  return out;
}

/** Screenshots for the findings (fictional data only): PNG, small, under GTP_SHOTS. */
export async function shot(page, name, opts = {}) {
  const dir = process.env.GTP_SHOTS;
  if (!dir) return null;
  mkdirSync(dir, { recursive: true });
  const path = `${dir}/${name}.png`;
  await page.screenshot({ path, ...opts });
  return path;
}

export const gearFile = (info, name, obj) => {
  const file = info.outputPath(name);
  writeFileSync(file, JSON.stringify(obj));
  return file;
};
