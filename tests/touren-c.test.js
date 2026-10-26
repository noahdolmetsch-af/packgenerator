// Touren-Ideen 60–70 (996 Ideen, Noah 25.10.2026), the small ones: 60 Pausengrund, 61 Vergessene Pause,
// 65 Schlecht erreichbar, 67 Alte Reise ohne GPS, 70 Gefühl vor den Zahlen. Fictional data only.
import { describe, it, expect } from 'vitest';
import { WHYS, isWhy, whyOf, setWhy, addBreak, whyTotals, forgotStep, FORGOT_S } from '../src/lib/tourenc/pausewhy.js';
import { memoryTrip, memoryError, lastDay } from '../src/lib/tourenc/memorytrip.js';
import { suggestions, applyDebrief, newDebrief } from '../src/lib/debrief.js';
import { tripFacts } from '../src/lib/review/rueckblick.js';
import { suggestCuts, partsOf, cutsOf, splitRide, timeAtKm, sportGuess } from '../src/lib/tourenc/split.js';
import { parseLines, localPoints, withItems, applyPoints, itemIn } from '../src/lib/tourenc/voicepoints.js';
import de from '../src/lib/i18n/de/tourenc.js';
import DE from '../src/lib/i18n/de/index.js';

const T0 = Date.UTC(2026, 6, 4, 8, 0, 0);
const min = (n) => n * 6e4;

describe('60 Pausengrund', () => {
  it('three reasons, set and taken away by the start of the pause', () => {
    expect(WHYS.map((w) => w.key)).toEqual(['rest', 'fix', 'wait']);
    expect(isWhy('fix')).toBe(true);
    expect(isWhy('nap')).toBe(false);
    let w = setWhy({}, T0, 'fix');
    expect(whyOf(w, T0)).toBe('fix');
    w = setWhy(w, T0, '');
    expect(whyOf(w, T0)).toBe('');
    expect(setWhy({}, T0, 'nap')).toEqual({});
  });

  it('totals per reason, open pauses not counted', () => {
    const breaks = [[T0, T0 + min(20)], [T0 + min(60), T0 + min(70)], [T0 + min(90), T0 + min(95)], [T0 + min(120), null]];
    const whys = { [T0]: 'rest', [T0 + min(60)]: 'fix' };
    expect(whyTotals(breaks, whys)).toEqual({ rest: 1200, fix: 600, wait: 0, none: 300 });
  });
});

describe('61 Vergessene Pause', () => {
  it('asks only after a long standing time, when you ride on', () => {
    let st = {};
    let r = forgotStep(st, { kmh: 0, now: T0 });
    expect(r.ask).toBe(null);
    r = forgotStep(r.st, { kmh: 1, now: T0 + (FORGOT_S - 1) * 1000 });
    expect(r.st.long).toBe(false);
    r = forgotStep(r.st, { kmh: 0, now: T0 + FORGOT_S * 1000 });
    expect(r.st.long).toBe(true);
    r = forgotStep(r.st, { kmh: 4, now: T0 + min(11) }); // slow pushing: not yet
    expect(r.ask).toBe(null);
    r = forgotStep(r.st, { kmh: 18, now: T0 + min(12) });
    expect(r.ask).toEqual({ from: T0, to: T0 + min(12) });
    expect(r.st.since).toBe(null);
  });

  it('a short stop or a real pause asks nothing', () => {
    let r = forgotStep({}, { kmh: 0, now: T0 });
    r = forgotStep(r.st, { kmh: 20, now: T0 + min(3) });
    expect(r.ask).toBe(null);
    r = forgotStep({ since: T0, long: true }, { kmh: 0, now: T0 + min(20), paused: true });
    expect(r.ask).toBe(null);
    expect(r.st).toEqual({ since: null, long: false });
  });

  it('adds the pause afterwards without overlapping an existing one', () => {
    const breaks = [[T0 + min(10), T0 + min(15)]];
    expect(addBreak(breaks, T0 + min(30), T0 + min(45))).toEqual([[T0 + min(10), T0 + min(15)], [T0 + min(30), T0 + min(45)]]);
    expect(addBreak(breaks, T0 + min(12), T0 + min(20))).toEqual([[T0 + min(10), T0 + min(15)], [T0 + min(15), T0 + min(20)]]);
    expect(addBreak(breaks, T0 + min(11), T0 + min(14))).toEqual(breaks);
    expect(addBreak(breaks, T0 + min(5), T0 + min(5))).toEqual(breaks);
  });
});

describe('65 Schlecht erreichbar', () => {
  const items = [
    { id: 'i1', name: 'test_data_gtp_ Stirnlampe', category: 'light', weightG: 80 },
    { id: 'i2', name: 'test_data_gtp_ Regenjacke', category: 'clothing', weightG: 200 },
  ];
  const trip = { id: 'trip-x', title: 'test_data_gtp_ Jura', startDate: '2026-07-01', days: 2, entries: [{ itemId: 'i1', slot: 'seat', qty: 1 }, { itemId: 'i2', slot: 'frame', qty: 1 }] };

  it('suggests «within reach» for used items only, and saves it as a learning at the item', () => {
    const d = { ...newDebrief(trip), reach: ['i1', 'i2'], items: { i2: 'unused' } };
    const s = suggestions(d, trip, items, [], [], []);
    const reach = s.filter((x) => x.id.startsWith('reach:'));
    expect(reach.map((x) => x.id)).toEqual(['reach:i1']);
    expect(reach[0].group).toBe('learn');
    const out = applyDebrief(d, trip, items, [], [], ['reach:i1'], { now: '2026-07-04T10:00:00.000Z' });
    expect(out.learnings).toHaveLength(1);
    expect(out.learnings[0].itemIds).toEqual(['i1']);
    expect(out.learnings[0].rule).toContain('test_data_gtp_ Stirnlampe');
  });
});

describe('67 Alte Reise ohne GPS', () => {
  it('checks the form', () => {
    expect(memoryError({ title: '', startDate: '2019-06-01', days: 3 }, '2026-10-26')).toBe('Give it a name.');
    expect(memoryError({ title: 'x', startDate: '', days: 3 }, '2026-10-26')).toBe('Choose the first day.');
    expect(memoryError({ title: 'x', startDate: '2019-06-01', days: 0 }, '2026-10-26')).toBe('Days: 1 to 365.');
    expect(memoryError({ title: 'x', startDate: '2026-10-25', days: 3 }, '2026-10-26')).toBe('Only for trips that are over.');
    expect(memoryError({ title: 'x', startDate: '2019-06-01', days: 3 }, '2026-10-26')).toBe('');
    expect(lastDay('2019-06-29', 3)).toBe('2019-07-01');
  });

  it('a finished trip with no numbers; the photo goes into a note', () => {
    const { trip, debrief, note } = memoryTrip({ title: ' test_data_gtp_ Jura 2019 ', startDate: '2019-06-01', days: 3, place: 'test_data_gtp_ Jura', text: 'test_data_gtp_ Regen am zweiten Tag', photo: 'data:image/jpeg;base64,AAAA' }, T0);
    expect(trip.title).toBe('test_data_gtp_ Jura 2019');
    expect(trip.status).toBe('done');
    expect(trip.finished).toBe('2019-06-03');
    expect(trip.route).toBeUndefined();
    expect(trip.memory.place).toBe('test_data_gtp_ Jura');
    expect(debrief.status).toBe('done');
    expect(debrief.km).toBe(null);
    expect(debrief.note).toBe('test_data_gtp_ Regen am zweiten Tag');
    expect(note.tripId).toBe(trip.id);
    expect(note.status).toBe('kept');
    const rows = tripFacts({ trips: [trip], debriefs: [debrief], today: '2026-10-26' });
    expect(rows).toHaveLength(1);
    expect(rows[0].km).toBe(null);
    expect(rows[0].movingH).toBe(null);
    expect(rows[0].href).toBe(`#/debrief/${trip.id}`);
    expect(memoryTrip({ title: 'x', startDate: '2019-06-01' }, T0).note).toBe(null);
  });
});

// a ride going north, a point a minute: 60 min riding (~20 km/h), a night stop of 2 h, 40 min walking (~4 km/h), 30 min riding
function ridePts() {
  const out = [];
  let t = T0;
  let lat = 46.9;
  const push = (n, dLat) => {
    for (let i = 0; i < n; i++) {
      lat += dLat;
      t += 6e4;
      out.push({ lat, lon: 7.4, t, ele: 500 + out.length });
    }
  };
  push(60, 0.003); // ~0.33 km per minute
  t += 120 * 6e4; // the pause: the watch saves nothing for 2 h
  push(40, 0.0006); // ~0.067 km per minute = 4 km/h
  push(30, 0.003);
  return out;
}

describe('66 Eine Datei, mehrere Erlebnisse', () => {
  it('suggests the long pause and the slow stretch', () => {
    const s = suggestCuts(ridePts());
    expect(s.map((x) => x.kind)).toEqual(['pause', 'slow']);
    expect(s[0].min).toBeGreaterThanOrEqual(120);
    expect(s[1].min).toBeGreaterThanOrEqual(30);
  });

  it('cuts into parts; the pause is in none of them', () => {
    const pts = ridePts();
    const s = suggestCuts(pts);
    const parts = partsOf(pts, cutsOf(s, new Set([0, 1])));
    expect(parts).toHaveLength(3);
    const rides = splitRide(pts, cutsOf(s, new Set([0, 1])), 'test_data_gtp_ Jura', 'test.gpx');
    expect(rides.map((r) => r.name)).toEqual(['test_data_gtp_ Jura · 1', 'test_data_gtp_ Jura · 2', 'test_data_gtp_ Jura · 3']);
    expect(new Set(rides.map((r) => r.id)).size).toBe(3);
    expect(rides.every((r) => r.totalH < 2)).toBe(true);
    expect(sportGuess(rides[0])).toBe('bike');
    expect(sportGuess(rides[1])).toBe('hike');
    // only the pause chosen: two parts
    expect(splitRide(pts, cutsOf(s, new Set([0])), 'x')).toHaveLength(2);
    // an own cut by km
    const at = timeAtKm(pts, 5);
    expect(splitRide(pts, cutsOf(s, new Set(), [at]), 'x')).toHaveLength(2);
    expect(splitRide(pts, [], 'x')).toHaveLength(1);
  });
});

describe('68 Rückblick als Sprachnachricht', () => {
  const items = [
    { id: 'i1', name: 'test_data_gtp_ Kocher' },
    { id: 'i2', name: 'test_data_gtp_ Regenjacke' },
    { id: 'i3', name: 'test_data_gtp_ Ruecklicht' },
  ];
  const trip = { id: 'trip-v', title: 'test_data_gtp_ Jura', bikeId: 'bike-1', entries: [{ itemId: 'i1' }, { itemId: 'i2' }] };

  it('reads the lines of Gemini', () => {
    const p = parseLines('GELERNT: Die test_data_gtp_ Regenjacke war zu warm.\n- NICHTGEBRAUCHT: Den test_data_gtp_ Kocher nie gebraucht.\nFEHLTE: test_data_gtp_ Ruecklicht\nirgendwas anderes hier\nVELO: Kette ölen');
    expect(p.map((x) => x.kind)).toEqual(['learn', 'unused', 'missing', 'note', 'bike']);
  });

  it('without Gemini: sentence by sentence with a guessed kind', () => {
    const p = localPoints('Die Regenjacke war zu warm. Den Kocher habe ich nie gebraucht. Mir hat ein Rücklicht gefehlt! Die Kette quietscht. Schöner Tag am See.');
    expect(p.map((x) => x.kind)).toEqual(['learn', 'unused', 'missing', 'bike', 'note']);
  });

  it('finds the items; not needed only for an item on the trip', () => {
    expect(itemIn('den test_data_gtp_ kocher nie', items).id).toBe('i1');
    const w = withItems([{ text: 'test_data_gtp_ Kocher nie gebraucht', kind: 'unused' }, { text: 'test_data_gtp_ Ruecklicht nie gebraucht', kind: 'unused' }, { text: 'test_data_gtp_ Ruecklicht fehlte', kind: 'missing' }], trip, items);
    expect(w.map((x) => [x.kind, x.itemId])).toEqual([['unused', 'i1'], ['note', null], ['missing', 'i3']]);
  });

  it('puts the kept points where you would tap them', () => {
    const pts = withItems(
      [
        { text: 'test_data_gtp_ Kocher nie gebraucht', kind: 'unused' },
        { text: 'test_data_gtp_ Ruecklicht fehlte', kind: 'missing' },
        { text: 'Die test_data_gtp_ Regenjacke war zu warm', kind: 'learn' },
        { text: 'Kette ölen', kind: 'bike' },
        { text: 'Schöner Tag', kind: 'note' },
        { text: 'weglassen', kind: 'note' },
      ],
      trip,
      items,
    );
    pts[5].keep = false;
    const out = applyPoints(pts, { trip, learnings: [{ id: 4 }], now: '2026-07-04T10:00:00.000Z', stamp: 1 });
    expect(out.items).toEqual({ i1: 'unused' });
    expect(out.missing).toEqual([{ id: 'm11', name: 'test_data_gtp_ Ruecklicht', itemId: 'i3' }]);
    expect(out.learnings).toHaveLength(1);
    expect(out.learnings[0]).toMatchObject({ id: 5, itemIds: ['i2'], tripId: 'trip-v', from: 'voice' });
    expect(out.notes.map((n) => [n.status, n.bikeId ?? null])).toEqual([['open', 'bike-1'], ['kept', null]]);
  });
});

describe('German texts', () => {
  it('every key of the package has a German text, and none is changed by a later file', () => {
    for (const [k, v] of Object.entries(de)) {
      expect(v, k).toBeTruthy();
      expect(DE[k], k).toBe(v);
    }
  });
});
