// Paket M «Quiz am Vorabend» (wish #207, Noah 19.10.2026): the pure rules of lib/lernen/quiz.js.
// Fictional data only (test_data_gtp_); calendar days, never «now + n × 24 h».
import { describe, it, expect } from 'vitest';
import { quizOf, ownOf, newOwn, putOwn, dropOwn, patchOwn, moveOwn, setType, hideCard, generated, buildQuiz, ownQuestion, lastIds, quizTrip, counts, logResult, todayResult, streak, lastResults, showEveCard, randomOf, nearNumbers, TYPE_KEYS, PER_QUIZ } from '../src/lib/lernen/quiz.js';
import { eveningBefore } from '../src/lib/phase.js';

const P = 'test_data_gtp_';
const TODAY = '2026-10-19';
const addDays = (day, n) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const item = (id, name, weightG, bag = 'seat') => ({ id: `${P}${id}`, name: `${P}${name}`, category: 'misc', weightG, qty: 1, weightStatus: 'measured', carry: 'luggage', defaultBag: bag, ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'] });
const ITEMS = [item('i1', 'Tent', 1200), item('i2', 'Stove', 300, 'frame'), item('i3', 'Pump', 90, 'frame'), item('i4', 'Jacket', 250, 'bar'), item('i5', 'Tube', 120, 'bar'), item('i6', 'Socks', 60, 'seat')];
const CONTAINERS = [
  { id: `${P}b-seat`, name: `${P}Seat pack`, slot: 'seat', volumeL: 14, itemId: null, pieces: 1 },
  { id: `${P}b-frame`, name: `${P}Frame bag`, slot: 'frame', volumeL: 5, itemId: null, pieces: 1 },
  { id: `${P}b-bar`, name: `${P}Front roll`, slot: 'bar', volumeL: 9, itemId: null, pieces: 1 },
];
const BIKE = { id: `${P}bike`, name: `${P}Gravel`, weightG: 9800, slots: ['seat', 'frame', 'bar'], setup: { seat: `${P}b-seat`, frame: `${P}b-frame`, bar: `${P}b-bar` } };
const trip = (f = {}) => ({
  id: `${P}t1`,
  title: `${P}Jura`,
  domain: 'bikepacking',
  startDate: addDays(TODAY, 1),
  days: 3,
  bikeId: BIKE.id,
  setup: BIKE.setup,
  entries: ITEMS.map((i) => ({ itemId: i.id, slot: i.defaultBag, qty: i.id.endsWith('i6') ? 3 : 1, packed: false })),
  route: { km: 212.4, gainM: 3120, line: [], profile: [] },
  stages: { start: `${P}Biel`, days: [{ km: 60, name: `${P}Chasseral` }, { km: 150, name: `${P}Saignelegier` }, { km: null, name: `${P}Delemont` }] },
  forecast: { fetchedAt: `${TODAY}T08:00:00Z`, days: [{ date: addDays(TODAY, 1), min: 6, max: 15, rainMm: 0, rainPct: 20 }] },
  status: 'planned',
  ...f,
});
const DATA = { items: ITEMS, containers: CONTAINERS, bikes: [BIKE], trips: [trip(), { id: `${P}t0`, title: 'x', startDate: '2026-09-01', stages: { start: `${P}Thun`, days: [{ name: `${P}Brienz` }] } }] };

describe('the stored record', () => {
  it('defaults: on, nothing own, no kind hidden, empty log', () => {
    expect(quizOf(null)).toEqual({ on: true, own: [], offTypes: [], log: [], hidden: [] });
    expect(quizOf({ on: false, offTypes: ['bag', 'nope'] })).toMatchObject({ on: false, offTypes: ['bag'] });
  });
  it('an own question needs text and right answer; up to 3 wrong ones, none the same as the right one', () => {
    expect(ownOf({ text: '', right: 'x' })).toBeNull();
    const o = ownOf({ id: 'a', text: ' Where is the key? ', right: 'Frame bag', wrong: ['Frame bag', 'Seat pack', '', 'Pocket', 'Bar', 'Fork'] });
    expect(o).toEqual({ id: 'a', text: 'Where is the key?', right: 'Frame bag', wrong: ['Seat pack', 'Pocket', 'Bar'], on: true, pin: false });
  });
  it('add, change, switch, pin, move and delete own questions', () => {
    let c = quizOf({});
    const a = newOwn({ text: 'Q1', right: 'A1' }, 1);
    const b = newOwn({ text: 'Q2', right: 'A2', wrong: ['B2', 'C2'] }, 2);
    c = putOwn(putOwn(c, a), b);
    expect(c.own.map((x) => x.text)).toEqual(['Q1', 'Q2']);
    c = putOwn(c, { ...a, text: 'Q1 new' });
    expect(c.own[0].text).toBe('Q1 new');
    c = patchOwn(c, b.id, { on: false, pin: true });
    expect(c.own[1]).toMatchObject({ on: false, pin: true });
    c = moveOwn(c, 1, 0);
    expect(c.own.map((x) => x.text)).toEqual(['Q2', 'Q1 new']);
    c = dropOwn(c, a.id);
    expect(c.own.map((x) => x.id)).toEqual([b.id]);
  });
  it('kinds of suggestions switch off and on; a card can be put away', () => {
    let c = setType({}, 'route', false);
    c = setType(c, 'bag', false);
    expect(c.offTypes).toEqual(['bag', 'route']);
    expect(setType(c, 'bag', true).offTypes).toEqual(['route']);
    expect(hideCard(c, `${P}t1`).hidden).toEqual([`${P}t1`]);
  });
});

describe('the questions from the trip', () => {
  const qs = generated(trip(), DATA, randomOf('x'));
  const byId = Object.fromEntries(qs.map((q) => [q.id, q]));
  const right = (q) => q.answers.find((a) => a.right).text;

  it('every question has 3–4 answers, exactly one right, no answer twice', () => {
    expect(qs.length).toBeGreaterThan(6);
    for (const q of qs) {
      expect(q.answers.length).toBeGreaterThanOrEqual(3);
      expect(q.answers.length).toBeLessThanOrEqual(4);
      expect(q.answers.filter((a) => a.right)).toHaveLength(1);
      expect(new Set(q.answers.map((a) => a.text)).size).toBe(q.answers.length);
      expect(TYPE_KEYS).toContain(q.type);
    }
  });
  it('in which bag: the bag the item is packed in', () => {
    expect(right(byId[`bag:${P}i2`])).toBe(`${P}Frame bag`);
    expect(byId[`bag:${P}i2`].text).toContain(`${P}Stove`);
  });
  it('how many: the pieces counted with their number (socks × 3)', () => {
    expect(right(byId['count:seat'])).toBe('4'); // tent + 3 socks
  });
  it('the route, the places, the longest day and the forecast', () => {
    expect(right(byId['route:km'])).toBe('212 km');
    expect(right(byId['route:hm'])).toMatch(/^3.?100 m$/);
    expect(right(byId['place:start'])).toBe(`${P}Biel`);
    expect(right(byId['place:finish'])).toBe(`${P}Delemont`);
    expect(right(byId.longest)).toContain(`${P}Saignelegier`); // day 2: 90 km
    expect(right(byId['weather:max'])).toBe('15 °C');
    expect(byId['weather:rain']).toBeTruthy();
  });
  it('nothing is invented: no route, no stages, no weights, no forecast → no such questions', () => {
    const bare = trip({ route: null, stages: null, forecast: null, days: 1 });
    const types = new Set(generated(bare, { ...DATA, items: ITEMS.map((i) => ({ ...i, weightG: null })) }, randomOf('y')).map((q) => q.type));
    expect([...types].sort()).toEqual(['bag', 'count']);
  });
  it('what weighs more: the heaviest, with the weights as a note', () => {
    const h = qs.filter((q) => q.type === 'heavier');
    expect(h.length).toBeGreaterThan(0);
    for (const q of h) expect(q.note).toMatch(/g|kg/);
  });
  it('near numbers differ from the right one and from each other', () => {
    const ws = nearNumbers(100, randomOf('n'));
    expect(ws).toHaveLength(3);
    expect(new Set(ws).size).toBe(3);
    expect(ws).not.toContain(100);
  });
});

describe('the quiz of an evening', () => {
  it('three questions, the same after a reload, of different kinds where possible', () => {
    const a = buildQuiz(trip(), DATA, {}, TODAY);
    const b = buildQuiz(trip(), DATA, {}, TODAY);
    expect(a).toHaveLength(PER_QUIZ);
    expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id));
    expect(new Set(a.map((q) => q.type)).size).toBe(PER_QUIZ);
  });
  it('hidden kinds stay out', () => {
    const c = { offTypes: TYPE_KEYS.filter((k) => k !== 'route') };
    const q = buildQuiz(trip(), DATA, c, TODAY);
    expect(q.map((x) => x.type)).toEqual(['route', 'route']); // only two route questions exist
  });
  it('pinned own questions always come; a switched-off one never', () => {
    const own = [{ id: 'p', text: 'Pinned?', right: 'Yes', wrong: ['No', 'Maybe'], pin: true }, { id: 'off', text: 'Off?', right: 'x', wrong: ['y', 'z'], on: false }];
    for (const day of [TODAY, addDays(TODAY, 1), addDays(TODAY, 2)]) {
      const q = buildQuiz(trip(), DATA, { own }, day);
      expect(q[0].id).toBe('own:p');
      expect(q.some((x) => x.id === 'own:off')).toBe(false);
    }
  });
  it('an own question without wrong answers is a «Weisst du\'s?» card', () => {
    const q = ownQuestion(ownOf({ id: 'k', text: 'Code of the lock?', right: '4711' }));
    expect(q).toMatchObject({ answers: [], reveal: '4711', type: 'own' });
  });
  it('not the questions of the evening before, while there is choice', () => {
    const first = buildQuiz(trip(), DATA, {}, TODAY);
    const log = [{ day: TODAY, tripId: `${P}t1`, right: 2, of: 3, ids: first.map((q) => q.id) }];
    const next = buildQuiz(trip(), DATA, { log }, addDays(TODAY, 1));
    expect(next.some((q) => first.some((f) => f.id === q.id))).toBe(false);
    expect(lastIds(log, addDays(TODAY, 1)).size).toBe(3);
    expect(lastIds(log, TODAY).size).toBe(0); // the same day is not «the evening before»
  });
  it('with little choice the old ones fill up', () => {
    const c = { offTypes: TYPE_KEYS.filter((k) => k !== 'route') };
    const log = [{ day: TODAY, tripId: `${P}t1`, right: 2, of: 2, ids: ['route:km', 'route:hm'] }];
    expect(buildQuiz(trip(), DATA, { ...c, log }, addDays(TODAY, 1))).toHaveLength(2);
  });
});

describe('trip, log and streak', () => {
  const past = (id, start) => ({ id: `${P}${id}`, title: id, startDate: start, days: 1, status: 'done' });
  const trips = [past('a', '2026-08-01'), past('b', '2026-09-01'), past('c', '2026-10-01'), trip()];
  it('the quiz is for the next trip that has not started', () => {
    expect(quizTrip(trips, TODAY).id).toBe(`${P}t1`);
    expect(quizTrip([past('a', '2026-08-01')], TODAY)).toBeNull();
    expect(quizTrip([{ ...trip(), skipped: true }], TODAY)).toBeNull();
  });
  it('a quiz counts once a day, for a trip still ahead', () => {
    let c = logResult({}, { trip: trip(), today: TODAY, right: 2, of: 3, ids: ['a'] });
    expect(c.log).toHaveLength(1);
    c = logResult(c, { trip: trip(), today: TODAY, right: 3, of: 3 });
    expect(c.log).toHaveLength(1); // the second round of the day does not count
    expect(todayResult(c.log, TODAY)).toMatchObject({ right: 2, of: 3 });
    expect(counts([], past('a', '2026-08-01'), TODAY)).toBe(false);
  });
  it('the streak counts trips in a row with a quiz; the trip ahead does not break it', () => {
    const log = [
      { day: '2026-08-31', tripId: `${P}b`, right: 3, of: 3, ids: [] },
      { day: '2026-09-30', tripId: `${P}c`, right: 1, of: 3, ids: [] },
    ];
    expect(streak(trips, log, TODAY)).toBe(2); // c, b; a had none
    expect(streak(trips, [...log, { day: TODAY, tripId: `${P}t1`, right: 2, of: 3 }], TODAY)).toBe(3);
    expect(streak(trips, [log[0]], TODAY)).toBe(0); // c had none: broken
    expect(lastResults(trips, log)[0]).toMatchObject({ tripId: `${P}c`, title: 'c' });
  });
  it('the evening card: only when on, on the evening before, not put away, not done', () => {
    const tr = trip();
    const at = { today: TODAY, hour: 19, eveningBefore };
    expect(showEveCard({}, tr, at)).toBe(true);
    expect(showEveCard({}, tr, { ...at, hour: 15 })).toBe(false);
    expect(showEveCard({ on: false }, tr, at)).toBe(false);
    expect(showEveCard({ hidden: [tr.id] }, tr, at)).toBe(false);
    expect(showEveCard({ log: [{ day: TODAY, tripId: tr.id, right: 1, of: 3 }] }, tr, at)).toBe(false);
    expect(showEveCard({}, { ...tr, startDate: addDays(TODAY, 2) }, at)).toBe(false);
  });
});
