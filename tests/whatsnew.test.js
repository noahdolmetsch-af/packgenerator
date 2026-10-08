import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { WHATS_NEW, SHOWN, BEFORE, compareVersions, splitNews, newsHint, newerThan } from '../src/lib/whatsnew.js';
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

  it('each version: a date, 2 to 4 points, each with a real place and a German text', () => {
    for (const e of WHATS_NEW) {
      expect(e.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(e.points.length).toBeGreaterThanOrEqual(2);
      expect(e.points.length).toBeLessThanOrEqual(4);
      for (const p of e.points) {
        expect(p.href).toMatch(/^#\//);
        expect(pageOf(p.href)).toBeTruthy();
        expect(DE[p.text], p.text).toBeTruthy();
      }
    }
    lang.v = 'de';
    expect(t('New in the last updates')).toBe('Neu in den letzten Updates');
    expect(t('Try it')).toBe('Ausprobieren');
  });

  it('the last versions open, the older ones folded', () => {
    const { recent, older } = splitNews();
    expect(recent.length).toBe(Math.min(SHOWN, WHATS_NEW.length));
    expect(recent.length).toBeGreaterThanOrEqual(3);
    expect([...recent, ...older]).toEqual(WHATS_NEW);
    expect(splitNews(WHATS_NEW, 2).older.length).toBe(WHATS_NEW.length - 2);
  });

  it('compares versions by number, not by text', () => {
    expect(compareVersions('0.35.0', '0.34.0')).toBe(1);
    expect(compareVersions('0.9.0', '0.10.0')).toBe(-1);
    expect(compareVersions('0.35', '0.35.0')).toBe(0);
    expect(newerThan('0.33.0').map((e) => e.version)).toEqual(['0.35.0', '0.34.0']);
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
