// «Favoriten» on Heute (Noah 27.11.2026 «1-5a», step 2): the cards of the tile and the number behind «All n ›» (lib/quick/favcards.js).
import { describe, it, expect } from 'vitest';
import { FEATURE } from '../src/lib/features.js';
import { starter, addGroup, addPin, addView } from '../src/lib/quick/quicklinks.js';
import { favCards, favHidden, favTotal, favIcon, FAV_SHOWN, FAV_SUGGESTED } from '../src/lib/quick/favcards.js';
import DE from '../src/lib/i18n/de/index.js';

describe('Favoriten cards', () => {
  it('3a: the first six favourites show as cards, the rest sits behind «All n ›»', () => {
    const s = starter();
    expect(FAV_SHOWN).toBe(6);
    expect(FAV_SUGGESTED).toBe(2);
    expect(favCards(s)).toHaveLength(6);
    expect(favTotal(s)).toBe(s.pins.length);
    expect(favHidden(s)).toBe(s.pins.length - 6);
    expect(favHidden({ ...s, pins: s.pins.slice(0, 4) })).toBe(0);
    expect(favCards({ ...s, pins: s.pins.slice(0, 4) })).toHaveLength(4);
  });
  it('2a: a card has the name, a quiet second line (the note, else the group) and an icon', () => {
    const s = starter();
    const c = favCards(s)[0];
    expect(c.label).toBeTruthy();
    expect(c.sub).toBeTruthy(); // the group it sits in
    expect(c.icon).toBeTruthy();
    const noted = { ...s, pins: s.pins.map((p, i) => (i === 0 ? { ...p, note: 'my note' } : p)) };
    const first = favCards(noted)[0];
    expect(first.pin.note).toBe('my note');
    expect(first.sub).toBe('my note');
  });
  it('a typed group name is not translated; no group: no second line', () => {
    let s = addGroup({ groups: [], pins: [] }, 'Weekend');
    s = addPin(s, 'f.sos', s.groups[0].id);
    expect(favCards(s, (x) => `DE ${x}`)[0].sub).toBe('Weekend');
    const loose = addPin({ groups: [], pins: [] }, 'f.sos', '');
    expect(favCards(loose)[0].sub).toBe('');
  });
  it('the icon follows the group of the function; a view gets the link icon', () => {
    const ids = Object.keys(FEATURE).filter((f) => FEATURE[f].group);
    expect(favIcon({ feature: ids[0] })).not.toBe('link');
    expect(favIcon({ feature: 'f.gone' })).toBe('star');
    expect(favIcon({ href: '#/calendar' })).toBe('link');
    expect(typeof addView).toBe('function');
  });
  it('the new words are German', () => {
    for (const k of ['Change favourites', 'Often used', 'Add «{name}» to your favourites', 'No favourites yet. Tap the small star on a card, or «Change favourites».', 'A tap on the star takes a favourite out, the arrows put them in order.']) expect(DE[k], k).toBeTruthy();
  });
});
