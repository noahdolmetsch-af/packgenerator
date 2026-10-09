import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { WHATS_NEW, SHOWN, BEFORE, compareVersions, splitNews, groupOlder, shortVersion, newsHint, newerThan } from '../src/lib/whatsnew.js';
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
      expect(e.points.length, e.version).toBeLessThanOrEqual(4);
      expect(new Set(e.points.map((p) => p.text)).size, e.version).toBe(e.points.length);
      for (const p of e.points) {
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
      for (const p of e.points) {
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
    expect(groups.length).toBeLessThanOrEqual(6);
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
    const e = WHATS_NEW.find((x) => x.version === '0.46.0');
    expect(e.points.length).toBeGreaterThanOrEqual(3);
    expect(e.points.length).toBeLessThanOrEqual(4);
    for (const p of e.points) {
      expect(p.href).toBe('#/');
      expect(DE[p.text], p.text).toBeTruthy();
    }
    lang.v = 'de';
    expect(t(e.points[3].text)).toContain('Gletscher, Sandstein und Klassisch');
  });

  it('0.47.0 «Aufpimpen»: wardrobe, bike trip, gear and bike care, each with Try it', () => {
    const e = WHATS_NEW.find((x) => x.version === '0.47.0');
    expect(e.points.length).toBeLessThanOrEqual(4);
    expect(e.points.map((p) => p.href)).toEqual(['#/wardrobe', '#/pack', '#/gear', '#/bikes?tab=care']);
    for (const p of e.points) expect(DE[p.text], p.text).toBeTruthy();
    lang.v = 'de';
    expect(t(e.points[0].text)).toContain('Noch einordnen');
    expect(t(e.points[3].text)).toContain('Velopflege');
  });

  it('0.47.2 «Material-Ansichten»: views, never used, dots and the item, each with Try it', () => {
    const e = WHATS_NEW.find((x) => x.version === '0.47.2');
    expect(e.points.length).toBeLessThanOrEqual(4);
    expect(e.points.map((p) => p.href)).toEqual(['#/gear', '#/gear?view=never', '#/gear', '#/gear']);
    for (const p of e.points) expect(DE[p.text], p.text).toBeTruthy();
    lang.v = 'de';
    expect(t(e.points[1].text)).toContain('Nie gebraucht');
  });

  it('compares versions by number, not by text', () => {
    expect(compareVersions('0.35.0', '0.34.0')).toBe(1);
    expect(compareVersions('0.9.0', '0.10.0')).toBe(-1);
    expect(compareVersions('0.35', '0.35.0')).toBe(0);
    expect(newerThan('0.33.0').map((e) => e.version)).toEqual(['0.64.0', '0.61.0', '0.59.0', '0.57.0', '0.56.0', '0.51.0', '0.47.3', '0.47.2', '0.47.1', '0.47.0', '0.46.3', '0.46.2', '0.46.1', '0.46.0', '0.45.2', '0.45.1', '0.45.0', '0.44.1', '0.44.0', '0.43.0', '0.42.0', '0.41.0', '0.40.0', '0.39.0', '0.38.0', '0.37.1', '0.37.0', '0.36.0', '0.35.0', '0.34.0']);
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
