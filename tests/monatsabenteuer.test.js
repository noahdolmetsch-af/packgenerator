// «Ein Abenteuer im Monat» (Träume und Neuland N12, Noah 07.11.2026 «ok N12»): the kinds, the turns and the list.
import { describe, it, expect } from 'vitest';
import { ADVENTURES, advCfg, adventuresOf, hiddenAdventures, adventureFor, showToday, monthOf, skipMonth, unskip, setToday, hideAdventure, addAdventure, renameAdventure, deleteAdventure } from '../src/lib/dreams/monatsabenteuer.js';

const P = 'test_data_gtp_';

describe('this month', () => {
  it('the bivouac only in the warm months, the others all year', () => {
    expect(adventuresOf(null, '2026-07').map((a) => a.id)).toEqual(['biwak', 'train', 'round']);
    expect(adventuresOf(null, '2026-12').map((a) => a.id)).toEqual(['train', 'round']);
  });

  it('the kinds take turns, month by month', () => {
    const ids = ['2026-05', '2026-06', '2026-07', '2026-08'].map((m) => adventureFor(null, m).id);
    expect(ids).toEqual(['round', 'biwak', 'train', 'round']);
    expect(new Set(ids.slice(0, 3)).size).toBe(3);
  });

  it('nothing in play: no adventure and no line', () => {
    let c = null;
    for (const a of ADVENTURES) c = hideAdventure(c, a.id);
    expect(adventuresOf(c, '2026-07')).toEqual([]);
    expect(adventureFor(c, '2026-07')).toBe(null);
    expect(showToday(c, '2026-07-10')).toBe(false);
  });
});

describe('the line on Today', () => {
  it('shows all month, «Not this month» closes it until the next month, «Show again» brings it back', () => {
    expect(showToday(null, '2026-11-04')).toBe(true);
    const c = skipMonth(null, monthOf('2026-11-04'));
    expect(showToday(c, '2026-11-20')).toBe(false);
    expect(showToday(c, '2026-12-01')).toBe(true);
    expect(showToday(unskip(c), '2026-11-20')).toBe(true);
  });

  it('can be switched off', () => {
    expect(showToday(setToday(null, false), '2026-11-04')).toBe(false);
    expect(advCfg(setToday(setToday(null, false), true)).today).toBe(true);
  });
});

describe('the list', () => {
  it('hide and show a built-in kind', () => {
    const c = hideAdventure(null, 'train');
    expect(adventuresOf(c, '2026-12').map((a) => a.id)).toEqual(['round']);
    expect(hiddenAdventures(c).map((a) => a.id)).toEqual(['train']);
    expect(adventuresOf(hideAdventure(c, 'train', false), '2026-12').map((a) => a.id)).toEqual(['train', 'round']);
  });

  it('own adventures: add, rename, delete; an own idea can be this month\'s', () => {
    let c = addAdventure(null, `  ${P}Am See schlafen `, 'o1');
    expect(adventuresOf(c, '2026-12').at(-1)).toEqual({ id: 'o1', text: `${P}Am See schlafen`, hint: '', own: true });
    c = renameAdventure(c, 'o1', `${P}Am Fluss schlafen`);
    expect(c.own[0].text).toBe(`${P}Am Fluss schlafen`);
    expect(addAdventure(c, '   ', 'o2')).toEqual(c);
    expect(renameAdventure(c, 'o1', '  ')).toEqual(c);
    let only = null;
    for (const a of ADVENTURES) only = hideAdventure(only, a.id);
    only = addAdventure(only, `${P}Idee`, 'o3');
    expect(adventureFor(only, '2026-12').text).toBe(`${P}Idee`);
    expect(deleteAdventure(c, 'o1').own).toEqual([]);
  });

  it('a stored value is cleaned', () => {
    expect(advCfg({ hidden: ['nope', 'round'], own: [{ id: 'x', text: ' ' }, null, { id: 'y', text: 'ok' }], skip: '2026', today: 'x' })).toEqual({ hidden: ['round'], own: [{ id: 'y', text: 'ok' }], skip: null, today: true });
  });
});
