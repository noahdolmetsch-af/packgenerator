// Paket T «Freie Zeit» (Noah 19.10.2026 «alle bauen»): the pure rules of Ich › Freie Zeit and its pages.
import { describe, it, expect } from 'vitest';
import { freiPart, collOfHash, queryOf, PAGES, IMPULSES, AREAS, impulsesOf, impulseOfDay, nextOf, areasOf, inArea, collsOf, STD_COLLS, linesOf, filterEntries, newEntry, lustPick, LUST_IDEAS, techOfWeek, tickRitual, eveningsInRow, ritualsOf, MAX_RITUALS, stepDone, essentialSpan, nightOf, phaseSummary, nextPiles, markLine, todayImpulse, impulseHref, inviteText } from '../src/lib/frei.js';
import { pageOf, placeOf } from '../src/lib/nav.js';
import DE from '../src/lib/i18n/de/index.js';

const P = 'test_data_frei_';

describe('addresses', () => {
  it('the eight pages, the collection and the tab of Aktiv', () => {
    expect(PAGES).toHaveLength(8);
    expect(freiPart('#/me/frei')).toBe('');
    expect(freiPart('#/me/frei/lust')).toBe('lust');
    expect(freiPart('#/me/frei/sammlung/recipes')).toBe('sammlung');
    expect(freiPart('#/me/frei/nonsense')).toBe('');
    expect(freiPart('#/flow/impulse?i=i05')).toBe('impulse');
    expect(collOfHash('#/me/frei/sammlung/own%201?x=1')).toBe('own 1');
    expect(queryOf('#/flow/impulse?i=i05&a=b', 'i')).toBe('i05');
    expect(pageOf('#/me/frei/abend')).toBe('frei');
    expect(placeOf(pageOf('#/me/frei'))).toBe('week'); // UI-Ziele #6 (Noah 20.10.2026): Freie Zeit is Planen › Freie Zeit
    expect(pageOf('#/flow/impulse')).toBe('impulse');
    expect(placeOf('impulse')).toBe('active');
  });
});

describe('impulses', () => {
  it('30 impulses in ten areas, every one with German', () => {
    expect(IMPULSES).toHaveLength(30);
    expect(AREAS).toHaveLength(10);
    for (const i of IMPULSES) {
      expect(AREAS.some((a) => a.id === i.area), i.id).toBe(true);
      expect(DE[i.title], i.title).toBeTruthy();
      expect(DE[i.text], i.text).toBeTruthy();
    }
  });
  it('edits, hidden, own; the impulse of the day skips hidden ones and stays the same all day', () => {
    const cfg = { edits: { i01: { title: `${P}mine`, text: 'x' } }, hidden: ['i02'], own: [{ id: 'own1', title: `${P}own`, area: 'joy' }] };
    const list = impulsesOf(cfg);
    expect(list).toHaveLength(31);
    expect(list.find((i) => i.id === 'i01')).toMatchObject({ title: `${P}mine`, edited: true });
    expect(list.find((i) => i.id === 'own1')).toMatchObject({ own: true });
    const a = impulseOfDay(list, '2026-10-19');
    expect(a.hidden).toBe(false);
    expect(impulseOfDay(list, '2026-10-19')).toBe(a);
    expect(nextOf(list.filter((i) => !i.hidden), a.id).id).not.toBe(a.id);
  });
  it('a deleted area: its impulses show under «Without an area»', () => {
    const cfg = { areas: [{ id: 'joy', hidden: true }] };
    const areas = areasOf(cfg);
    const orphans = inArea(impulsesOf(cfg), '', areas);
    expect(orphans.length).toBeGreaterThan(0);
    expect(orphans.every((i) => i.area === 'joy')).toBe(true);
  });
  it('Heute: none when switched off; «Try it» leads to its page or collection', () => {
    expect(todayImpulse({ onToday: false }, '2026-10-19')).toBeNull();
    expect(todayImpulse({}, '2026-10-19')).toBeTruthy();
    expect(impulseHref({ go: { page: 'lust' } })).toBe('#/me/frei/lust');
    expect(impulseHref({ go: { coll: 'recipes' } }, collsOf({}))).toBe('#/me/frei/sammlung/recipes');
    expect(impulseHref({ id: 'i20', go: { inline: 'silly' } })).toBe('#/flow/impulse?i=i20');
  });
  it('the invitation keeps the typed idea and time', () => {
    const tr = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v?.[k] ?? '');
    expect(inviteText('Kochen', 'Samstag', tr)).toContain('«Kochen»');
    expect(inviteText('Kochen', '', tr)).toContain('a day that suits you');
  });
});

describe('collections', () => {
  it('built-in ones, renamed, deleted, own ones', () => {
    const c = collsOf({ colls: [{ id: 'songs', name: `${P}Lieder` }, { id: 'recipes', hidden: true }, { id: 'own-1', own: true, name: `${P}Bücher` }] });
    expect(c.find((x) => x.id === 'songs').name).toBe(`${P}Lieder`);
    expect(c.find((x) => x.id === 'recipes').hidden).toBe(true);
    expect(c.find((x) => x.id === 'own-1')).toMatchObject({ own: true, type: 'free' });
    expect(STD_COLLS.every((id) => c.some((x) => x.id === id))).toBe(true);
  });
  it('ingredients: one per line, bullets and empty lines dropped', () => {
    expect(linesOf('- Pasta\n\n• Tomaten \n* Basilikum')).toEqual(['Pasta', 'Tomaten', 'Basilikum']);
  });
  it('filter by tag and search word', () => {
    const a = newEntry('places', { title: `${P}See`, data: { tags: ['Ruhe'] } }, { now: '2026-10-19T10:00:00Z' });
    const b = newEntry('places', { title: `${P}Turm`, data: { tags: ['Aussicht'] } }, { now: '2026-10-19T10:00:00Z' });
    expect(a.day).toBe('2026-10-19');
    expect(filterEntries([a, b], { tag: 'Ruhe' })).toEqual([a]);
    expect(filterEntries([a, b], { q: 'turm' })).toEqual([b]);
  });
});

describe('«What am I up for?»', () => {
  it('mood counts most; too long is left out; what worked comes first', () => {
    const top = lustPick(LUST_IDEAS, { mood: 'play', time: 30 });
    expect(top.length).toBeLessThanOrEqual(3);
    expect(top.every((x) => x.idea.min <= 30)).toBe(true);
    expect(top[0].why).toContain('mood');
    const ideas = [{ id: 'a', mood: ['easy'], min: 15 }, { id: 'b', mood: ['easy'], min: 15 }];
    expect(lustPick(ideas, { mood: 'easy' }, [{ what: 'b', ok: true }])[0].idea.id).toBe('b');
  });
  it('the technique of the week stays the same within a week', () => {
    const list = [{ id: 1 }, { id: 2 }, { id: 3 }];
    expect(techOfWeek(list, '2026-10-19')).toBe(techOfWeek(list, '2026-10-25'));
    expect(techOfWeek([], '2026-10-19')).toBeNull();
  });
});

describe('«My evening»', () => {
  it('at most three rituals; a tick, a second tap takes it back; evenings in a row', () => {
    const rituals = ritualsOf({ rituals: [1, 2, 3, 4].map((n) => ({ id: `r${n}`, name: `${P}${n}` })) });
    expect(rituals).toHaveLength(MAX_RITUALS);
    const one = [{ id: 'r1' }];
    let ticks = tickRitual({}, 'r1', '2026-10-18');
    ticks = tickRitual(ticks, 'r1', '2026-10-19');
    expect(eveningsInRow(one, ticks, '2026-10-19')).toBe(2);
    ticks = tickRitual(ticks, 'r1', '2026-10-19');
    expect(ticks.r1).toEqual(['2026-10-18']);
    expect(eveningsInRow(one, ticks, '2026-10-19')).toBe(1); // today not done yet: yesterday still counts
  });
});

describe('«What matters to me»', () => {
  it('a done step moves into the list; months between the entries', () => {
    const m = stepDone({ id: 'm', title: 'x', step: ' Bericht lesen ', done: [] }, '2026-10-19');
    expect(m).toMatchObject({ step: '', done: [{ text: 'Bericht lesen', day: '2026-10-19' }] });
    expect(essentialSpan([{ day: '2026-01-05' }, { day: '2026-10-19' }])).toBe(9);
    expect(essentialSpan([{ day: '2026-10-19' }])).toBe(0);
  });
});

describe('«First night»', () => {
  it('a safe plan and the summary of the day', () => {
    const n = nightOf({ night: { step: 9, phases: { way: [{ id: 'a', name: `${P}Riegel`, where: 'Oberrohr', reach: true }, { id: 'b', name: '' }], night: [{ id: 'c', name: `${P}Lampe` }] } } });
    expect(n.step).toBe(3);
    expect(n.phases.way).toHaveLength(1);
    expect(phaseSummary(n.phases)).toEqual({ n: 2, reach: 1, noPlace: 1 });
    expect(nightOf(null).step).toBe(0);
  });
});

describe('«For next time»', () => {
  it('proven, unused and missing over finished debriefs only', () => {
    const trips = [1, 2, 3].map((n) => ({ id: `t${n}`, entries: [{ itemId: 'lamp' }, { itemId: 'pillow' }] }));
    const debriefs = [
      { tripId: 't1', status: 'done', items: { pillow: 'unused' }, missing: [{ name: `${P}Spork` }] },
      { tripId: 't2', status: 'done', items: {}, missing: [{ name: `${P}spork` }, { name: `${P}Spork` }] },
      { tripId: 't3', status: 'open', items: { lamp: 'broken' }, missing: [] },
    ];
    const p = nextPiles({ trips, debriefs });
    expect(p.proven).toEqual([{ key: 'item:lamp', itemId: 'lamp', name: 'lamp', n: 2 }]);
    expect(p.unused.map((x) => [x.itemId, x.n])).toEqual([['pillow', 1]]);
    expect(p.missing).toHaveLength(1);
    expect(p.missing[0].n).toBe(2);
    expect(markLine('missing')).toBe('Take {name} next time');
  });
});
