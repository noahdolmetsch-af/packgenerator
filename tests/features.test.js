// v0.96.0 «F1 Alles finden» (Noah «1-5 a», mockups A/B): the catalogue of every function by situation.
import './setup/de.js'; // this test needs the German texts
import { describe, it, expect, afterEach } from 'vitest';
import { FEATURES, FEATURE, FEATURE_GROUPS, PAGE_GROUPS, MOMENT_GROUPS, pageOf, catalogue, seenOf, featureHref, findFeatures } from '../src/lib/features.js';
import { TIPS, TIP } from '../src/lib/tips.js';
import { t, lang } from '../src/lib/i18n.svelte.js';
import DE from '../src/lib/i18n/de/index.js';

afterEach(() => (lang.v = 'en'));

describe('the catalogue', () => {
  it('has every tip once and unique ids, each in one of the 6 groups', () => {
    const ids = FEATURES.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const tip of TIPS) expect(ids, tip.id).toContain(tip.id);
    const keys = FEATURE_GROUPS.map((g) => g.key);
    expect(keys).toEqual(['before', 'onway', 'after', 'bike', 'active', 'data']);
    for (const f of FEATURES) expect(keys, f.id).toContain(f.group);
    expect(FEATURES.length).toBeGreaterThan(TIPS.length + 40);
  });

  it('every function leads somewhere: a tip, a page or an action', () => {
    for (const f of FEATURES) expect(!!(f.tip || f.href || f.run), f.id).toBe(true);
    for (const f of FEATURES) if (f.href) expect(f.href, f.id).toMatch(/^#\//);
  });

  it('every title, text and group has a German text', () => {
    const keys = [...FEATURE_GROUPS.map((g) => g.label), ...FEATURES.flatMap((f) => [f.title, f.text])];
    expect(keys.filter((k) => !(k in DE))).toEqual([]);
  });

  it('a tip keeps its own title and text', () => {
    expect(FEATURE.weigh.title).toBe(TIP.weigh.title);
    expect(FEATURE.weigh.group).toBe('before');
  });
});

describe('used and the order in a group', () => {
  it('never used first, then the used ones; taps and «I know it» count', () => {
    const state = { tapped: { 'f.shop': '2026-10-11' }, known: { 'f.ballast': '2026-10-11' } };
    const { groups, used, total } = catalogue(state, new Set(['weigh']));
    const before = groups.find((g) => g.key === 'before');
    const flags = before.items.map((x) => x.used);
    expect(flags.indexOf(true)).toBe(flags.length - before.used); // all used at the end
    expect(before.items.filter((x) => x.used).map((x) => x.id).sort()).toEqual(['f.ballast', 'f.shop', 'weigh']);
    expect(used).toBe(3);
    expect(total).toBe(FEATURES.length);
  });

  it('the data shows own functions as used', () => {
    const seen = seenOf({ counts: { rides: 2, visits: 0, flowSessions: 1 }, folder: true, play: false });
    expect([...seen].sort()).toEqual(['f.autobackup', 'f.meditation', 'f.upload']);
  });
});

describe('where a function leads', () => {
  it('a bike sheet opens on the first bike, without a bike the bikes page', () => {
    expect(featureHref(FEATURE['f.warranty'], { bikeId: 'test_data_gtp_spark' })).toBe('#/bikes?bike=test_data_gtp_spark&sheet=warranty');
    expect(featureHref(FEATURE['f.warranty'])).toBe('#/bikes');
    expect(featureHref(FEATURE.weigh)).toBe(TIP.weigh.go.href);
    expect(featureHref(FEATURE['f.plan'])).toBeNull();
  });
});

describe('the search finds functions', () => {
  it('by the German word too («garantie»), at least 2 letters', () => {
    lang.v = 'de';
    const hits = findFeatures('garantie', t);
    expect(hits[0].featureId).toBe('f.warranty');
    expect(hits[0].title).toBe('Garantie und Belege');
    expect(findFeatures('g', t)).toEqual([]);
  });

  it('every word has to match', () => {
    expect(findFeatures('import rides', t).map((x) => x.featureId)).toEqual(['f.kmimport']);
  });
});

describe('by page (Noah «1 a und b beides umstellbar»)', () => {
  it('every function sits on one place of the app, each place has some', () => {
    const keys = PAGE_GROUPS.map((g) => g.key);
    expect(keys).toEqual(['trips', 'gear', 'bikes', 'flow', 'me']);
    for (const f of FEATURES) expect(keys, f.id).toContain(pageOf(f));
    const { groups, total } = catalogue(null, new Set(), 'page');
    expect(groups.map((g) => g.key)).toEqual(keys);
    for (const g of groups) expect(g.total, g.key).toBeGreaterThan(0);
    expect(groups.reduce((n, g) => n + g.total, 0)).toBe(total);
  });

  it('where it leads decides the place; a trip function opening a bike stays with the trips', () => {
    expect(pageOf(FEATURE['f.warranty'])).toBe('bikes');
    expect(pageOf(FEATURE['f.meditation'])).toBe('flow');
    expect(pageOf(FEATURE['f.wardrobe'])).toBe('gear');
    expect(pageOf(FEATURE['f.plan'])).toBe('trips');
    expect(pageOf(FEATURE['f.theme'])).toBe('me');
    expect(pageOf(FEATURE.event)).toBe('trips');
  });

  it('every place has a German name', () => {
    expect(PAGE_GROUPS.map((g) => g.label).filter((k) => !(k in DE))).toEqual([]);
  });
});

describe('by moment («Heute als Begleiter» PR 6)', () => {
  it('puts every function in exactly one of the 9 moment groups, each group named in German', () => {
    const { groups, total } = catalogue(null, new Set(), 'moment');
    expect(groups.map((g) => g.key)).toEqual(MOMENT_GROUPS.map((g) => g.key));
    expect(groups).toHaveLength(9);
    expect(groups.reduce((n, g) => n + g.items.length, 0)).toBe(total);
    const ids = groups.flatMap((g) => g.items.map((x) => x.id));
    expect(new Set(ids).size).toBe(total);
    for (const g of MOMENT_GROUPS) expect(DE[g.label], g.label).toBeTruthy();
  });
});
