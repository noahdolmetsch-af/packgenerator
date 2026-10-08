// v0.33.0 (finding 5, stage 2 preparation): golden comparison for the one-time update blocks2026.
//
// For the e2e fixtures (tests/e2e/fixture.json, tests/e2e/pf-fixture.json) and one small fictional
// edge set, the packing list of a new trip is computed with today's functions (dayride.js
// buildBikeTrip = trips.js newTrip/standardEntries/alwaysEntries + templates.js tripFromTemplate +
// context.js contextTrip/applyContext + layers.js), once on the data as it is and once after
// migrateAll. They must be equal. The lists of v0.32.0 are kept as a FROZEN snapshot
// (tests/golden/blocks2026.lists.json, no longer written): stage 2 switched the call sites to the helpers
// (inStandard, isWorn, leaveHome) and this test proves the lists stay the same, 11a apart (see below).
//
// Item-level answers that depend on item.sets (not on role/always) are compared too: there the
// new 'standard' key DOES change answers today; those differences are kept as a snapshot
// ("sideEffects") so stage 2 knows exactly which sites must ignore 'standard' (see stellen.md).
//
// Call sites that read item.role or item.always (main 2fdd2f9, grep `\brole\b|\balways\b` in src,
// writes of defaults left out). 40 reads in 18 files; also in /mnt/project-files/design/v033/stellen.md.
//   src/lib/learn.js:16               alwaysKeep: always (tools never "ballast")
//   src/lib/sets.js:125               tripSlot: role worn → body
//   src/lib/updates.js:144            layers2026: role worn (KL12), also writes role
//   src/lib/updates.js:197            readyClean2026: always == null, writes always
//   src/lib/updates.js:200            readyClean2026: always
//   src/lib/updates.js:382            toolsAlways2026: always != null, writes always
//   src/lib/context.js:82             contextEntries: role worn → body
//   src/lib/context.js:149            startEntries: worn / standard / always stay on a copy
//   src/lib/gear/ReviewMode.svelte:43 replacement item copies old.role
//   src/lib/gear/assign.js:41         templateSlot: role worn → body
//   src/lib/gear/assign.js:72         ontoTrip: role worn → body
//   src/lib/gear/ItemDialog.svelte:115  shows the role
//   src/lib/gear/ItemDialog.svelte:116  shows "On every trip"
//   src/lib/gear/ItemDialog.svelte:175  edits draft.role
//   src/lib/gear/ItemDialog.svelte:180  edits draft.always
//   src/lib/gear/ItemDialog.svelte:219  "worn instead of": worn / standard items
//   src/lib/bagsuggest.js:33          poorPlace: body without role worn
//   src/lib/trips.js:41               alwaysEntries: always
//   src/lib/trips.js:66               standardEntries: worn / standard
//   src/lib/trips.js:67               standardEntries: worn → body
//   src/lib/trips.js:336              toggleSet off: worn / standard stay
//   src/lib/gear.js:167               matches filter 'none': role
//   src/lib/gear.js:169               matches filter by role
//   src/lib/gear.js:195               weighPriority: worn / standard
//   src/lib/gear.js:197               weighPriority: optional
//   src/lib/gear.js:236               itemDraft: role
//   src/lib/gear.js:257               itemRecord: role from the draft
//   src/lib/gear.js:258               itemRecord: always from the draft
//   src/lib/know.js:253               longUnused: never worn / standard / always
//   src/lib/layers.js:72              layerSuggest: amounts for worn / standard
//   src/lib/layers.js:128             layerOf: worn / standard = "Every ride"
//   src/lib/favorites.js:81           favourites template: worn → body
//   src/lib/domains.js:109            packSlot: worn → body
//   src/lib/domains.js:116            domainEntries: worn / standard / always
//   src/lib/debrief.js:194            suggestions: not worn
//   src/lib/debrief.js:199            suggestions: standard → "leave at home"
//   src/pages/TemplateEdit.svelte:132 tag: always / standard / worn
//   src/pages/Gear.svelte:324         "Stays at home": optional
//   src/pages/Pack.svelte:320         sort rank: standard / worn / optional
//   src/pages/Pack.svelte:579         tag: always / standard / worn
// Writes (no reads): debrief.js:255 and Gear.svelte:35 (role 'optional'); role: null defaults in
// updates.js:36,133,166, care.js:274, notes.js:91, favorites.js:57, debrief.js:249.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { migrateAll, inStandard, isWorn, leaveHome } from '../src/lib/blocks2026.js';
import { buildBikeTrip } from '../src/lib/dayride.js';
import { WX_PRESETS, toggleSet, standardEntries, alwaysEntries } from '../src/lib/trips.js';
import { templateFrom, templateDefaults } from '../src/lib/templates.js';
import { startEntries, contextSummary, NIGHT_ONLY } from '../src/lib/context.js';
import { layerSuggest, layerOf } from '../src/lib/layers.js';
import { DOMAINS, BIKEPACKING, newPackTrip, domainEntries, packsFor, packSlot } from '../src/lib/domains.js';
import { matches, weighPriority, isInventory } from '../src/lib/gear.js';
import { alwaysKeep } from '../src/lib/learn.js';
import { tripSlot } from '../src/lib/sets.js';
import { templateSlot } from '../src/lib/gear/assign.js';
import { poorPlace } from '../src/lib/bagsuggest.js';
import { lang } from '../src/lib/i18n.svelte.js';

lang.v = 'en';
const NOW = Date.UTC(2026, 9, 8, 8, 0, 0);
const load = (name) => JSON.parse(readFileSync(new URL(`./e2e/${name}`, import.meta.url), 'utf8')).tables;
const wx = (name, rain = 'none') => {
  const p = WX_PRESETS.find((x) => x.name === name);
  return { min: p.min, max: p.max, rain };
};

/* A small fictional edge set: what the fixtures do not have (worn + always, standard with sets,
 * always + first aid, an always-only item, a body layer, another area, a rain block, amounts). */
const edgeItem = (id, f = {}) => ({ id: `test_data_gtp_E${id}`, name: `test_data_gtp_ ${id}`, ownership: 'owned', role: null, sets: [], defaultBag: 'seat', domains: ['bikepacking'], ...f });
const EDGE = {
  items: [
    edgeItem('JERSEY', { role: 'worn', defaultBag: 'body' }),
    edgeItem('HELMET', { role: 'worn', always: true, defaultBag: 'body' }),
    edgeItem('WORNNOBAG', { role: 'worn', defaultBag: null }),
    edgeItem('WORNTOP', { role: 'worn', defaultBag: 'top' }),
    edgeItem('TUBE', { always: true, category: 'tools', defaultBag: 'frame' }),
    edgeItem('PHONE', { always: true, defaultBag: 'top' }),
    edgeItem('AID', { always: true, sets: ['firstaid'] }),
    edgeItem('GEL', { role: 'standard', defaultBag: 'top', perHours: 1, maxQty: 6 }),
    edgeItem('BOTTLE', { role: 'standard', defaultBag: 'frame', perHours: 3, maxQty: 2 }),
    edgeItem('BRUSH', { role: 'standard', sets: ['base'], defaultBag: 'top' }),
    edgeItem('TOWEL', { sets: ['base'] }),
    edgeItem('SLEEPBAG', { sets: ['sleep'] }),
    edgeItem('STOVE', { sets: ['cook'] }),
    edgeItem('SHOWER', { sets: ['lodging'] }),
    edgeItem('WARMJ', { role: 'standard', sets: ['warm'], defaultBag: 'top' }),
    edgeItem('COLDJ', { defaultBag: 'body', coldBelow: 8, replaces: 'test_data_gtp_EJERSEY' }),
    edgeItem('GILET', { coldBelow: 14, defaultBag: 'top' }),
    edgeItem('RAINJ', { sets: ['u-test-data-gtp-regen'], defaultBag: 'top' }),
    edgeItem('RAINALW', { always: true, rain: 'yes' }),
    edgeItem('SPARE', { role: 'optional' }),
    edgeItem('WISH', { role: 'standard', ownership: 'wishlist' }),
    edgeItem('SKIWORN', { role: 'worn', defaultBag: 'body', domains: ['ski'] }),
    edgeItem('SKISTD', { role: 'standard', domains: ['ski', 'bikepacking'] }),
    edgeItem('SKIALW', { always: true, domains: ['ski'] }),
    edgeItem('WEEKEND', { role: 'standard', domains: ['weekend'] }),
    edgeItem('DAILY', { ride: 'daily', defaultBag: 'top' }),
  ],
  bikes: [{ id: 'test_data_gtp_ebike', name: 'test_data_gtp_ Edge bike', slots: ['seat', 'frame', 'top'], setup: { seat: 'bag-s', frame: 'bag-f', top: 'bag-t' } }],
  trips: [],
  settings: [{ key: 'sets', value: [{ key: 'u-test-data-gtp-regen', name: 'test_data_gtp_ Rain' }] }],
};

const DATASETS = {
  fixture: load('fixture.json'),
  pf: load('pf-fixture.json'),
  edge: EDGE,
};

/** Entries as short sorted strings, so a difference reads in one line. */
const norm = (entries) => (entries ?? []).map((e) => `${e.itemId}@${e.slot}x${e.qty ?? 1}${e.src ? `:${e.src}` : ''}`).sort();
const setting = (tables, key) => (tables.settings ?? []).find((s) => s.key === key)?.value;

/**
 * Stored data (trips, a template) comes from the data BEFORE the update and is used as it is in
 * both runs: the update never touches trips, and templates keep their entries.
 */
function stored(tables) {
  const items = tables.items;
  const bike = tables.bikes.find((b) => (tables.trips ?? []).some((t) => t.bikeId === b.id)) ?? tables.bikes[0];
  let trips = (tables.trips ?? []).filter((t) => t.bikeId === bike.id);
  if (!trips.length) {
    const prior = buildBikeTrip({ draft: { title: 'test_data_gtp_ Prior', startDate: '2026-09-01', days: 2 }, bike, start: 'standard', items, fields: { hours: 5, overnight: 'outdoor', cook: true, wx: wx('Chilly'), event: false } }, NOW - 1e9);
    trips = [prior];
  }
  let templates = setting(tables, 'templates') ?? [];
  if (!templates.length) templates = [templateFrom(trips[0], { id: 'tpl-gtp-made', name: 'test_data_gtp_ Made', now: '2026-10-01T00:00:00.000Z' })];
  return { bike, trips, templates };
}

/** Every new-trip list of one data state. items/templates: before or after the update. */
function lists({ items, templates, bike, trips }) {
  const draft = (days) => ({ title: 'test_data_gtp_ New', startDate: '2026-10-20', days });
  const make = (start, days, fields = {}, tr = trips) => buildBikeTrip({ draft: draft(days), bike, start, templates, trips: tr, items, fields }, NOW);
  const day = { hours: 2, overnight: 'none', cook: false, wx: wx('Chilly'), event: false };
  const outdoor = { hours: 5, overnight: 'outdoor', cook: true, wx: wx('Cold', 'rain'), event: false };
  const lodging = { hours: 4, overnight: 'lodging', cook: false, wx: wx('Mild', 'showers'), event: true };
  const tpl = templates[0];
  const td = templateDefaults(tpl, [bike]);
  const tplFields = { hours: td.hours ?? null, overnight: td.overnight ?? 'none', cook: !!td.cook, wx: wx('Warm'), event: false };
  const out = {
    standard: make('standard', 1),
    standard2days: make('standard', 2),
    dayRide: make('standard', 1, day),
    outdoor: make('standard', 2, outdoor),
    lodging: make('standard', 2, lodging),
    template: make(tpl.id, td.days ?? 1, tplFields),
    templateOutdoor: make(tpl.id, 2, outdoor),
    copyDayRide: make('last', 1, day),
    copyOutdoor: make('last', 2, outdoor),
    copyNoContext: make('last', 1),
  };
  const res = Object.fromEntries(Object.entries(out).map(([k, t]) => [k, norm(t.entries)]));
  // the sets switches a context sets (they decide toggleSet later)
  res.outdoorSwitches = Object.entries(out.outdoor.sets ?? {}).filter(([, v]) => v).map(([k]) => k).sort();
  // "Sleep" off again on the outdoor trip (trips.js toggleSet: worn / standard stay)
  res.outdoorSleepOff = norm(toggleSet(out.outdoor, items, 'sleep', false).entries);
  res.outdoorWarmOff = norm(toggleSet(out.outdoor, items, 'warm', false).entries);
  // the layer rows the context reads (id, place, qty)
  res.layersOutdoor = layerSuggest(out.outdoor, items).map((r) => `${r.id}:${r.place}x${r.qty}${r.optional ? '?' : ''}${r.replaces ? `>${r.replaces}` : ''}`);
  res.layersDay = layerSuggest(out.dayRide, items).map((r) => `${r.id}:${r.place}x${r.qty}${r.optional ? '?' : ''}${r.replaces ? `>${r.replaces}` : ''}`);
  // a copy of the outdoor trip as start of a day ride (context.js startEntries)
  res.startEntriesDay = norm(startEntries({ ...out.outdoor, ...day }, items));
  const sum = contextSummary(out.standard.entries, { ...out.standard, ...outdoor, days: 2 }, items);
  res.summaryOutdoor = { start: sum.start, total: sum.total, sets: sum.sets.map((s) => `${s.key}:${s.n}`) };
  res.standardEntriesRaw = norm(standardEntries(items, bike.setup, { overnight: true }));
  res.alwaysEntriesRaw = norm(alwaysEntries(items, [], bike.setup));
  // areas without a bike (domains.js)
  for (const d of DOMAINS.filter((x) => x.key !== BIKEPACKING)) {
    res[`area_${d.key}`] = norm(newPackTrip({ ...draft(1), domain: d.key }, [], items, NOW).entries);
    res[`areaEntries_${d.key}`] = norm(domainEntries(items, d.key, packsFor(d.key)));
  }
  return res;
}

/** Per item, the answers of today's functions that read role / always (or item.sets). */
function itemAnswers(items, bike) {
  const roleFilters = ['none', 'night', 'standard', 'worn', 'optional'];
  return Object.fromEntries(items.map((i) => [i.id, {
    filter: roleFilters.filter((role) => matches(i, { role })),
    weighPriority: weighPriority(i),
    layerRank: layerOf(i).rank,
    alwaysKeep: alwaysKeep(i),
    tripSlot: tripSlot(i, bike.setup),
    templateSlot: templateSlot(i, bike.setup),
    packSlot: packSlot(i, [{ key: 'pack' }]),
    poorOnBody: poorPlace({ slot: 'body' }, i, { setup: bike.setup }),
    helpers: { inStandard: inStandard(i), isWorn: isWorn(i), leaveHome: leaveHome(i) },
  }]));
}

/** The keys where two item answers differ: { itemId: { key: [before, after] } }. */
function diffAnswers(a, b) {
  const out = {};
  for (const id of Object.keys(a)) for (const k of Object.keys(a[id])) {
    if (JSON.stringify(a[id][k]) !== JSON.stringify(b[id][k])) (out[id] ??= {})[k] = [a[id][k], b[id][k]];
  }
  return out;
}

const RESULTS = {};
for (const [name, tables] of Object.entries(DATASETS)) {
  const { bike, trips, templates } = stored(tables);
  const before = { items: tables.items, templates, bike, trips };
  const up = migrateAll({ items: tables.items, templates, settings: { sets: setting(tables, 'sets') } }, { now: '2026-10-08T08:00:00.000Z' });
  const after = { items: up.items, templates: up.templates, bike, trips };
  RESULTS[name] = { before, after, up, listsBefore: lists(before), listsAfter: lists(after), answersBefore: itemAnswers(before.items, bike), answersAfter: itemAnswers(after.items, bike) };
}

describe('golden: the same packing lists before and after blocks2026', () => {
  for (const [name, r] of Object.entries(RESULTS)) {
    describe(name, () => {
      it('the update changed something (else the test proves nothing)', () => {
        expect(r.up.changedItems.length).toBeGreaterThan(0);
        expect(r.up.templates.every((t) => Array.isArray(t.blocks))).toBe(true);
      });

      for (const key of Object.keys(r.listsBefore)) {
        it(`${key}: same list`, () => {
          expect(r.listsAfter[key]).toEqual(r.listsBefore[key]);
        });
      }

      it('the lists are not empty', () => {
        expect(r.listsBefore.standard.length).toBeGreaterThan(0);
        expect(r.listsBefore.outdoor.length).toBeGreaterThan(r.listsBefore.dayRide.length);
      });

      it('helpers inStandard, isWorn, leaveHome: same answer for every item', () => {
        for (const id of Object.keys(r.answersBefore)) expect([id, r.answersAfter[id].helpers]).toEqual([id, r.answersBefore[id].helpers]);
      });

      it('role / always answers stay (only item.sets-based ones may move, see sideEffects)', () => {
        const diff = diffAnswers(r.answersBefore, r.answersAfter);
        const keys = new Set(Object.values(diff).flatMap((d) => Object.keys(d)));
        for (const k of keys) expect(['filter', 'weighPriority', 'layerRank']).toContain(k);
        // only items that had no set before and got 'standard' move (their sets went from [] to ['standard'])
        for (const id of Object.keys(diff)) {
          const i = r.before.items.find((x) => x.id === id);
          expect([id, !(i.sets ?? []).length && r.up.changedItems.includes(id)]).toEqual([id, true]);
        }
      });
    });
  }
});

/*
 * v0.33.0 (stage 2): the snapshot tests/golden/blocks2026.lists.json is now FROZEN: it holds the
 * lists of v0.32.0 (written by the preparation from today's functions before stage 2). Stage 2 must
 * give the same lists, except where Noah's 11a ("Standard comes into every new trip") changes them on
 * purpose: a template or copy start gains the Standard items it lacked (gain11a), and a Standard
 * item that the night brought before now comes as Standard (same place, same amount, without the
 * mark src 'context'). Those 11a lists have their own test below (blocks2026 11a).
 */
const REF = JSON.parse(readFileSync(new URL('./golden/blocks2026.lists.json', import.meta.url), 'utf8'));
/** The lists that start from a template or a copy, or that read alwaysEntries alone: 11a changes them. */
// standardEntriesRaw: trips.js standardEntries now holds all of Standard (also the old "On every
// trip"); only newTrip calls it, right before alwaysEntries, so the whole new-trip lists stay the same.
const KEYS_11A = ['template', 'templateOutdoor', 'copyDayRide', 'copyOutdoor', 'copyNoContext', 'alwaysEntriesRaw', 'standardEntriesRaw'];
const idOf = (s) => s.split('@')[0];
const noSrc = (s) => s.replace(/:context$/, '');

/**
 * What 11a changed in one list: { added (item IDs), fromStandard (IDs that lost the mark
 * 'context'), other (any other difference: must be empty) }.
 */
function diff11a(ref, now) {
  const refIds = new Set(ref.map(idOf));
  const added = now.filter((s) => !refIds.has(idOf(s)));
  const kept = now.filter((s) => refIds.has(idOf(s)));
  const fromStandard = ref.filter((s) => s.endsWith(':context') && kept.includes(noSrc(s))).map(idOf);
  const refNorm = ref.map((s) => (fromStandard.includes(idOf(s)) ? noSrc(s) : s)).sort();
  const other = JSON.stringify(refNorm) === JSON.stringify([...kept].sort()) ? [] : [refNorm, kept];
  return { added: added.map(idOf).sort(), addedRows: added, fromStandard, other };
}

describe('stage 2: every packing list as in v0.32.0 (frozen snapshot), 11a apart', () => {
  for (const [name, r] of Object.entries(RESULTS)) {
    describe(name, () => {
      for (const key of Object.keys(REF[name].lists).filter((k) => !KEYS_11A.includes(k))) {
        it(`${key}: as in v0.32.0`, () => {
          expect(r.listsAfter[key]).toEqual(REF[name].lists[key]);
          expect(r.listsBefore[key]).toEqual(REF[name].lists[key]);
        });
      }

      it('the update changes the same items and gives the same template blocks', () => {
        expect(r.up.changedItems).toEqual(REF[name].changedItems);
        expect(Object.fromEntries(r.up.templates.map((t) => [t.id, t.blocks]))).toEqual(REF[name].templateBlocks);
      });

      it('the key standard on item.sets moves nothing any more (gear filters, weighPriority, layerOf, …)', () => {
        // In the preparation these answers moved (REF sideEffects); stage 2 reads blockKeys / the helpers.
        expect(Object.keys(REF[name].sideEffects).length).toBeGreaterThan(0);
        expect(diffAnswers(r.answersBefore, r.answersAfter)).toEqual({});
      });
    });
  }
});

describe('blocks2026 11a: Standard comes into every new trip (an intended change)', () => {
  for (const [name, r] of Object.entries(RESULTS)) {
    describe(name, () => {
      const stdIds = new Set(r.after.items.filter((i) => inStandard(i)).map((i) => i.id));
      const byId = new Map(r.after.items.map((i) => [i.id, i]));

      for (const key of KEYS_11A) {
        it(`${key}: only Standard items are added, nothing else changes`, () => {
          const d = diff11a(REF[name].lists[key], r.listsAfter[key]);
          expect(d.other).toEqual([]);
          for (const id of [...d.added, ...d.fromStandard]) expect([id, stdIds.has(id)]).toEqual([id, true]);
          // an added Standard item goes to its usual place, once
          for (const row of d.addedRows) expect(row).toMatch(/x1$/);
          expect(r.listsBefore[key]).toEqual(r.listsAfter[key]);
        });
      }

      it('template and copy starts gain exactly the Standard items of the snapshot (gain11a)', () => {
        const gain = (key) => diff11a(REF[name].lists[key], r.listsAfter[key]).added;
        expect(gain('template')).toEqual(REF[name].gain11a.template);
        expect(gain('copyDayRide')).toEqual(REF[name].gain11a.copyDayRide);
        expect(gain('copyNoContext')).toEqual(REF[name].gain11a.copyNoContext);
      });

      it('every Standard item of the area is on every template and copy start now', () => {
        const ok = (i) => isInventory(i) && (i.domains ?? ['bikepacking']).includes('bikepacking');
        for (const key of ['template', 'templateOutdoor', 'copyOutdoor', 'copyNoContext']) {
          const has = new Set(r.listsAfter[key].map(idOf));
          const lacking = [...stdIds].filter((id) => ok(byId.get(id)) && !has.has(id));
          expect([key, lacking]).toEqual([key, []]);
        }
      });
    });
  }

  it('the expected difference in numbers: pf-fixture gains, fixture.json and the edge set do not', () => {
    const n = (name, key) => diff11a(REF[name].lists[key], RESULTS[name].listsAfter[key]).added.length;
    expect(n('pf', 'template')).toBe(5);
    expect([n('pf', 'copyDayRide'), n('pf', 'copyNoContext')]).toEqual([REF.pf.gain11a.copyDayRide.length, REF.pf.gain11a.copyNoContext.length]);
    expect(REF.pf.gain11a.copyDayRide.length + REF.pf.gain11a.copyNoContext.length).toBeGreaterThan(0);
    for (const key of ['template', 'copyDayRide', 'copyNoContext']) {
      expect(n('fixture', key)).toBe(0);
      expect(n('edge', key)).toBe(0);
    }
  });
});
