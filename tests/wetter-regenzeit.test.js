// «Eine Regen-Startzeit für die ganze Seite» (Wetterseite aufräumen, Noah 23.11.2026): one story of the rain for every part.
import { describe, it, expect } from 'vitest';
import { hourSpan, rainRuns, rainStory, rainDay, rainOnDay, rainWords } from '../src/lib/wetter/regenzeit.js';
import { QUARTER } from '../src/lib/wetter/regen15.js';
import { atLocal } from '../src/lib/wetter/kern.js';

const OFF = 3600; // winter time at a fictional place
const DATE = '2026-11-23';
const at = (h, m = 0) => atLocal(DATE, h, OFF) + m * 60000;
// one hour per stamp from 00:00 to 24:00 local; wet: the stamps (local hours) that carry rain
const core = (wetStamps = []) => ({
  offset: OFF,
  hours: Array.from({ length: 25 }, (_, h) => ({ ms: at(h), temp: 4, rainP: wetStamps.includes(h) ? 80 : 5, rainMm: wetStamps.includes(h) ? 0.6 : 0 })),
});
const q = (nowMs, mm) => mm.map((v, i) => ({ ms: nowMs + i * QUARTER, mm: v }));
const hm = (ms) => new Date(ms + OFF * 1000).toISOString().slice(11, 16);
const t = (s, v = {}) => s.replace(/\{(\w+)\}/g, (_, k) => v[k]);

describe('rainRuns', () => {
  it('takes an hourly value as the hour before its stamp', () => {
    expect(hourSpan({ ms: at(6) })).toEqual({ from: at(5), to: at(6) });
    expect(rainRuns(core([6]).hours)).toEqual([{ from: at(5), to: at(6) }]);
  });
  it('joins touching wet hours into one run', () => {
    expect(rainRuns(core([6, 7, 8, 11]).hours)).toEqual([{ from: at(5), to: at(8) }, { from: at(10), to: at(11) }]);
  });
});

describe('rainStory', () => {
  it('is dry without rain, and null without a forecast', () => {
    expect(rainStory(core([]), null, at(9))).toEqual({ kind: 'dry' });
    expect(rainStory(null, null, at(9))).toBeNull();
  });
  it('says since when it rains, from the start of the wet hours (not the hour the page happens to start)', () => {
    // stamps 06 and 07: rain from 05:00 to 07:00; it is 06:30
    const s = rainStory(core([6, 7]), null, at(6, 30));
    expect(s).toEqual({ kind: 'now', since: at(5), to: at(7) });
  });
  it('says the true start of rain that is still to come', () => {
    const s = rainStory(core([10, 11]), null, at(8));
    expect(s).toEqual({ kind: 'later', from: at(9), to: at(11) });
  });
  it('ignores rain that is over', () => {
    expect(rainStory(core([6]), null, at(9))).toEqual({ kind: 'dry' });
  });
  it('lets the 15-minute rain win inside its three hours', () => {
    const now = at(8, 5);
    // hours say rain from 09:00; the quarters say it starts at 09:15 (quarter 4 counted from 08:00 = 09:00… here: index 5)
    const m = Array(16).fill(0);
    m[5] = 0.4;
    m[6] = 0.4;
    const rows = q(at(8), m);
    const s = rainStory(core([10]), rows, now);
    expect(s.kind).toBe('later');
    expect(s.from).toBe(at(8) + 5 * QUARTER);
  });
  it('does not believe an hourly run that the quarters call dry', () => {
    const now = at(8, 5);
    const rows = q(at(8), Array(16).fill(0)); // dry for the next three hours (until 11:00)
    expect(rainStory(core([9]), rows, now)).toEqual({ kind: 'dry' });
    // a run that reaches past the quarters starts where they end
    const s = rainStory(core([12, 13]), rows, now);
    expect(s.kind).toBe('later');
    expect(s.from).toBe(at(11)); // the three hours end at 11:00
  });
  it('is the same story for the same data on every part', () => {
    const c = core([6, 7]);
    const now = at(6, 30);
    expect(rainStory(c, null, now)).toEqual(rainStory(c, null, now));
    expect(rainWords(rainStory(c, null, now), t, hm)).toBe('rain since 05:00');
  });
});

describe('rainDay', () => {
  it('names the real start even when it lies before the ride', () => {
    const s = rainDay(core([6, 7, 8]), DATE, 7, 20);
    expect(s).toEqual({ kind: 'later', from: at(5), to: at(8), atStart: true });
    expect(rainWords(s, t, hm)).toBe('rain from 05:00');
  });
  it('is dry when the rain falls outside the ride', () => {
    expect(rainDay(core([2, 3]), DATE, 7, 20)).toEqual({ kind: 'dry' });
    expect(rainDay(core([22]), DATE, 7, 20)).toEqual({ kind: 'dry' });
  });
  it('today uses the story, another day the day', () => {
    const c = core([10, 11]);
    expect(rainOnDay(c, DATE, at(8), null, [7, 20])).toEqual(rainStory(c, null, at(8)));
    expect(rainOnDay(c, DATE, at(8) - 864e5, null, [7, 20])).toEqual(rainDay(c, DATE, 7, 20));
  });
});

describe('rainWords', () => {
  it('has a phrase for each kind', () => {
    expect(rainWords({ kind: 'dry' }, t, hm)).toBe('dry');
    expect(rainWords({ kind: 'now', since: null }, t, hm)).toBe('it rains now');
    expect(rainWords({ kind: 'later', from: at(14) }, t, hm)).toBe('rain from 14:00');
    expect(rainWords(null, t, hm)).toBe('');
  });
});

import { shortPlace } from '../src/lib/wetter/ort.js';
import { num } from '../src/lib/i18n.svelte.js';

describe('the shown name of a place', () => {
  it('cuts the search text to the place, with the German name where it is common', () => {
    expect(shortPlace('Zurich, Canton of Zurich, Switzerland', 'de')).toBe('Zürich');
    expect(shortPlace('Zurich, Canton of Zurich, Switzerland', 'en')).toBe('Zurich');
    expect(shortPlace('Andermatt, Uri, Switzerland', 'de')).toBe('Andermatt');
    expect(shortPlace('Bern', 'de')).toBe('Bern');
    expect(shortPlace('Furka, Oberalp', 'de')).toBe('Furka, Oberalp'); // typed by somebody: stays
    expect(shortPlace(null, 'de')).toBe('');
  });
});

describe('a number that rounds to minus zero', () => {
  it('shows 0, never −0', () => {
    expect(num(-0)).toBe('0');
    expect(num(Math.round(-0.4))).toBe('0');
    expect(num(-3)).toMatch(/3$/);
  });
});
