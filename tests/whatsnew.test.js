import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { WHATS_NEW, SHOWN, BEFORE, BOXES, compareVersions, splitNews, groupOlder, shortVersion, newsHint, newerThan, itemsOf, iconOf } from '../src/lib/whatsnew.js';
import { pageOf } from '../src/lib/nav.js';
import { t, lang } from '../src/lib/i18n.svelte.js';
import DE from '../src/lib/i18n/de/index.js';

// v0.35.0 (Noah): "New in the last updates", from now on with every release.
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
afterEach(() => (lang.v = 'en'));

describe('the list of what is new', () => {
  it('the newest entry is this version (every release adds one), newest first', () => {
    expect(WHATS_NEW[0].version).toBe(pkg.version);
    const versions = WHATS_NEW.map((e) => e.version);
    expect([...versions].sort((a, b) => compareVersions(b, a))).toEqual(versions);
    expect(new Set(versions).size).toBe(versions.length);
  });

  it('goes back to the very first version; versions strictly descending, dates never rising', () => {
    expect(WHATS_NEW.at(-1).version).toBe('0.1.0');
    expect(WHATS_NEW.length).toBeGreaterThanOrEqual(50);
    for (let i = 1; i < WHATS_NEW.length; i++) {
      const [a, b] = [WHATS_NEW[i - 1], WHATS_NEW[i]];
      expect(compareVersions(a.version, b.version), `${a.version} > ${b.version}`).toBe(1);
      expect(a.date >= b.date, `${a.version} ${a.date} / ${b.version} ${b.date}`).toBe(true);
    }
  });

  it('each version: a version, a real date, 1 to 4 points, each with a German text', () => {
    for (const e of WHATS_NEW) {
      expect(e.version, JSON.stringify(e)).toMatch(/^\d+\.\d+\.\d+$/);
      expect(e.date, e.version).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(e.date)), e.version).toBe(false);
      expect(e.points.length, e.version).toBeGreaterThanOrEqual(1);
      // v0.118.0 «Was ist neu 2» (changed on purpose, answer 2a): 1–3 main points, the small things in boxes
      expect(e.points.length, e.version).toBeLessThanOrEqual(3);
      expect(new Set(e.points.map((p) => p.text)).size, e.version).toBe(e.points.length);
      for (const p of itemsOf(e)) {
        expect(DE[p.text], p.text).toBeTruthy();
        expect(DE[p.text], p.text).not.toMatch(/[ß—]/);
        expect(p.text, p.text).not.toMatch(/—/);
      }
    }
    lang.v = 'de';
    expect(t('New in {versions}', { versions: '0.40 · 0.39' })).toBe('Neu in 0.40 · 0.39');
    expect(t('Older updates')).toBe('Ältere Updates');
    expect(t('{from} to {to}|versions', { from: '0.1', to: '0.9' })).toBe('0.1 bis 0.9');
  });

  it('every "Try it" goes to a place the app still has (or there is no link)', () => {
    // All source files except this list: an address counts when the app itself uses it.
    const src = new URL('../src/', import.meta.url);
    const files = readdirSync(src, { recursive: true })
      .filter((f) => /\.(js|svelte)$/.test(f) && !f.endsWith('whatsnew.js'))
      .map((f) => readFileSync(new URL(f, src), 'utf8'))
      .join('\n');
    for (const e of WHATS_NEW) {
      for (const p of itemsOf(e)) {
        if (p.href == null) {
          expect(p.action, p.text).toBeUndefined();
          continue;
        }
        expect(p.href, p.text).toMatch(/^#\//);
        // in JS ('#/x') or in markup (href="#/x"): v0.46.0 removed the last quoted use of #/debrief/learnings
        expect(files.includes(`'${p.href}'`) || files.includes(`"${p.href}"`), `${e.version}: ${p.href}`).toBe(true);
        expect(pageOf(p.href) !== 'home' || p.href === '#/', p.href).toBe(true);
        if (p.action) expect(p.action).toBe('data');
      }
    }
  });

  it('the last versions open, the older ones folded', () => {
    const { recent, older } = splitNews();
    expect(recent.length).toBe(Math.min(SHOWN, WHATS_NEW.length));
    expect(recent.length).toBeGreaterThanOrEqual(3);
    expect([...recent, ...older]).toEqual(WHATS_NEW);
    expect(splitNews(WHATS_NEW, 2).older.length).toBe(WHATS_NEW.length - 2);
  });

  it('the older ones in calm groups by version range, nothing lost, newest first', () => {
    const { older } = splitNews();
    const groups = groupOlder(older);
    expect(groups.flatMap((g) => g.entries)).toEqual(older);
    // One group per ten minor versions (0.0–0.9, 0.10–0.19, …); it grows by one with every new decade.
    const decades = new Set(older.map((e) => Math.floor(Number(e.version.split('.')[1]) / 10)));
    expect(groups.length).toBe(decades.size);
    expect(groups.at(-1)).toMatchObject({ key: '0.0', from: '0.1', to: '0.9' });
    for (const g of groups) {
      expect(g.entries.length).toBeGreaterThan(0);
      expect(compareVersions(g.from, g.to)).toBeLessThanOrEqual(0);
    }
    expect(groupOlder([{ version: '0.29.2' }, { version: '0.20.0' }, { version: '0.19.6' }]).map((g) => [g.from, g.to])).toEqual([
      ['0.20', '0.29'],
      ['0.19', '0.19'],
    ]);
    expect(shortVersion('0.35.0')).toBe('0.35');
    expect(shortVersion('0.30.2')).toBe('0.30.2');
  });

  it('0.46.0 «Startseite neu»: Today, the command search and the colour worlds, each with Try it', () => {
    // v0.118.0 (changed on purpose): the colour worlds are a small thing in the box «New»
    const e = WHATS_NEW.find((x) => x.version === '0.46.0');
    const all = itemsOf(e);
    expect(all.length).toBeGreaterThanOrEqual(3);
    expect(all.length).toBeLessThanOrEqual(4);
    for (const p of all) {
      expect(p.href).toBe('#/');
      expect(DE[p.text], p.text).toBeTruthy();
    }
    lang.v = 'de';
    expect(t(all[3].text)).toContain('Gletscher, Sandstein und Klassisch');
    expect(e.small[0].box).toBe('new');
  });

  it('0.47.0 «Aufpimpen»: wardrobe, bike trip, gear and bike care, each with Try it', () => {
    const e = WHATS_NEW.find((x) => x.version === '0.47.0');
    const all = itemsOf(e);
    expect(all.length).toBeLessThanOrEqual(4);
    expect(all.map((p) => p.href)).toEqual(['#/wardrobe', '#/pack', '#/gear', '#/bikes?tab=care']);
    for (const p of all) expect(DE[p.text], p.text).toBeTruthy();
    lang.v = 'de';
    expect(t(all[0].text)).toContain('Noch einordnen');
    expect(t(all[3].text)).toContain('Velopflege');
  });

  it('0.47.2 «Material-Ansichten»: views, never used, dots and the item, each with Try it', () => {
    const e = WHATS_NEW.find((x) => x.version === '0.47.2');
    const all = itemsOf(e);
    expect(all.length).toBeLessThanOrEqual(4);
    expect(all.map((p) => p.href)).toEqual(['#/gear', '#/gear?view=never', '#/gear', '#/gear']);
    for (const p of all) expect(DE[p.text], p.text).toBeTruthy();
    lang.v = 'de';
    expect(t(all[1].text)).toContain('Nie gebraucht');
  });

  it('v0.118.0 «Was ist neu 2»: every version has its own title and one sentence, small things in the four boxes, at most one emoji', () => {
    const titles = new Set();
    const emoji = /\p{Extended_Pictographic}/gu;
    for (const e of WHATS_NEW) {
      expect(e.title, e.version).toBeTruthy();
      expect(e.lead, e.version).toBeTruthy();
      expect(titles.has(e.title), `${e.version}: ${e.title}`).toBe(false);
      titles.add(e.title);
      for (const k of [e.title, e.lead]) {
        expect(DE[k], k).toBeTruthy();
        expect(DE[k], k).not.toMatch(/[ß—]/);
      }
      for (const s of e.small ?? []) expect(BOXES.map((b) => b.key), `${e.version}: ${s.box}`).toContain(s.box);
      expect((e.small ?? []).length, e.version).toBeLessThanOrEqual(3);
      const en = [e.title, e.lead, ...itemsOf(e).map((p) => p.text)].join(' ');
      const de = [e.title, e.lead, ...itemsOf(e).map((p) => p.text)].map((k) => DE[k]).join(' ');
      expect((en.match(emoji) ?? []).length, e.version).toBeLessThanOrEqual(1);
      expect((de.match(emoji) ?? []).length, e.version).toBeLessThanOrEqual(1);
      for (const p of itemsOf(e)) expect(typeof iconOf(p), p.text).toBe('string');
    }
    lang.v = 'de';
    for (const b of BOXES) expect(t(b.label)).not.toBe(b.label);
    expect(t('New|box')).toBe('Neu');
    expect(t('Fixed|box')).toBe('Repariert');
  });

  it('compares versions by number, not by text', () => {
    expect(compareVersions('0.35.0', '0.34.0')).toBe(1);
    expect(compareVersions('0.9.0', '0.10.0')).toBe(-1);
    expect(compareVersions('0.35', '0.35.0')).toBe(0);
    expect(newerThan('0.33.0').map((e) => e.version)).toEqual(['0.181.0', '0.179.0', '0.178.0', '0.177.0', '0.176.1', '0.176.0', '0.175.0', '0.174.0', '0.173.0', '0.172.0', '0.171.0', '0.170.1', '0.170.0', '0.169.0', '0.168.0', '0.167.0', '0.166.1', '0.166.0', '0.165.0', '0.164.0', '0.163.0', '0.162.0', '0.161.0', '0.160.0', '0.159.0', '0.158.0', '0.157.0', '0.156.0', '0.155.0', '0.154.0', '0.153.0', '0.152.0', '0.151.0', '0.150.0', '0.149.0', '0.148.0', '0.147.0', '0.146.0', '0.145.0', '0.144.0', '0.136.0', '0.135.0', '0.134.0', '0.133.0', '0.132.2', '0.132.1', '0.132.0', '0.131.3', '0.131.2', '0.131.1', '0.131.0', '0.124.0', '0.123.0', '0.122.0', '0.121.0', '0.119.0', '0.118.0', '0.117.0', '0.116.2', '0.116.1', '0.116.0', '0.115.0', '0.114.0', '0.111.0', '0.110.0', '0.109.0', '0.108.0', '0.107.0', '0.106.0', '0.105.0', '0.104.0', '0.103.0', '0.102.0', '0.101.0', '0.100.0', '0.99.0', '0.98.0', '0.97.0', '0.96.0', '0.95.0', '0.94.0', '0.93.0', '0.92.0', '0.91.0', '0.88.0', '0.86.0', '0.84.0', '0.83.0', '0.81.0', '0.80.0', '0.79.0', '0.78.0', '0.77.0', '0.76.0', '0.75.0', '0.73.0', '0.70.0', '0.69.1', '0.69.0', '0.68.0', '0.67.1', '0.67.0', '0.66.0', '0.65.0', '0.63.0', '0.61.0', '0.59.0', '0.57.0', '0.56.0', '0.51.0', '0.47.3', '0.47.2', '0.47.1', '0.47.0', '0.46.3', '0.46.2', '0.46.1', '0.46.0', '0.45.2', '0.45.1', '0.45.0', '0.44.1', '0.44.0', '0.43.0', '0.42.0', '0.41.0', '0.40.0', '0.39.0', '0.38.0', '0.37.1', '0.37.0', '0.36.0', '0.35.0', '0.34.0']);
  });
});

describe('Today: "New since your last visit", once after an update', () => {
  it('a first install (no mark, no data) shows nothing and remembers this version', () => {
    expect(newsHint(null, false, '0.35.0')).toEqual({ show: false, mark: '0.35.0' });
  });

  it('a device with data from before this list: shown once, then remembered', () => {
    expect(BEFORE).toBe('0.34.0');
    expect(newsHint(null, true, '0.35.0')).toEqual({ show: true, mark: '0.35.0' });
    expect(newsHint('0.35.0', true, '0.35.0')).toEqual({ show: false, mark: null });
  });

  it('after the next update it shows again; a newer mark (another build) does not', () => {
    expect(newsHint('0.35.0', true, '0.36.0')).toEqual({ show: true, mark: '0.36.0' });
    expect(newsHint('0.36.0', true, '0.35.0')).toEqual({ show: false, mark: '0.35.0' });
  });
});

describe('«Try it» leads somewhere', () => {
  // v0.121.0 fix (Noah 13.10.2026): «Try it» on Today's tile takes the first point with a place; '#/' is Today
  // itself, so the tap did nothing. From 0.121.0 on, the first place is never Today.
  it('the first place of every version from 0.121.0 on is not Today itself', () => {
    for (const e of WHATS_NEW.filter((x) => compareVersions(x.version, '0.121.0') >= 0)) {
      const first = e.points.find((p) => p.href || p.action);
      expect(first?.href, e.version).not.toBe('#/');
    }
  });
});
