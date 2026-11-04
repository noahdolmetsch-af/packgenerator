// «Velo-Weisheit» (Geheimmenü H6): the sayings are a list of «Listen und Typen»; the logo picks one that is not hidden.
import { describe, it, expect, afterEach } from 'vitest';
import { SAYINGS, SAYINGS_STD, sayingsOffered, sayingText, pickSaying } from '../src/lib/logo/sayings.js';
import { APP_LISTS } from '../src/lib/applists.js';
import { STANDARD_LIST, listFor } from '../src/lib/standard.js';
import { applyLists, addOwn, edit, remove, toggleHidden } from '../src/lib/lists.js';
import de from '../src/lib/i18n/de/index.js';

const tr = (s) => `T:${s}`;
afterEach(() => applyLists({}));

describe('sayings in the logo', () => {
  it('about twenty, each one with a German text and unique', () => {
    expect(SAYINGS.length).toBeGreaterThanOrEqual(15);
    expect(new Set(SAYINGS.map((q) => q[0])).size).toBe(SAYINGS.length);
    for (const [en, mundart] of SAYINGS) expect(de[en], en).toBe(mundart);
  });
  it('is an app list of «Listen und Typen»', () => {
    expect(APP_LISTS).toContain('sayings');
    expect(STANDARD_LIST.sayings.entries()).toEqual(SAYINGS_STD);
  });
  it('picks one by chance and never the same twice in a row', () => {
    const off = sayingsOffered();
    for (const r of [0, 0.3, 0.7, 0.999]) expect(pickSaying(off, off[0].id, () => r)).not.toBe(off[0].id);
    expect(pickSaying(off, null, () => 0)).toBe('sy0');
  });
  it('a hidden or deleted saying is not picked; none left gives null', () => {
    let v = toggleHidden(undefined, 'sy0');
    v = remove(v, listFor('sayings', { sayings: v }).find((e) => e.id === 'sy1'));
    applyLists({ sayings: v });
    const ids = sayingsOffered().map((e) => e.id);
    expect(ids).not.toContain('sy0');
    expect(ids).not.toContain('sy1');
    let all;
    for (const e of SAYINGS_STD) all = remove(all, { id: e.id, own: false });
    applyLists({ sayings: all });
    expect(pickSaying()).toBeNull();
  });
  it('an own or renamed saying shows as typed (never through t()), a Standard one through t()', () => {
    const own = addOwn(undefined, { name: 'Z Bärg ufe, z Tal abe.' }, 'own-x');
    applyLists({ sayings: own.value });
    expect(sayingText('own-x', tr)).toBe('Z Bärg ufe, z Tal abe.');
    expect(sayingText('sy0', tr)).toBe(`T:${SAYINGS[0][0]}`);
    const e = listFor('sayings', { sayings: own.value }).find((x) => x.id === 'sy0');
    applyLists({ sayings: edit(own.value, e, { name: 'Gägewind, super!' }) });
    expect(sayingText('sy0', tr)).toBe('Gägewind, super!');
  });
});
